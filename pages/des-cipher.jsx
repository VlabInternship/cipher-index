import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";

/* =======================================================================
DES-64 (ECB) single-file implementation + round trace (typed-array safe)
======================================================================= */

// ---------------- Text / bytes helpers ----------------
const te = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
const td = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

const toBytes8 = (str) => {
  const raw = te ? te.encode(str) : new Uint8Array(Array.from(str).map(ch => ch.charCodeAt(0)));
  const out = new Uint8Array(8).fill(0x20);
  out.set(raw.slice(0, 8));
  return out;
};
const bytesToPrintableAscii = (bytes) => {
  let s = "";
  for (const b of bytes) s += (b >= 32 && b <= 126) ? String.fromCharCode(b) : ("\\x" + b.toString(16).padStart(2, "0"));
  return s;
};
const hexToBytes = (hex) => {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
};
const bytesToHex = (bytes) =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

// ---------------- Bit/typed-array helpers ----------------
const u8 = (len) => new Uint8Array(len);

const bytesToBits = (bytes) => {
  const out = u8(bytes.length * 8);
  let k = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    for (let j = 7; j >= 0; j--) out[k++] = (b >> j) & 1; // MSB → LSB
  }
  return out;
};
const bitsToBytes = (bits) => {
  const out = u8(bits.length / 8);
  for (let i = 0; i < out.length; i++) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j];
    out[i] = v;
  }
  return out;
};
const concatU8 = (a, b) => {
  const out = u8(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
};
const copySliceU8 = (arr, start, end) => {
  const view = arr.subarray(start, end);
  const out = u8(view.length);
  out.set(view);
  return out;
};
const permute = (srcBits, table /* 1-based */) => {
  const out = u8(table.length);
  for (let i = 0; i < table.length; i++) out[i] = srcBits[table[i] - 1];
  return out;
};
const xorBits = (a, b) => {
  const out = u8(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
};
const rotlBits = (arr, n) => {
  const len = arr.length;
  const out = u8(len);
  for (let i = 0; i < len; i++) out[i] = arr[(i + n) % len];
  return out;
};

// ---------------- DES tables ----------------
const IP = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7
];
const FP = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25
];
const E = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1
];
const P = [
  16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
  2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25
];
const PC1 = [
  57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4
];
const PC2 = [
  14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
];
const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

const SBOX = [
  // S1
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
  ],
  // S2
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
  ],
  // S3
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
  ],
  // S4
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
  ],
  // S5
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
  ],
  // S6
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
  ],
  // S7
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
  ],
  // S8
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
  ]
];

// ---------------- DES core operations ----------------
const sboxSubstitute = (bits48) => {
  const out = u8(32);
  for (let i = 0; i < 8; i++) {
    const off = i * 6;
    const b0 = bits48[off + 0], b1 = bits48[off + 1], b2 = bits48[off + 2],
      b3 = bits48[off + 3], b4 = bits48[off + 4], b5 = bits48[off + 5];
    const row = (b0 << 1) | b5;
    const col = (b1 << 3) | (b2 << 2) | (b3 << 1) | b4;
    const val = SBOX[i][row][col]; // 0..15

    // write 4 bits MSB->LSB
    out[i * 4 + 0] = (val >> 3) & 1;
    out[i * 4 + 1] = (val >> 2) & 1;
    out[i * 4 + 2] = (val >> 1) & 1;
    out[i * 4 + 3] = val & 1;
  }
  return out;
};

const keySchedule = (keyBytes8) => {
  // 64 -> PC1 -> 56, then split C/D (28 each), rotate per round, PC2 -> 48
  const keyBits = bytesToBits(keyBytes8);
  const pc1 = permute(keyBits, PC1);
  let C = copySliceU8(pc1, 0, 28);
  let D = copySliceU8(pc1, 28, 56);
  const subkeys = [];
  for (let r = 0; r < 16; r++) {
    C = rotlBits(C, SHIFTS[r]);
    D = rotlBits(D, SHIFTS[r]);
    const cd = concatU8(C, D); // 56
    const k = permute(cd, PC2); // 48
    subkeys.push(k);
  }
  return subkeys; // K1..K16
};

const desRound = (L, R, K) => {
  const ER = permute(R, E); 
  const x = xorBits(ER, K);
  const s = sboxSubstitute(x);
  const p = permute(s, P); 
  const newR = xorBits(L, p);
  const newL = R;
  return { newL, newR, trace: { L, R, ER, XOR: x, S: s, P: p, K } };
};

// Encrypt/decrypt 64-bit block; decrypt uses reversed keys
const desEncryptBits = (bits64, subkeys /* K1..K16 */) => {
  const ip = permute(bits64, IP);
  let L = copySliceU8(ip, 0, 32);
  let R = copySliceU8(ip, 32, 64);
  const rounds = [];

  for (let i = 0; i < 16; i++) {
    const { newL, newR, trace } = desRound(L, R, subkeys[i]);
    rounds.push(trace);
    L = newL; R = newR;
  }
  // Final swap
  const preOut = concatU8(R, L);
  const fp = permute(preOut, FP);
  return { result: fp, rounds };
};

const desDecryptBits = (bits64, subkeys /* K1..K16 */) => {
  const ip = permute(bits64, IP);
  let L = copySliceU8(ip, 0, 32);
  let R = copySliceU8(ip, 32, 64);
  const rounds = [];

  // Use keys in reverse
  for (let i = 15; i >= 0; i--) {
    const { newL, newR, trace } = desRound(L, R, subkeys[i]);
    rounds.push(trace);
    L = newL; R = newR;
  }
  const preOut = concatU8(R, L);
  const fp = permute(preOut, FP);
  // Note: rounds are in reverse order; reverse for display so it's 1..16
  rounds.reverse();
  return { result: fp, rounds };
};

// ---------------- Display helpers ----------------
const bitsToHexNibbles = (bits) => {
  const out = [];
  for (let i = 0; i < bits.length; i += 4) {
    const v = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    out.push(v.toString(16).toUpperCase());
  }
  return out; // array of hex chars
};

const NibbleGrid = ({ title, bits, perRow = 16, highlightedNibbles = [], animationPhase = '', currentStep = '' }) => {
  const nibbles = bitsToHexNibbles(bits);
  
  const getNibbleClassName = (index) => {
    const isHighlighted = highlightedNibbles.includes(index);
    let baseClass = "w-8 h-8 border-2 rounded flex items-center justify-center text-sm font-mono transition-all duration-500 transform";
    
    if (isHighlighted) {
      if (animationPhase === 'processing') {
        return `${baseClass} border-amber-500 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 scale-110 shadow-lg animate-pulse`;
      } else if (animationPhase === 'completed') {
        return `${baseClass} border-emerald-500 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 scale-105 shadow-md`;
      }
    }
    
    if (animationPhase === 'pending') {
      return `${baseClass} border-gray-300 bg-gray-50 text-gray-400 scale-95`;
    }
    
    return `${baseClass} border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 hover:scale-105 shadow-sm`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        {title}
        {currentStep && (
          <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {currentStep}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {nibbles.map((h, i) => (
          <div
            key={i}
            className={getNibbleClassName(i)}
            title={`Nibble ${i}: 0x${h}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-600 font-mono break-all">{nibbles.join("")}</div>
      <div className="mt-1 text-xs text-gray-500 text-center">{bits.length} bits</div>
    </div>
  );
};

const HalfRow = ({ title, bits32 }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="font-semibold text-gray-800 mb-2">{title}</div>
    <div className="font-mono text-sm bg-gray-50 rounded p-2 overflow-x-auto">
      {bitsToHexNibbles(bits32).join("")}
    </div>
  </div>
);

const DESSubkeyVisualization = ({ title, subkey, isActive = false }) => {
  if (!subkey) return null;
  
  return (
    <div className={`bg-white rounded-lg shadow-lg border p-4 ${isActive ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
      <div className={`font-bold mb-3 flex items-center gap-2 ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
        {title}
        {isActive && (
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </div>
      <NibbleGrid 
        title="48-bit Subkey" 
        bits={subkey}
        animationPhase={isActive ? 'processing' : 'pending'}
      />
    </div>
  );
};

const DESSBoxVisualization = ({ title, inputBits, outputBits, mode = 'encrypt' }) => {
  if (!inputBits || !outputBits) return null;
  
  // Convert 48-bit input to 8 6-bit chunks and 32-bit output to 8 4-bit chunks
  const sboxLookups = [];
  for (let i = 0; i < 8; i++) {
    const inputChunk = inputBits.slice(i * 6, (i + 1) * 6);
    const outputChunk = outputBits.slice(i * 4, (i + 1) * 4);
    
    // Calculate row and column for S-box lookup
    const b0 = inputChunk[0], b1 = inputChunk[1], b2 = inputChunk[2];
    const b3 = inputChunk[3], b4 = inputChunk[4], b5 = inputChunk[5];
    const row = (b0 << 1) | b5;
    const col = (b1 << 3) | (b2 << 2) | (b3 << 1) | b4;
    const sboxValue = SBOX[i][row][col];
    
    sboxLookups.push({
      sboxIndex: i + 1,
      input: inputChunk,
      output: outputChunk,
      row,
      col,
      sboxValue,
      inputHex: bitsToHexNibbles(inputChunk).join(''),
      outputHex: bitsToHexNibbles(outputChunk).join('')
    });
  }
  
  return (
    <div className="space-y-4">
      {/* S-box lookup summary */}
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4">
        <div className="font-bold text-green-700 mb-3 flex items-center gap-2">
          {title}
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
            8 S-boxes
          </span>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {sboxLookups.slice(0, 6).map((lookup, index) => (
            <div key={index} className="flex items-center justify-between text-xs p-2 bg-green-50 rounded border border-green-200">
              <span className="font-mono text-green-700 min-w-[3rem]">
                S{lookup.sboxIndex}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-blue-600">
                R{lookup.row}C{lookup.col}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-green-600">
                {lookup.sboxValue}
              </span>
            </div>
          ))}
          {sboxLookups.length > 6 && (
            <div className="text-xs text-gray-500 text-center py-1">
              ... and {sboxLookups.length - 6} more S-box lookups
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DESExpansionVisualization = ({ title, inputBits, outputBits }) => {
  if (!inputBits || !outputBits) return null;
  
  // Create expansion mapping showing how 32 bits become 48 bits
  const expansionMappings = [];
  for (let i = 0; i < 48; i++) {
    const sourcePos = E[i]; // 1-based position in original 32-bit input
    const sourceBit = inputBits[sourcePos - 1]; // Convert to 0-based
    const outputPos = i + 1; // 1-based output position
    
    expansionMappings.push({
      outputPos,
      sourcePos,
      sourceBit,
      isDuplicate: expansionMappings.some(m => m.sourcePos === sourcePos)
    });
  }
  
  // Group by input positions to show duplications
  const inputPositions = {};
  expansionMappings.forEach(mapping => {
    if (!inputPositions[mapping.sourcePos]) {
      inputPositions[mapping.sourcePos] = [];
    }
    inputPositions[mapping.sourcePos].push(mapping.outputPos);
  });
  
  return (
    <div className="space-y-4">
      {/* Expansion summary */}
      <div className="bg-white rounded-lg shadow-lg border border-cyan-200 p-4">
        <div className="font-bold text-cyan-700 mb-3 flex items-center gap-2">
          {title}
          <span className="text-xs bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full">
            32 → 48 bits
          </span>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Object.entries(inputPositions).slice(0, 8).map(([sourcePos, outputPositions], index) => (
            <div key={index} className="flex items-center justify-between text-xs p-2 bg-cyan-50 rounded border border-cyan-200">
              <span className="font-mono text-cyan-700 min-w-[3rem]">
                Bit {sourcePos}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-blue-600">
                {inputBits[sourcePos - 1]}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-cyan-600">
                Pos {outputPositions.join(', ')}
              </span>
            </div>
          ))}
          {Object.keys(inputPositions).length > 8 && (
            <div className="text-xs text-gray-500 text-center py-1">
              ... and {Object.keys(inputPositions).length - 8} more bit expansions
            </div>
          )}
        </div>
      </div>
      
      {/* Expansion table visualization */}
      <div className="bg-white rounded-lg shadow-lg border border-cyan-200 p-4">
        <div className="font-bold text-cyan-700 mb-3 text-sm">Expansion (E-box) Table</div>
        <div className="grid grid-cols-12 gap-1 text-xs">
          {E.map((sourcePos, outputIndex) => (
            <div
              key={outputIndex}
              className="flex flex-col items-center p-1 bg-cyan-50 rounded border border-cyan-200 hover:bg-cyan-100 transition-colors"
              title={`Output position ${outputIndex + 1} ← Input position ${sourcePos}`}
            >
              <div className="font-mono text-cyan-600 text-xs">{outputIndex + 1}</div>
              <div className="text-gray-500">←</div>
              <div className="font-mono text-cyan-700 text-xs font-bold">{sourcePos}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Output position ← Input position mapping
        </div>
      </div>
    </div>
  );
};

const DESFeistelXORVisualization = ({ title, leftHalf, roundFunctionOutput, result }) => {
  if (!leftHalf || !roundFunctionOutput || !result) return null;
  
  // Create XOR operation mapping
  const xorMappings = [];
  for (let i = 0; i < 32; i++) {
    const leftBit = leftHalf[i];
    const fBit = roundFunctionOutput[i];
    const resultBit = result[i];
    
    xorMappings.push({
      position: i + 1,
      leftBit,
      fBit,
      resultBit
    });
  }
  
  return (
    <div className="space-y-4">
      {/* XOR operation summary */}
      <div className="bg-white rounded-lg shadow-lg border border-red-200 p-4">
        <div className="font-bold text-red-700 mb-3 flex items-center gap-2">
          {title}
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
            L ⊕ f(R,K)
          </span>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {xorMappings.slice(0, 8).map((mapping, index) => (
            <div key={index} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded border border-red-200">
              <span className="font-mono text-red-700 min-w-[3rem]">
                Bit {mapping.position}
              </span>
              <span className="text-gray-600">:</span>
              <span className="font-mono text-blue-600">
                {mapping.leftBit}
              </span>
              <span className="text-gray-600">⊕</span>
              <span className="font-mono text-green-600">
                {mapping.fBit}
              </span>
              <span className="text-gray-600">=</span>
              <span className="font-mono text-red-600">
                {mapping.resultBit}
              </span>
            </div>
          ))}
          {xorMappings.length > 8 && (
            <div className="text-xs text-gray-500 text-center py-1">
              ... and {xorMappings.length - 8} more XOR operations
            </div>
          )}
        </div>
      </div>
      
      {/* Visual XOR explanation */}
      <div className="bg-white rounded-lg shadow-lg border border-red-200 p-4">
        <div className="font-bold text-red-700 mb-3 text-sm">Feistel XOR Operation</div>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="bg-blue-100 px-3 py-2 rounded border border-blue-200">
              <span className="font-mono text-blue-700">L{leftHalf ? leftHalf.length : 32}</span>
              <div className="text-xs text-blue-600">Left Half</div>
            </div>
            <span className="text-gray-600 text-lg">⊕</span>
            <div className="bg-green-100 px-3 py-2 rounded border border-green-200">
              <span className="font-mono text-green-700">f(R,K)</span>
              <div className="text-xs text-green-600">Round Function</div>
            </div>
            <span className="text-gray-600 text-lg">=</span>
            <div className="bg-red-100 px-3 py-2 rounded border border-red-200">
              <span className="font-mono text-red-700">R{result ? result.length : 32}</span>
              <div className="text-xs text-red-600">New Right Half</div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Bit-wise XOR of left half with round function output
        </div>
      </div>
    </div>
  );
};


const AnimatedDESVisualization = ({ 
  isAnimating, 
  animationSteps, 
  currentStepIndex, 
  mode,
  onStepChange,
  onToggleAnimation
}) => {
  if (animationSteps.length === 0) return null;
  
  const currentStep = animationSteps[currentStepIndex] || {};
  const stepNames = {
    'initial': 'Initial Permutation',
    'expansion': 'Expansion (E-box)',
    'keyMixing': 'Key Mixing (XOR)',
    'sboxSubstitution': 'S-box Substitution', 
    'permutation': 'Permutation (P-box)',
    'feistelXor': 'Feistel XOR',
    'final': 'Final Permutation'
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < animationSteps.length - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const goToStep = (index) => {
    onStepChange(index);
  };
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200 p-6">
      <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        DES Round Visualization
      </h3>
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <ChevronDown className="rotate-90" size={16} />
            Previous
          </button>
          
          <button
            onClick={onToggleAnimation}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
              isAnimating 
                ? 'bg-amber-500 text-white hover:bg-amber-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isAnimating ? (
              <>
                <RotateCcw size={16} />
                Pause
              </>
            ) : (
              <>
                <Play size={16} />
                Auto Play
              </>
            )}
          </button>
          
          <button
            onClick={goToNextStep}
            disabled={currentStepIndex === animationSteps.length - 1}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Next
            <ChevronDown className="-rotate-90" size={16} />
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Step {currentStepIndex + 1} of {animationSteps.length}
        </div>
      </div>

      {/* Step Timeline */}
      <div className="mb-6 bg-white rounded-lg p-4 border border-blue-200">
        <div className="text-sm font-medium text-gray-700 mb-3">Step Timeline</div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {animationSteps.map((step, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`min-w-[60px] h-8 rounded text-xs font-medium transition-all ${
                index === currentStepIndex
                  ? 'bg-blue-500 text-white scale-105 shadow-md'
                  : index < currentStepIndex
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={stepNames[step.type] || 'Step'}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      
      {/* Current Step Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="flex justify-center">
          <NibbleGrid
            title={stepNames[currentStep.type] || 'Processing...'}
            bits={currentStep.data}
            highlightedNibbles={currentStep.highlightedNibbles || []}
            animationPhase={currentStep.phase || 'processing'}
            currentStep={`Step ${currentStepIndex + 1}/${animationSteps.length}`}
          />
        </div>
        
        {/* Conditional right panel based on step type */}
        <div className="flex justify-center">
          {(currentStep.type === 'keyMixing' || currentStep.type === 'initial') && currentStep.subkey && (
            <DESSubkeyVisualization
              title={`Round ${currentStep.roundNumber} Subkey`}
              subkey={currentStep.subkey}
              isActive={true}
            />
          )}
          
          {currentStep.type === 'sboxSubstitution' && currentStep.inputBits && (
            <DESSBoxVisualization
              title="S-box Substitution"
              inputBits={currentStep.inputBits}
              outputBits={currentStep.data}
              mode={mode}
            />
          )}
          
          {currentStep.type === 'expansion' && currentStep.inputBits && (
            <DESExpansionVisualization
              title="Expansion Function"
              inputBits={currentStep.inputBits}
              outputBits={currentStep.data}
            />
          )}
          
          {currentStep.type === 'feistelXor' && currentStep.leftHalf && currentStep.roundFunctionOutput && (
            <DESFeistelXORVisualization
              title="Feistel XOR"
              leftHalf={currentStep.leftHalf}
              roundFunctionOutput={currentStep.roundFunctionOutput}
              result={currentStep.data}
            />
          )}
          
          {currentStep.type === 'permutation' && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <div className="text-2xl mb-2">🔄</div>
                <div className="font-medium mb-1">P-box Permutation</div>
                <div className="text-sm">32-bit permutation</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Step Progress Indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round((currentStepIndex + 1) / animationSteps.length * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / animationSteps.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Step Explanation */}
      <div className="bg-white rounded-lg border border-blue-200 p-4">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="font-medium">{stepNames[currentStep.type] || 'Processing...'}</span>
        </div>
        <div className="text-sm text-gray-700">
          {currentStep.description || getStepDescription(currentStep.type, mode)}
        </div>
        {currentStep.roundNumber !== undefined && (
          <div className="text-xs text-blue-600 mt-2 font-medium">
            Round {currentStep.roundNumber} of 16
          </div>
        )}
      </div>

      {/* Keyboard Hints */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        💡 Keyboard shortcuts: ← → navigate steps • Space pause/play • Home/End jump to start/end
      </div>
    </div>
  );
};

const getStepDescription = (stepType, mode) => {
  const descriptions = {
    'initial': mode === 'encrypt' 
      ? 'Initial permutation rearranges the 64-bit plaintext according to the IP table'
      : 'Initial permutation applied to ciphertext before starting decryption rounds',
    'expansion': 'Expansion function (E-box) expands the 32-bit right half to 48 bits using duplication and permutation',
    'keyMixing': 'XOR operation combines the expanded 48-bit data with the current round subkey',
    'sboxSubstitution': 'S-box substitution provides non-linearity - eight 6-bit inputs become eight 4-bit outputs',
    'permutation': 'P-box permutation rearranges the 32 bits from S-box output according to permutation table P',
    'feistelXor': 'Feistel XOR combines the P-box output with the left half, completing the round function',
    'final': mode === 'encrypt'
      ? 'Final permutation (FP = IP⁻¹) produces the final 64-bit ciphertext'
      : 'Final permutation produces the decrypted 64-bit plaintext'
  };
  
  return descriptions[stepType] || 'Processing DES transformation...';
};

const CollapsibleRound = ({ roundIndex, step, openDefault = false }) => {
  const [open, setOpen] = useState(openDefault);
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="font-semibold text-gray-800">Round {roundIndex}</div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <HalfRow title="L (in)" bits32={step.L} />
          <HalfRow title="R (in)" bits32={step.R} />
          <NibbleGrid title="E(R) 48" bits={step.ER} />
          <NibbleGrid title="E(R) ⊕ Kᵣ" bits={step.XOR} />
          <NibbleGrid title="S-Boxes → 32" bits={step.S} />
          <NibbleGrid title="P-Box" bits={step.P} />
        </div>
      )}
    </div>
  );
};

// ---------------- React component ----------------
const DESCipher = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("theory");
  const [mode, setMode] = useState("encrypt");
  const [plaintext, setPlaintext] = useState("");
  const [key, setKey] = useState("");
  const [cipherInput, setCipherInput] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [trace, setTrace] = useState([]);
  const [initial, setInitial] = useState(null);
  const [final, setFinal] = useState(null);
  const [subkeys, setSubkeys] = useState([]);
  const [error, setError] = useState("");
  const [keyError, setKeyError] = useState("");
  const [inputError, setInputError] = useState("");
  const [warnings, setWarnings] = useState([]);
  
  // Animation states
  const [animationSteps, setAnimationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [animationInterval, setAnimationInterval] = useState(null);

  const reset = () => {
    setIsAnimating(false);
    setTrace([]);
    setInitial(null);
    setFinal(null);
    setError("");
    setKeyError("");
    setInputError("");
    setWarnings([]);
    setAnimationSteps([]);
    setCurrentStepIndex(0);
    setShowAnimation(false);
    setAutoPlay(false);
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
  };

  // Navigation functions
  const handleStepChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < animationSteps.length) {
      setCurrentStepIndex(newIndex);
    }
  };

  const toggleAutoPlay = () => {
    if (autoPlay) {
      // Stop auto play
      setAutoPlay(false);
      setIsAnimating(false);
      if (animationInterval) {
        clearInterval(animationInterval);
        setAnimationInterval(null);
      }
    } else {
      // Start auto play
      setAutoPlay(true);
      setIsAnimating(true);
      const interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= animationSteps.length - 1) {
            // Reached end, stop auto play
            setAutoPlay(false);
            setIsAnimating(false);
            clearInterval(interval);
            setAnimationInterval(null);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
      setAnimationInterval(interval);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (!showAnimation || animationSteps.length === 0) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleStepChange(currentStepIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleStepChange(currentStepIndex + 1);
          break;
        case ' ':
          event.preventDefault();
          toggleAutoPlay();
          break;
        case 'Home':
          event.preventDefault();
          handleStepChange(0);
          break;
        case 'End':
          event.preventDefault();
          handleStepChange(animationSteps.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnimation, animationSteps.length, currentStepIndex, autoPlay]);

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [animationInterval]);

  // Generate animation steps for DES visualization (without P-box detail)
  const generateDESAnimationSteps = (trace, mode, initialBits, subkeys) => {
    const steps = [];
    
    // Initial permutation
    steps.push({
      type: 'initial',
      data: initialBits,
      phase: 'processing',
      roundNumber: 0,
      subkey: subkeys[0]
    });
    
    // Process each round
    trace.forEach((round, roundIndex) => {
      const roundNumber = roundIndex + 1;
      const currentSubkey = subkeys[roundIndex];
      
      // Expansion
      steps.push({
        type: 'expansion',
        data: round.ER,
        inputBits: round.R, // Right half is input to expansion
        phase: 'processing',
        roundNumber: roundNumber,
        subkey: currentSubkey
      });
      
      // Key mixing (XOR)
      steps.push({
        type: 'keyMixing',
        data: round.XOR,
        phase: 'processing',
        roundNumber: roundNumber,
        subkey: currentSubkey
      });
      
      // S-box substitution
      steps.push({
        type: 'sboxSubstitution',
        data: round.S,
        inputBits: round.XOR,
        phase: 'processing',
        roundNumber: roundNumber,
        subkey: currentSubkey
      });
      
      // P-box permutation
      steps.push({
        type: 'permutation',
        data: round.P,
        phase: 'processing',
        roundNumber: roundNumber,
        subkey: currentSubkey
      });
      
      // Feistel XOR (calculate new right half)
      const newR = xorBits(round.L, round.P); // L ⊕ f(R,K)
      steps.push({
        type: 'feistelXor',
        data: newR,
        leftHalf: round.L,
        roundFunctionOutput: round.P,
        phase: 'completed',
        roundNumber: roundNumber,
        subkey: currentSubkey
      });
    });
    
    return steps;
  };

  // Run animated explanation
  const runAnimatedExplanation = async () => {
    // First run the core encryption/decryption to get trace
    const keyValidation = validateKey(key);
    const inputValidation = validateInput(mode === "encrypt" ? plaintext : cipherInput, mode === "encrypt");
    
    setKeyError(keyValidation.errors.join(", "));
    setInputError(inputValidation.errors.join(", "));
    setWarnings([...keyValidation.warnings, ...inputValidation.warnings]);
    setError("");
    
    if (keyValidation.errors.length > 0 || inputValidation.errors.length > 0) {
      return;
    }
    
    setTrace([]);
    setInitial(null);
    setFinal(null);

    const keyBytes = toBytes8(key);
    const Ks = keySchedule(keyBytes);
    setSubkeys(Ks);

    let bits, result, rounds;
    
    if (mode === "encrypt") {
      const ptBytes = toBytes8(plaintext);
      bits = bytesToBits(ptBytes);
      setInitial(bits);
      const encryptResult = desEncryptBits(bits, Ks);
      result = encryptResult.result;
      rounds = encryptResult.rounds;
      setFinal(result);
      const outBytes = bitsToBytes(result);
      setCipherInput(bytesToHex(outBytes));
    } else {
      const inBytes = parseCipherInput(cipherInput);
      if (inBytes.length !== 8) { 
        setError("Ciphertext must be 8 bytes (16 hex chars or 8 ASCII)."); 
        return; 
      }
      bits = bytesToBits(inBytes);
      setInitial(bits);
      const decryptResult = desDecryptBits(bits, Ks);
      result = decryptResult.result;
      rounds = decryptResult.rounds;
      setFinal(result);
      const outBytes = bitsToBytes(result);
      setPlaintext(bytesToPrintableAscii(outBytes));
    }
    
    setTrace(rounds);
    
    // Generate animation steps
    const steps = generateDESAnimationSteps(rounds, mode, bits, Ks);
    setAnimationSteps(steps);
    setCurrentStepIndex(0);
    setShowAnimation(true);
    
    // Start with manual navigation (user can enable auto-play if desired)
    setIsAnimating(false);
    setAutoPlay(false);
  };

  const validateKey = (keyStr) => {
    const errors = [];
    const warnings = [];
    
    if (!keyStr) {
      errors.push("Key is required");
    } else if (keyStr.length < 8) {
      warnings.push(`Key is ${keyStr.length} chars, will be padded to 8 with spaces`);
    } else if (keyStr.length > 8) {
      warnings.push(`Key is ${keyStr.length} chars, will be truncated to 8`);
    }
    
    // Check for weak keys (all same character)
    if (keyStr && new Set(keyStr).size === 1) {
      warnings.push("Weak key detected: all characters are the same");
    }
    
    // Check for non-printable characters
    const nonPrintable = keyStr.split('').filter(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126);
    if (nonPrintable.length > 0) {
      warnings.push("Key contains non-printable characters");
    }
    
    return { errors, warnings };
  };
  
  const validateInput = (inputStr, isEncrypt) => {
    const errors = [];
    const warnings = [];
    
    if (!inputStr) {
      errors.push(`${isEncrypt ? 'Plaintext' : 'Ciphertext'} is required`);
      return { errors, warnings };
    }
    
    if (isEncrypt) {
      // Validate plaintext
      if (inputStr.length < 8) {
        warnings.push(`Plaintext is ${inputStr.length} chars, will be padded to 8 with spaces`);
      } else if (inputStr.length > 8) {
        warnings.push(`Plaintext is ${inputStr.length} chars, will be truncated to 8`);
      }
      
      const nonPrintable = inputStr.split('').filter(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126);
      if (nonPrintable.length > 0) {
        warnings.push("Plaintext contains non-printable characters");
      }
    } else {
      // Validate ciphertext
      const clean = inputStr.replace(/\s+/g, '');
      const isHex = /^[0-9a-fA-F]+$/.test(clean);
      
      if (isHex) {
        if (clean.length !== 16) {
          errors.push(`Hex ciphertext must be exactly 16 characters (got ${clean.length})`);
        }
      } else {
        // Assume ASCII input
        if (inputStr.length !== 8) {
          errors.push(`ASCII ciphertext must be exactly 8 characters (got ${inputStr.length})`);
        }
        
        const nonPrintable = inputStr.split('').filter(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126);
        if (nonPrintable.length > 0) {
          warnings.push("Ciphertext contains non-printable characters");
        }
      }
    }
    
    return { errors, warnings };
  };
  
  const parseCipherInput = (val) => {
    const clean = val.trim();
    const isHex = clean.length > 0 && clean.length % 2 === 0 && /^[0-9a-fA-F\s]+$/.test(clean);
    return isHex ? hexToBytes(clean) : toBytes8(clean);
  };

  const runCore = (explain) => {
    // Validate inputs before processing
    const keyValidation = validateKey(key);
    const inputValidation = validateInput(mode === "encrypt" ? plaintext : cipherInput, mode === "encrypt");
    
    setKeyError(keyValidation.errors.join(", "));
    setInputError(inputValidation.errors.join(", "));
    setWarnings([...keyValidation.warnings, ...inputValidation.warnings]);
    setError("");
    
    // Stop if there are validation errors
    if (keyValidation.errors.length > 0 || inputValidation.errors.length > 0) {
      return;
    }
    
    setTrace([]);
    setInitial(null);
    setFinal(null);

    const keyBytes = toBytes8(key);
    const Ks = keySchedule(keyBytes);
    setSubkeys(Ks);

    if (mode === "encrypt") {
      const ptBytes = toBytes8(plaintext);
      const bits = bytesToBits(ptBytes);
      setInitial(bits);

      const { result, rounds } = desEncryptBits(bits, Ks);
      setFinal(result);

      const outBytes = bitsToBytes(result);
      setCipherInput(bytesToHex(outBytes));

      if (explain) setTrace(rounds);
    } else {
      const inBytes = parseCipherInput(cipherInput);
      if (inBytes.length !== 8) { setError("Ciphertext must be 8 bytes (16 hex chars or 8 ASCII)."); return; }
      const bits = bytesToBits(inBytes);
      setInitial(bits);

      const { result, rounds } = desDecryptBits(bits, Ks);
      setFinal(result);

      const outBytes = bitsToBytes(result);
      setPlaintext(bytesToPrintableAscii(outBytes));

      if (explain) setTrace(rounds);
    }
  };

  const runExplain = () => {
    runAnimatedExplanation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
        </div>
        
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">DES Cipher (64-bit, ECB)</h1>
          <p className="text-gray-600">Encrypt, decrypt, and visualize DES rounds step by step</p>
        </header>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === "theory" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Theory
            </button>
            <button
              onClick={() => setActiveTab("example")}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === "example" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Example
            </button>
            <button
              onClick={() => setActiveTab("interactive")}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === "interactive" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Cipher
            </button>
          </div>
        </div>

        {/* Theory */}
        {activeTab === "theory" && (
          <div className="p-8 space-y-6 text-gray-800">
            {/* Introduction Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Introduction</h3>
              <p className="text-gray-700 leading-relaxed">
                The <span className="font-semibold text-blue-600">Data Encryption Standard (DES)</span> is a symmetric-key block cipher that, for decades, was the global standard for data encryption. Developed by IBM and based on the Feistel structure, it was a cornerstone of modern cryptography until its small key size made it vulnerable to brute-force attacks.
              </p>
            </div>

            {/* Origin Story Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Origin Story</h3>
              <p className="text-gray-700 leading-relaxed">
                DES was developed in the early 1970s by a team at <span className="font-semibold text-blue-600">IBM</span> and was selected by the U.S. National Bureau of Standards (now NIST) in 1977 as an official federal standard. Its adoption was not without controversy. The algorithm's designers, with input from the NSA, reduced the key length from 64 bits to a final <span className="font-semibold text-blue-600">56 bits</span>. This, along with the undisclosed design rationale for the S-boxes, fueled speculation that the NSA had intentionally weakened the cipher. However, the design proved remarkably resistant to differential cryptanalysis, which was publicly discovered much later but had been secretly known by the NSA for years.
              </p>
            </div>

            {/* Core Idea Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Core Idea</h3>
              <p className="text-gray-700 leading-relaxed">
                DES processes <span className="font-semibold text-blue-600">64-bit blocks</span> of plaintext using a <span className="font-semibold text-blue-600">56-bit key</span>. Its core principle is a <span className="font-semibold text-blue-600">Feistel network</span> with 16 rounds of iterative transformation. The security of the cipher relies on a combination of substitution and permutation, with the non-linear S-boxes being the most critical component for introducing confusion and preventing linear attacks.
              </p>
            </div>

            {/* Technical Blueprint Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Technical Blueprint</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The DES encryption process follows the <span className="font-semibold text-blue-600">Feistel structure</span> and consists of several well-defined steps:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <span className="font-semibold text-blue-700">Initial Permutation (IP):</span>
                    <span className="text-gray-700"> The 64-bit plaintext block is rearranged according to a fixed permutation table. This step provides no security but is part of the standard.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <span className="font-semibold text-blue-700">Feistel Network (16 Rounds):</span>
                    <span className="text-gray-700"> The permuted block is split into two 32-bit halves (L₀, R₀). Each round applies the Feistel function where the right half becomes the new left half, and the new right half is L₀ ⊕ f(R₀, Kᵢ).</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <span className="font-semibold text-blue-700">Round Function f(R, K):</span>
                    <span className="text-gray-700"> Expansion (32→48 bits), XOR with subkey, S-box substitution (48→32 bits), and permutation. The S-boxes provide the crucial non-linearity.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <span className="font-semibold text-blue-700">Final Permutation (FP):</span>
                    <span className="text-gray-700"> After 16 rounds, the halves are recombined and the inverse of the initial permutation (IP⁻¹) is applied to produce the 64-bit ciphertext.</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-700 mb-2">Key Features:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Block Size:</strong> 64 bits</li>
                  <li>• <strong>Key Size:</strong> 56 bits (8 parity bits make it 64 bits total)</li>
                  <li>• <strong>Rounds:</strong> 16</li>
                  <li>• <strong>Structure:</strong> Feistel Network</li>
                  <li>• <strong>S-boxes:</strong> 8 different 6→4 bit substitution boxes</li>
                </ul>
              </div>
            </div>

            {/* Security Scorecard Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Security Scorecard</h3>
              <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mr-3">
                    OBSOLETE - DEPRECATED
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                The primary weakness of DES is its small <span className="font-semibold text-red-600">56-bit effective key size</span>. This was reasonable in the 1970s, but exponential growth in computational power made it vulnerable to brute-force attacks.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Historical Milestones:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>1977:</strong> Adopted as federal standard</li>
                  <li>• <strong>1999:</strong> EFF cracked DES in 22 hours 15 minutes</li>
                  <li>• <strong>2001:</strong> Officially replaced by AES</li>
                  <li>• <strong>Today:</strong> Used only for legacy systems and education</li>
                </ul>
              </div>
            </div>

            {/* Real-World Usage Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Real-World Usage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For over two decades, DES was the workhorse of symmetric encryption, securing financial transactions, government data, and corporate communications. Its story is a microcosm of cryptographic evolution—a once-formidable standard that became obsolete as computing power advanced.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-700 mb-2">Historical Applications:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Banking and financial systems</li>
                    <li>• Government secure communications</li>
                    <li>• Early internet security protocols</li>
                    <li>• Corporate data protection</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-700 mb-2">Modern Legacy:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Educational tool for cryptography</li>
                    <li>• Basis for Triple DES (3DES)</li>
                    <li>• Historical reference for standards</li>
                    <li>• Inspiration for modern ciphers</li>
                  </ul>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                The transition from DES's 56-bit key to AES's 128/192/256-bit keys perfectly illustrates the need for larger key spaces to outpace the relentless increase in computing power.
              </p>
            </div>
          </div>
        )}
        
        {/* Example */}
        {activeTab === "example" && (
          <div className="p-8 space-y-6 text-gray-800">
            {/* Introduction */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Solved Example</h3>
              <p className="text-gray-700 leading-relaxed">
                Let's walk through a DES encryption example to understand how the Feistel network transforms plaintext into ciphertext through 16 rounds of substitution and permutation.
              </p>
            </div>

            {/* Example Setup */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Example Setup</h4>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Plaintext:</strong> 
                      <span className="font-mono text-green-600 bg-white px-2 py-1 rounded ml-2">HELLODES</span>
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Key:</strong> 
                      <span className="font-mono text-purple-600 bg-white px-2 py-1 rounded ml-2">SECRETKY</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Algorithm:</strong> DES ECB
                    </p>
                    <p className="text-gray-700">
                      <strong className="text-blue-600">Rounds:</strong> 16 Feistel rounds
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-gray-600">
                    <strong>Hex Plaintext:</strong> <span className="font-mono">48454C4C4F444553</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Hex Key:</strong> <span className="font-mono">5345435245544B59</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Initial Permutation */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 1: Initial Permutation (IP)</h4>
              <p className="text-gray-700 mb-4">
                The 64-bit plaintext is rearranged according to the Initial Permutation table. This provides no cryptographic security but is part of the DES standard.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3 text-center">Before IP</h5>
                  <div className="font-mono text-sm text-center">
                    <div className="bg-green-100 p-2 rounded border">
                      48454C4C4F444553
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Original 64-bit plaintext</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3 text-center">After IP</h5>
                  <div className="font-mono text-sm text-center space-y-2">
                    <div className="bg-blue-100 p-2 rounded border">
                      <div>L₀: CC00CCCC</div>
                      <div>R₀: 00F00FFF</div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Split into 32-bit halves</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Feistel Rounds */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 2: Feistel Network (16 Rounds)</h4>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Each round follows the Feistel structure. Let's examine Round 1 in detail:
                </p>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h5 className="font-semibold text-orange-700 mb-3">Round 1 Process</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                      <div>
                        <strong>Input:</strong> L₀ = CC00CCCC, R₀ = 00F00FFF, K₁ = B1946AC7CA4CE
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                      <div>
                        <strong>Feistel Function:</strong> L₁ = R₀, R₁ = L₀ ⊕ f(R₀, K₁)
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                      <div>
                        <strong>Output:</strong> L₁ = 00F00FFF, R₁ = 8C008C8C
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-lg font-semibold text-blue-600">Round Function f(R, K) Details:</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expansion */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">E</span>
                      <h6 className="font-semibold text-red-700">Expansion (32→48 bits)</h6>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      R₀ is expanded from 32 to 48 bits by duplicating certain bits according to the E-table.
                    </p>
                    <div className="font-mono text-xs bg-white p-2 rounded">
                      R₀: 00F00FFF → E(R₀): 001E001FFFFFEF
                    </div>
                  </div>

                  {/* S-Boxes */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">S</span>
                      <h6 className="font-semibold text-purple-700">S-Box Substitution</h6>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      The 48-bit result is divided into 8 groups of 6 bits, each processed by a different S-box (6→4 bits).
                    </p>
                    <div className="font-mono text-xs bg-white p-2 rounded">
                      48 bits → 8 S-boxes → 32 bits
                    </div>
                  </div>

                  {/* XOR with Subkey */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">⊕</span>
                      <h6 className="font-semibold text-green-700">XOR with Subkey</h6>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      The expanded R₀ is XORed with the 48-bit round subkey K₁.
                    </p>
                    <div className="font-mono text-xs bg-white p-2 rounded">
                      E(R₀) ⊕ K₁ → S-box input
                    </div>
                  </div>

                  {/* Permutation */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">P</span>
                      <h6 className="font-semibold text-blue-700">P-Box Permutation</h6>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      The 32-bit S-box output is permuted according to the P-table to complete the round function.
                    </p>
                    <div className="font-mono text-xs bg-white p-2 rounded">
                      Final f(R₀, K₁) output
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Continuing Rounds */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 3: Continuing Through 16 Rounds</h4>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-3">
                  The Feistel process continues for all 16 rounds. Here's a summary of a few key rounds:
                </p>
                
                <div className="space-y-2 font-mono text-sm">
                  <div className="grid grid-cols-3 gap-4 text-center font-bold border-b pb-2">
                    <span>Round</span>
                    <span>Left Half (L)</span>
                    <span>Right Half (R)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <span>0</span>
                    <span className="text-blue-600">CC00CCCC</span>
                    <span className="text-green-600">00F00FFF</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <span>1</span>
                    <span className="text-blue-600">00F00FFF</span>
                    <span className="text-green-600">8C008C8C</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <span>2</span>
                    <span className="text-blue-600">8C008C8C</span>
                    <span className="text-green-600">4A4A4A4A</span>
                  </div>
                  <div className="text-center text-gray-500">...</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <span>16</span>
                    <span className="text-blue-600">19BA9212</span>
                    <span className="text-green-600">CF526D03</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> In the final round, the halves are not swapped. The final output is (R₁₆, L₁₆) before the final permutation.
                </p>
              </div>
            </div>

            {/* Step 4: Final Permutation */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 4: Final Permutation (FP)</h4>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    After 16 rounds, the final permutation (IP⁻¹) is applied to produce the ciphertext:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">After 16 Rounds:</p>
                      <div className="font-mono text-lg bg-orange-100 text-orange-800 px-4 py-2 rounded border">
                        R₁₆L₁₆: CF526D0319BA9212
                      </div>
                    </div>
                    
                    <div className="text-2xl text-gray-500">↓ Final Permutation (FP)</div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Final Ciphertext:</p>
                      <div className="font-mono text-lg bg-red-100 text-red-800 px-4 py-2 rounded border">
                        85E813540F0AB405
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4 italic">
                    The exact values depend on the specific implementation and key schedule generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Feistel Structure Illustration */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Feistel Structure Visualization</h4>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center mb-4">
                  <h5 className="font-semibold text-gray-800">Single Round Process</h5>
                </div>
                
                <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
                  <div className="flex gap-8">
                    <div className="bg-blue-100 px-4 py-2 rounded border text-center">
                      <div className="font-mono text-sm">Lᵢ</div>
                      <div className="text-xs text-gray-600">Left Half</div>
                    </div>
                    <div className="bg-green-100 px-4 py-2 rounded border text-center">
                      <div className="font-mono text-sm">Rᵢ</div>
                      <div className="text-xs text-gray-600">Right Half</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-100 px-6 py-3 rounded border">
                      <div className="font-mono text-sm">f(Rᵢ, Kᵢ)</div>
                      <div className="text-xs text-gray-600">Round Function</div>
                    </div>
                  </div>
                  
                  <div className="text-2xl text-gray-500">⊕</div>
                  
                  <div className="flex gap-8">
                    <div className="bg-green-100 px-4 py-2 rounded border text-center">
                      <div className="font-mono text-sm">Lᵢ₊₁ = Rᵢ</div>
                      <div className="text-xs text-gray-600">New Left</div>
                    </div>
                    <div className="bg-yellow-100 px-4 py-2 rounded border text-center">
                      <div className="font-mono text-sm">Rᵢ₊₁ = Lᵢ ⊕ f(Rᵢ, Kᵢ)</div>
                      <div className="text-xs text-gray-600">New Right</div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 text-center mt-4">
                  This structure is repeated 16 times with different subkeys Kᵢ
                </p>
              </div>
            </div>

            {/* Interactive Try */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Try It Yourself</h4>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 mb-3">
                  <strong>Want to see DES in action?</strong>
                </p>
                <p className="text-gray-700 text-sm mb-4">
                  Switch to the "Cipher" tab and use the sample data to encrypt "HELLODES" with key "SECRETKY". 
                  Click "Explain" to see each round of the Feistel network visualized!
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">📝 Sample Data</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">🔍 Explain Mode</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">⚡ Quick Encrypt</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive */}
        {activeTab === "interactive" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive DES Tool</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => {
                      setMode(e.target.value);
                      // Clear errors and warnings when switching modes
                      setError("");
                      setInputError("");
                      setWarnings([]);
                      // Clear output when switching modes
                      if (e.target.value === "encrypt") {
                        setCipherInput("");
                      } else {
                        setPlaintext("");
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="encrypt">🔒 Encrypt (Plaintext → Ciphertext)</option>
                    <option value="decrypt">🔓 Decrypt (Ciphertext → Plaintext)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key (8 ASCII chars)</label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      setKey(e.target.value);
                      if (keyError) setKeyError("");
                      if (warnings.length > 0) setWarnings([]);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      keyError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="8 chars (parity ignored)"
                  />
                  {keyError && (
                    <p className="mt-1 text-sm text-red-600">{keyError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Current length: {key.length}/8 • {key.length < 8 ? 'Will be padded' : key.length > 8 ? 'Will be truncated' : 'Perfect length'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "encrypt" ? "Plaintext (8 ASCII chars)" : "Ciphertext (16 HEX or 8 ASCII)"}
                  </label>
                  <input
                    type="text"
                    value={mode === "encrypt" ? plaintext : cipherInput}
                    onChange={(e) => {
                      if (mode === "encrypt") {
                        setPlaintext(e.target.value);
                      } else {
                        setCipherInput(e.target.value.toUpperCase());
                      }
                      if (inputError) setInputError("");
                      if (warnings.length > 0) setWarnings([]);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      inputError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={mode === "encrypt" ? "Enter 8 characters..." : "Enter 16 hex chars or 8 ASCII chars..."}
                    title={mode === "encrypt" 
                      ? "Enter plaintext (8 ASCII characters)"
                      : "Enter ciphertext (16 hex characters like 85E813540F0AB405, or 8 ASCII characters)"
                    }
                  />
                  {inputError && (
                    <p className="mt-1 text-sm text-red-600">{inputError}</p>
                  )}
                  {mode === "encrypt" ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Current length: {plaintext.length}/8 • {plaintext.length < 8 ? 'Will be padded' : plaintext.length > 8 ? 'Will be truncated' : 'Perfect length'}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      {cipherInput.replace(/\s+/g, '').length > 0 && /^[0-9a-fA-F\s]+$/.test(cipherInput) 
                        ? `Hex format detected • Length: ${cipherInput.replace(/\s+/g, '').length}/16`
                        : `ASCII format • Length: ${cipherInput.length}/8`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "encrypt" ? "Ciphertext (HEX)" : "Decrypted Text"}
                  </label>
                  <input
                    type="text"
                    value={mode === "encrypt" ? (cipherInput || "") : plaintext}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Result will appear here..."
                  />
                </div>
              </div>

              {/* Warnings Display */}
              {warnings.length > 0 && (
                <div className="mt-4 p-3 rounded bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">
                  <div className="font-medium mb-1">⚠️ Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={runExplain}
                  disabled={isAnimating || keyError || inputError}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={18} />
                  {isAnimating ? "Visualizing..." : "Explain"}
                </button>

                <button
                  onClick={() => runCore(false)}
                  disabled={keyError || inputError}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {mode === "encrypt" ? <Lock size={18} /> : <Unlock size={18} />}
                  {mode === "encrypt" ? "Encrypt" : "Decrypt"}
                </button>

                
                {/* Quick Fill Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setKey("TESTKEY8");
                      setPlaintext("HELLO123");
                      setCipherInput("");
                      setMode("encrypt");
                      setError("");
                      setKeyError("");
                      setInputError("");
                      setWarnings([]);
                    }}
                    className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  >
                    📝 Sample Data
                  </button>
                  
                  <button
                    onClick={() => {
                      setKey("");
                      setPlaintext("");
                      setCipherInput("");
                      setError("");
                      setKeyError("");
                      setInputError("");
                      setWarnings([]);
                    }}
                    className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
                  <div className="font-medium mb-1">❌ Error:</div>
                  {error}
                </div>
              )}
              
              {/* Input Validation Status */}
              {(key || (mode === "encrypt" ? plaintext : cipherInput)) && (
                <div className="mt-4 p-3 rounded bg-blue-50 text-blue-700 text-sm border border-blue-200">
                  <div className="font-medium mb-2">📋 Input Status:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${keyError ? 'text-red-600' : 'text-green-600'}`}>
                      {keyError ? '❌' : '✅'} Key: {key.length}/8 chars
                      {keyError && ` (${keyError})`}
                    </div>
                    <div className={`flex items-center gap-1 ${inputError ? 'text-red-600' : 'text-green-600'}`}>
                      {inputError ? '❌' : '✅'} {mode === "encrypt" ? "Plaintext" : "Ciphertext"}:
                      {mode === "encrypt" 
                        ? ` ${plaintext.length}/8 chars`
                        : cipherInput.replace(/\s+/g, '').length > 0 && /^[0-9a-fA-F\s]+$/.test(cipherInput)
                          ? ` ${cipherInput.replace(/\s+/g, '').length}/16 hex`
                          : ` ${cipherInput.length}/8 ASCII`
                      }
                      {inputError && ` (${inputError})`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Key schedule viewer */}
            {subkeys.length === 16 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Key Schedule (K₁ … K₁₆)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subkeys.map((k, i) => (
                    <NibbleGrid key={i} title={`K${i + 1} (48 bits)`} bits={k} />
                  ))}
                </div>
              </div>
            )}

            {/* Animated Visualization */}
            {showAnimation && (
              <AnimatedDESVisualization
                isAnimating={autoPlay}
                animationSteps={animationSteps}
                currentStepIndex={currentStepIndex}
                mode={mode}
                onStepChange={handleStepChange}
                onToggleAnimation={toggleAutoPlay}
              />
            )}

            {/* Static Round Visualization - only show when not animating */}
            {!showAnimation && (trace.length > 0 || initial || final) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Round Visualization</h3>

                {initial && final && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <NibbleGrid title={mode === "encrypt" ? "Initial (Plaintext) 64" : "Initial (Ciphertext) 64"} bits={initial} />
                    <NibbleGrid title={mode === "encrypt" ? "Final (Ciphertext) 64" : "Final (Plaintext) 64"} bits={final} />
                  </div>
                )}

                {trace.length > 0 ? (
                  <div className="space-y-3">
                    {trace.map((step, idx) => (
                      <CollapsibleRound
                        key={idx}
                        roundIndex={idx + 1}
                        step={step}
                        openDefault={idx === 0 || idx === trace.length - 1}
                      />
                    ))}
                  </div>
                ) : null}

                {isAnimating && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Processing DES rounds…</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Showing E, XOR with K, S-Boxes, and P-Box for each round.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      
    </div>
  );
};

export default DESCipher;
