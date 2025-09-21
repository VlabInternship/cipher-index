import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";

/* =========================================================================================
Minimal AES-128 ECB implementation with round-by-round trace (inside this single file)
========================================================================================= */

// --- Tables (S-Box, Inv S-Box, Rcon) ---
const S = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];
const iS = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
  0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
  0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
  0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
  0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
  0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
  0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
  0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
  0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
  0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
  0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
];
const RCON = [
  0x00000000, 0x01000000, 0x02000000, 0x04000000, 0x08000000,
  0x10000000, 0x20000000, 0x40000000, 0x80000000, 0x1b000000, 0x36000000
];

// --- Helpers ---
const te = new TextEncoder();
const td = new TextDecoder();

// Convert string to 16-byte array (pad with spaces or truncate)
const toBytes16 = (str) => {
  const b = te.encode(str);
  const out = new Uint8Array(16).fill(0x20); // Fill with spaces
  out.set(b.slice(0, 16));
  return out;
};

// Convert 16 bytes to AES state in column-major order
const bytesToState = (bytes16) => {
  // AES state is already in the correct byte order for our operations
  return bytes16.slice();
};

// Convert AES state back to bytes
const stateToBytes = (state) => {
  return state.slice();
};
const bytesToHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
const hexToBytes = (hex) => {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
};
const bytesToPrintableAscii = (bytes) => {
  let s = "";
  for (const b of bytes) s += (b >= 32 && b <= 126) ? String.fromCharCode(b) : "\\x" + b.toString(16).padStart(2, "0");
  return s;
};

// State <-> Matrix (AES standard: column-major byte ordering)
// AES state matrix is organized as: state[row + 4*col]
// Matrix visualization for display (showing actual AES layout)
const toMatrixRows = (bytes16) => {
  const m = [[], [], [], []];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      m[row][col] = bytes16[row + 4 * col];
    }
  }
  return m;
};

// Galois Field (GF(2^8)) arithmetic for AES MixColumns
// Multiplication by x in GF(2^8) with irreducible polynomial x^8 + x^4 + x^3 + x + 1
const xtime = (a) => ((a << 1) ^ ((a & 0x80) ? 0x1b : 0)) & 0xff;

// General multiplication in GF(2^8)
const gmul = (a, b) => {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b; // Reduce by irreducible polynomial
    b >>= 1;
  }
  return p;
};

// SubBytes: Apply S-box substitution to each byte
// Non-linear transformation that provides confusion
const subBytes = (s) => s.map(b => S[b]);

// Inverse SubBytes: Apply inverse S-box substitution
const invSubBytes = (s) => s.map(b => iS[b]);

// Rotate left a 4-byte row by n
const rotl4 = (row4, n) => {
  const out = new Uint8Array(4);
  for (let c = 0; c < 4; c++) out[c] = row4[(c + n) % 4];
  return out;
};
// Rotate right a 4-byte row by n
const rotr4 = (row4, n) => {
  const out = new Uint8Array(4);
  for (let c = 0; c < 4; c++) out[c] = row4[(c - n + 4) % 4];
  return out;
};

// ShiftRows: Cyclically shift each row left by row number
// Row 0: no shift, Row 1: shift 1, Row 2: shift 2, Row 3: shift 3
const shiftRows = (s) => {
  const t = s.slice();
  for (let row = 0; row < 4; row++) {
    const temp = [];
    // Extract the row from column-major layout
    for (let col = 0; col < 4; col++) {
      temp[col] = t[row + 4 * col];
    }
    // Rotate left by row number
    const shifted = rotl4(temp, row);
    // Put back into column-major layout
    for (let col = 0; col < 4; col++) {
      t[row + 4 * col] = shifted[col];
    }
  }
  return t;
};

// Inverse ShiftRows: Cyclically shift each row right by row number
const invShiftRows = (s) => {
  const t = s.slice();
  for (let row = 0; row < 4; row++) {
    const temp = [];
    // Extract the row from column-major layout
    for (let col = 0; col < 4; col++) {
      temp[col] = t[row + 4 * col];
    }
    // Rotate right by row number
    const shifted = rotr4(temp, row);
    // Put back into column-major layout
    for (let col = 0; col < 4; col++) {
      t[row + 4 * col] = shifted[col];
    }
  }
  return t;
};


// MixColumns matrix multiplication for a single column
// Multiplies column vector by fixed MDS matrix:
// [02 03 01 01]   [a[0]]   [02*a[0] + 03*a[1] + 01*a[2] + 01*a[3]]
// [01 02 03 01] * [a[1]] = [01*a[0] + 02*a[1] + 03*a[2] + 01*a[3]]
// [01 01 02 03]   [a[2]]   [01*a[0] + 01*a[1] + 02*a[2] + 03*a[3]]
// [03 01 01 02]   [a[3]]   [03*a[0] + 01*a[1] + 01*a[2] + 02*a[3]]
const mixSingleColumn = (a) => [
  gmul(0x02, a[0]) ^ gmul(0x03, a[1]) ^ a[2] ^ a[3],
  a[0] ^ gmul(0x02, a[1]) ^ gmul(0x03, a[2]) ^ a[3],
  a[0] ^ a[1] ^ gmul(0x02, a[2]) ^ gmul(0x03, a[3]),
  gmul(0x03, a[0]) ^ a[1] ^ a[2] ^ gmul(0x02, a[3])
].map(x => x & 0xff);

// Inverse MixColumns matrix multiplication
// Multiplies by inverse MDS matrix:
// [0e 0b 0d 09]
// [09 0e 0b 0d]
// [0d 09 0e 0b]
// [0b 0d 09 0e]
const invMixSingleColumn = (a) => [
  gmul(0x0e, a[0]) ^ gmul(0x0b, a[1]) ^ gmul(0x0d, a[2]) ^ gmul(0x09, a[3]),
  gmul(0x09, a[0]) ^ gmul(0x0e, a[1]) ^ gmul(0x0b, a[2]) ^ gmul(0x0d, a[3]),
  gmul(0x0d, a[0]) ^ gmul(0x09, a[1]) ^ gmul(0x0e, a[2]) ^ gmul(0x0b, a[3]),
  gmul(0x0b, a[0]) ^ gmul(0x0d, a[1]) ^ gmul(0x09, a[2]) ^ gmul(0x0e, a[3])
].map(x => x & 0xff);

// MixColumns: Apply linear transformation to each column
// Each column is treated as a 4-byte vector multiplied by MDS matrix
const mixColumns = (s) => {
  const t = s.slice();
  for (let col = 0; col < 4; col++) {
    // Extract column in correct order (AES column-major)
    const column = [t[0 + 4 * col], t[1 + 4 * col], t[2 + 4 * col], t[3 + 4 * col]];
    const mixed = mixSingleColumn(column);
    // Put back the mixed column
    t[0 + 4 * col] = mixed[0];
    t[1 + 4 * col] = mixed[1];
    t[2 + 4 * col] = mixed[2];
    t[3 + 4 * col] = mixed[3];
  }
  return t;
};

// Inverse MixColumns: Apply inverse linear transformation
const invMixColumns = (s) => {
  const t = s.slice();
  for (let col = 0; col < 4; col++) {
    // Extract column in correct order (AES column-major)
    const column = [t[0 + 4 * col], t[1 + 4 * col], t[2 + 4 * col], t[3 + 4 * col]];
    const mixed = invMixSingleColumn(column);
    // Put back the mixed column
    t[0 + 4 * col] = mixed[0];
    t[1 + 4 * col] = mixed[1];
    t[2 + 4 * col] = mixed[2];
    t[3 + 4 * col] = mixed[3];
  }
  return t;
};

// AddRoundKey: XOR state with round key
// Key mixing step that provides key-dependent transformation
const addRoundKey = (s, rk) => s.map((b, i) => b ^ rk[i]);

// Key expansion (AES-128 -> 11 round keys of 16 bytes)
const rotWord = (w) => ((w << 8) & 0xffffffff) | (w >>> 24);
const subWord = (w) => {
  return ((S[(w >>> 24) & 0xff] << 24) | (S[(w >>> 16) & 0xff] << 16) | (S[(w >>> 8) & 0xff] << 8) | S[w & 0xff]) >>> 0;
};
const bytesToWords = (b) => [
  (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3],
  (b[4] << 24) | (b[5] << 16) | (b[6] << 8) | b[7],
  (b[8] << 24) | (b[9] << 16) | (b[10] << 8) | b[11],
  (b[12] << 24) | (b[13] << 16) | (b[14] << 8) | b[15]
].map(x => x >>> 0);
const wordsToBytes = (w) => {
  const out = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    out[i * 4 + 0] = (w[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (w[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (w[i] >>> 8) & 0xff;
    out[i * 4 + 3] = w[i] & 0xff;
  }
  return out;
};

const expandKey = (key16) => {
  const Nk = 4, Nb = 4, Nr = 10;
  const W = new Array(Nb * (Nr + 1));
  let temp;
  const keyWords = bytesToWords(key16);
  for (let i = 0; i < Nk; i++) W[i] = keyWords[i];
  for (let i = Nk; i < Nb * (Nr + 1); i++) {
    temp = W[i - 1];
    if (i % Nk === 0) {
      temp = subWord(rotWord(temp)) ^ RCON[i / Nk];
    }
    W[i] = (W[i - Nk] ^ temp) >>> 0;
  }
  // Convert to round keys (11 * 16 bytes)
  const rks = [];
  for (let r = 0; r <= Nr; r++) {
    rks.push(wordsToBytes(W.slice(r * 4, r * 4 + 4)));
  }
  return rks;
};

// Encrypt/Decrypt one 16-byte block with trace
const encryptBlock = (input16, rks) => {
  let state = input16.slice();
  const rounds = [];

  // Round 0
  state = addRoundKey(state, rks[0]);
  rounds.push({ addRoundKey: state.slice() });

  // Rounds 1..9
  for (let r = 1; r <= 9; r++) {
    state = subBytes(state); const sb = state.slice();
    state = shiftRows(state); const sr = state.slice();
    state = mixColumns(state); const mc = state.slice();
    state = addRoundKey(state, rks[r]); const ark = state.slice();
    rounds.push({ subBytes: sb, shiftRows: sr, mixColumns: mc, addRoundKey: ark });
  }

  // Round 10
  state = subBytes(state); const sb10 = state.slice();
  state = shiftRows(state); const sr10 = state.slice();
  state = addRoundKey(state, rks[10]); const ark10 = state.slice();
  rounds.push({ subBytes: sb10, shiftRows: sr10, addRoundKey: ark10 });

  return { result: state, rounds };
};

const decryptBlock = (input16, rks) => {
  // rks[10]..rks[0]
  let state = input16.slice();
  const rounds = [];

  // Round 0 (inverse final)
  state = addRoundKey(state, rks[10]); const ark0 = state.slice();
  state = invShiftRows(state); const isr0 = state.slice();
  state = invSubBytes(state); const isb0 = state.slice();
  rounds.push({ addRoundKey: ark0, shiftRows: isr0, subBytes: isb0 }); // naming aligned for UI

  // Rounds 9..1
  for (let r = 9; r >= 1; r--) {
    state = addRoundKey(state, rks[r]); const ark = state.slice();
    state = invMixColumns(state); const imc = state.slice();
    state = invShiftRows(state); const isr = state.slice();
    state = invSubBytes(state); const isb = state.slice();
    rounds.push({ addRoundKey: ark, mixColumns: imc, shiftRows: isr, subBytes: isb });
  }

  // Final: round key 0
  state = addRoundKey(state, rks[0]); const arkf = state.slice();
  rounds.push({ addRoundKey: arkf });

  return { result: state, rounds };
};

/* ================================== UI bits ================================== */

const Matrix = ({ title, bytes16, highlightedCells = [], animationPhase = '', currentStep = '' }) => {
  const m = bytes16 ? toMatrixRows(bytes16) : [[], [], [], []];
  
  const getCellClassName = (row, col, value) => {
    const cellKey = `${row}-${col}`;
    const isHighlighted = highlightedCells.includes(cellKey);
    
    let baseClass = "w-12 h-12 flex items-center justify-center border-2 font-mono text-xs transition-all duration-500 transform";
    
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
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        {title}
        {currentStep && (
          <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {currentStep}
          </span>
        )}
      </div>
      <div className="inline-block border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
        {m.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className={getCellClassName(r, c, cell)}
                title={`[${r},${c}] = 0x${typeof cell === "number" ? cell.toString(16).padStart(2, "0").toUpperCase() : "00"}`}
              >
                {typeof cell === "number" ? cell.toString(16).padStart(2, "0").toUpperCase() : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Row and Column Labels */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <div>4×4 AES State Matrix (Column-Major Order)</div>
        <div className="mt-1">Rows 0-3, Columns 0-3</div>
      </div>
    </div>
  );
};

const RoundKeyMatrix = ({ title, roundKey, isActive = false }) => {
  if (!roundKey) return null;
  
  const m = toMatrixRows(roundKey);
  
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
      <div className="inline-block border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
        {m.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`w-10 h-10 flex items-center justify-center border-2 font-mono text-xs transition-all duration-300 ${
                  isActive 
                    ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                title={`Round Key [${r},${c}] = 0x${typeof cell === "number" ? cell.toString(16).padStart(2, "0").toUpperCase() : "00"}`}
              >
                {typeof cell === "number" ? cell.toString(16).padStart(2, "0").toUpperCase() : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Round Key Matrix
      </div>
    </div>
  );
};

const SBoxTable = ({ sboxTable, highlightedValues = [], mode = 'encrypt' }) => {
  const getHighlightCount = (value) => {
    return highlightedValues.filter(v => v === value).length;
  };

  const getCellClassName = (value) => {
    const count = getHighlightCount(value);
    if (count === 0) {
      return "w-6 h-6 flex items-center justify-center text-xs font-mono border border-gray-200 bg-gray-50 text-gray-600";
    } else if (count === 1) {
      return "w-6 h-6 flex items-center justify-center text-xs font-mono border-2 border-green-400 bg-green-100 text-green-800 animate-pulse";
    } else {
      return "w-6 h-6 flex items-center justify-center text-xs font-mono border-2 border-amber-400 bg-amber-100 text-amber-800 animate-pulse";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-green-200 p-3">
      <div className="font-bold text-green-700 mb-2 text-sm flex items-center gap-2">
        {mode === 'encrypt' ? 'S-box' : 'Inverse S-box'} Table
        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
          256 values
        </span>
      </div>
      
      {/* Column headers */}
      <div className="flex mb-1">
        <div className="w-6"></div>
        {Array.from({length: 16}, (_, i) => (
          <div key={i} className="w-6 h-4 flex items-center justify-center text-xs font-bold text-gray-600">
            {i.toString(16).toUpperCase()}
          </div>
        ))}
      </div>
      
      {/* S-box table */}
      <div className="border border-gray-300 rounded overflow-hidden">
        {Array.from({length: 16}, (_, row) => (
          <div key={row} className="flex">
            {/* Row header */}
            <div className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 border-r border-gray-300">
              {row.toString(16).toUpperCase()}
            </div>
            {/* S-box cells */}
            {Array.from({length: 16}, (_, col) => {
              const index = row * 16 + col;
              const value = sboxTable[index];
              return (
                <div
                  key={col}
                  className={getCellClassName(index)}
                  title={`S-box[0x${index.toString(16).padStart(2, '0').toUpperCase()}] = 0x${value.toString(16).padStart(2, '0').toUpperCase()}`}
                >
                  {value.toString(16).padStart(2, '0').toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Highlighted cells show active lookups
      </div>
    </div>
  );
};

const SBoxVisualization = ({ title, inputState, outputState, mode = 'encrypt' }) => {
  if (!inputState || !outputState) return null;
  
  const sboxTable = mode === 'encrypt' ? S : iS;
  const inputMatrix = toMatrixRows(inputState);
  const outputMatrix = toMatrixRows(outputState);
  
  // Create S-box lookup data and highlighted indices
  const lookupData = [];
  const highlightedIndices = [];
  
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const inputValue = inputMatrix[r][c];
      const outputValue = outputMatrix[r][c];
      lookupData.push({
        position: `[${r},${c}]`,
        input: inputValue,
        output: outputValue,
        sboxIndex: inputValue
      });
      highlightedIndices.push(inputValue);
    }
  }
  
  return (
    <div className="space-y-4">
      {/* S-box Table with highlighting */}
      <SBoxTable 
        sboxTable={sboxTable}
        highlightedValues={highlightedIndices}
        mode={mode}
      />
      
      {/* Lookup Examples */}
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4">
        <div className="font-bold text-green-700 mb-3 flex items-center gap-2">
          Active Lookups
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
            16 substitutions
          </span>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {lookupData.slice(0, 6).map((lookup, index) => (
            <div key={index} className="flex items-center justify-between text-xs p-2 bg-green-50 rounded border border-green-200">
              <span className="font-mono text-green-700 min-w-[2rem]">
                {lookup.position}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-blue-600">
                0x{lookup.input.toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-green-600">
                0x{lookup.output.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>
          ))}
          {lookupData.length > 6 && (
            <div className="text-xs text-gray-500 text-center py-1">
              ... and {lookupData.length - 6} more substitutions
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnimatedAESVisualization = ({ 
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
    'initial': 'Initial State',
    'subBytes': 'SubBytes Transform',
    'shiftRows': 'ShiftRows Permutation', 
    'mixColumns': 'MixColumns Diffusion',
    'addRoundKey': 'AddRoundKey (XOR with Round Key)'
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
        AES Round Visualization
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
      
      {/* Current Step Matrix and Context-Specific Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="flex justify-center">
          <Matrix
            title={stepNames[currentStep.type] || 'Processing...'}
            bytes16={currentStep.state}
            highlightedCells={currentStep.highlightedCells || []}
            animationPhase={currentStep.phase || 'processing'}
            currentStep={`Step ${currentStepIndex + 1}/${animationSteps.length}`}
          />
        </div>
        
        {/* Conditional right panel based on step type */}
        <div className="flex justify-center">
          {(currentStep.type === 'addRoundKey' || currentStep.type === 'initial') && (
            <RoundKeyMatrix
              title={`Round ${currentStep.roundNumber} Key`}
              roundKey={currentStep.roundKey}
              isActive={true}
            />
          )}
          
          {currentStep.type === 'subBytes' && currentStep.previousState && (
            <SBoxVisualization
              title="S-box Substitution"
              inputState={currentStep.previousState}
              outputState={currentStep.state}
              mode={mode}
            />
          )}
          
          {(currentStep.type === 'shiftRows' || currentStep.type === 'mixColumns') && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <div className="text-2xl mb-2">
                  {currentStep.type === 'shiftRows' ? '🔄' : '🔀'}
                </div>
                <div className="font-medium mb-1">
                  {currentStep.type === 'shiftRows' ? 'Row Permutation' : 'Column Diffusion'}
                </div>
                <div className="text-sm">
                  {currentStep.type === 'shiftRows' 
                    ? 'Rows are cyclically shifted left'
                    : 'Columns mixed using GF(2⁸) arithmetic'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Step-specific explanations */}
      {currentStep.type === 'addRoundKey' && (
        <div className="mb-6 bg-white rounded-lg border border-purple-200 p-4">
          <div className="text-center text-purple-700 font-medium mb-2">
            XOR Operation: State ⊕ Round Key = Result
          </div>
          <div className="text-sm text-gray-600 text-center">
            Each byte of the state matrix is XORed with the corresponding byte of the round key
          </div>
        </div>
      )}
      
      {currentStep.type === 'subBytes' && (
        <div className="mb-6 bg-white rounded-lg border border-green-200 p-4">
          <div className="text-center text-green-700 font-medium mb-2">
            Non-linear Substitution: Each byte → S-box lookup → New byte
          </div>
          <div className="text-sm text-gray-600 text-center">
            {mode === 'encrypt' 
              ? 'Each input byte is used as an index into the S-box table to get the substituted output'
              : 'Each input byte is used as an index into the inverse S-box table to reverse the substitution'
            }
          </div>
        </div>
      )}
      
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
            Round {currentStep.roundNumber} of {mode === 'encrypt' ? '10' : '10'}
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
      ? 'Starting with the plaintext arranged in a 4×4 matrix, column-major order. Initial round key (K0) is ready for XOR operation.'
      : 'Starting with the ciphertext arranged in a 4×4 matrix, ready for decryption. Final round key is applied first.',
    'subBytes': mode === 'encrypt'
      ? 'Applying S-box substitution to each byte for non-linear transformation. Round key remains unchanged.'
      : 'Applying inverse S-box substitution to reverse the non-linear transformation. Round key remains unchanged.',
    'shiftRows': mode === 'encrypt'
      ? 'Shifting rows left: Row 0→0, Row 1→1, Row 2→2, Row 3→3 positions. Round key remains unchanged.'
      : 'Shifting rows right to reverse the permutation from encryption. Round key remains unchanged.',
    'mixColumns': mode === 'encrypt'
      ? 'Mixing columns using matrix multiplication in GF(2⁸) for diffusion. Round key remains unchanged.'
      : 'Applying inverse MixColumns to reverse the diffusion transformation. Round key remains unchanged.',
    'addRoundKey': 'XORing each byte of the state matrix with the corresponding byte of the round key. This provides key-dependent transformation and completes the round.'
  };
  
  return descriptions[stepType] || 'Processing AES transformation...';
};

const CollapsibleRound = ({ roundIndex, step, openDefault = false }) => {
  const [open, setOpen] = useState(openDefault);
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="font-semibold text-gray-800">
          {roundIndex === 0 ? "Round 0" : `Round ${roundIndex}`}
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {step.subBytes && <Matrix title="SubBytes" bytes16={step.subBytes} />}
          {step.shiftRows && <Matrix title="ShiftRows" bytes16={step.shiftRows} />}
          {step.mixColumns && <Matrix title="MixColumns" bytes16={step.mixColumns} />}
          {step.addRoundKey && <Matrix title="AddRoundKey" bytes16={step.addRoundKey} />}
        </div>
      )}
    </div>
  );
};

const AESCipher = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("theory");
  const [mode, setMode] = useState("encrypt");
  const [plaintext, setPlaintext] = useState("");
  const [key, setKey] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [trace, setTrace] = useState([]);
  const [initialState, setInitialState] = useState(null);
  const [finalState, setFinalState] = useState(null);
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
    setKey("");
    setPlaintext("");
    setCiphertext("");
    setIsAnimating(false);
    setTrace([]);
    setInitialState(null);
    setFinalState(null);
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

  // Generate animation steps for visualization
  const generateAnimationSteps = (trace, mode, initialState, roundKeys) => {
    const steps = [];
    let previousState = initialState;
    
    // Initial state with first round key
    steps.push({
      type: 'initial',
      state: initialState,
      previousState: null,
      phase: 'processing',
      roundNumber: 0,
      roundKey: roundKeys[0],
      highlightedCells: ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '2-0', '2-1', '2-2', '2-3', '3-0', '3-1', '3-2', '3-3']
    });
    
    // Process each round
    trace.forEach((round, roundIndex) => {
      const roundNumber = roundIndex;
      const currentRoundKey = roundKeys[roundNumber];
      
      if (round.subBytes) {
        steps.push({
          type: 'subBytes',
          state: round.subBytes,
          previousState: previousState,
          phase: 'processing',
          roundNumber: roundNumber,
          roundKey: currentRoundKey,
          highlightedCells: ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '2-0', '2-1', '2-2', '2-3', '3-0', '3-1', '3-2', '3-3']
        });
        previousState = round.subBytes;
      }
      
      if (round.shiftRows) {
        steps.push({
          type: 'shiftRows',
          state: round.shiftRows,
          previousState: previousState,
          phase: 'processing',
          roundNumber: roundNumber,
          roundKey: currentRoundKey,
          highlightedCells: mode === 'encrypt' 
            ? ['1-0', '1-1', '1-2', '1-3', '2-0', '2-1', '2-2', '2-3', '3-0', '3-1', '3-2', '3-3'] // Rows 1,2,3 shifted
            : ['1-0', '1-1', '1-2', '1-3', '2-0', '2-1', '2-2', '2-3', '3-0', '3-1', '3-2', '3-3']
        });
        previousState = round.shiftRows;
      }
      
      if (round.mixColumns) {
        steps.push({
          type: 'mixColumns', 
          state: round.mixColumns,
          previousState: previousState,
          phase: 'processing',
          roundNumber: roundNumber,
          roundKey: currentRoundKey,
          highlightedCells: ['0-0', '1-0', '2-0', '3-0', '0-1', '1-1', '2-1', '3-1', '0-2', '1-2', '2-2', '3-2', '0-3', '1-3', '2-3', '3-3'] // All columns
        });
        previousState = round.mixColumns;
      }
      
      if (round.addRoundKey) {
        steps.push({
          type: 'addRoundKey',
          state: round.addRoundKey,
          previousState: previousState,
          phase: 'completed',
          roundNumber: roundNumber,
          roundKey: currentRoundKey,
          highlightedCells: ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '2-0', '2-1', '2-2', '2-3', '3-0', '3-1', '3-2', '3-3']
        });
        previousState = round.addRoundKey;
      }
    });
    
    return steps;
  };

  // Run animated explanation
  const runAnimatedExplanation = async () => {
    // First run the core encryption/decryption to get trace
    const keyValidation = validateKey(key);
    const inputValidation = validateInput(mode === "encrypt" ? plaintext : ciphertext, mode === "encrypt");
    
    setKeyError(keyValidation.errors.join(", "));
    setInputError(inputValidation.errors.join(", "));
    setWarnings([...keyValidation.warnings, ...inputValidation.warnings]);
    setError("");
    
    if (keyValidation.errors.length > 0 || inputValidation.errors.length > 0) {
      return;
    }
    
    setTrace([]);
    setInitialState(null);
    setFinalState(null);

    const keyBytes = toBytes16(key);
    const rks = expandKey(keyBytes);

    let block, result, rounds;
    
    if (mode === "encrypt") {
      block = toBytes16(plaintext);
      setInitialState(block);
      const encryptResult = encryptBlock(block, rks);
      result = encryptResult.result;
      rounds = encryptResult.rounds;
      setFinalState(result);
      setCiphertext(bytesToHex(result));
    } else {
      const inBytes = parseCipherInput(ciphertext);
      if (inBytes.length !== 16) { 
        setError("Ciphertext must be 16 bytes (32 hex chars or 16 ASCII)."); 
        return; 
      }
      block = inBytes;
      setInitialState(inBytes);
      const decryptResult = decryptBlock(inBytes, rks);
      result = decryptResult.result;
      rounds = decryptResult.rounds;
      setFinalState(result);
      const asPrintable = bytesToPrintableAscii(result);
      setPlaintext(asPrintable);
    }
    
    setTrace(rounds);
    
    // Generate animation steps with round keys
    const steps = generateAnimationSteps(rounds, mode, block, rks);
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
    } else if (keyStr.length < 16) {
      warnings.push(`Key is ${keyStr.length} chars, will be padded to 16 with spaces`);
    } else if (keyStr.length > 16) {
      warnings.push(`Key is ${keyStr.length} chars, will be truncated to 16`);
    }
    
    // Check for weak keys
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
      if (inputStr.length < 16) {
        warnings.push(`Plaintext is ${inputStr.length} chars, will be padded to 16 with spaces`);
      } else if (inputStr.length > 16) {
        warnings.push(`Plaintext is ${inputStr.length} chars, will be truncated to 16`);
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
        if (clean.length !== 32) {
          errors.push(`Hex ciphertext must be exactly 32 characters (got ${clean.length})`);
        }
      } else {
        // Assume ASCII input
        if (inputStr.length !== 16) {
          errors.push(`ASCII ciphertext must be exactly 16 characters (got ${inputStr.length})`);
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
    return isHex ? hexToBytes(clean) : toBytes16(clean);
  };

  const runCore = (explain) => {
    // Validate inputs before processing
    const keyValidation = validateKey(key);
    const inputValidation = validateInput(mode === "encrypt" ? plaintext : ciphertext, mode === "encrypt");
    
    setKeyError(keyValidation.errors.join(", "));
    setInputError(inputValidation.errors.join(", "));
    setWarnings([...keyValidation.warnings, ...inputValidation.warnings]);
    setError("");
    
    // Stop if there are validation errors
    if (keyValidation.errors.length > 0 || inputValidation.errors.length > 0) {
      return;
    }
    
    setTrace([]);
    setInitialState(null);
    setFinalState(null);

    const keyBytes = toBytes16(key);
    const rks = expandKey(keyBytes);

    if (mode === "encrypt") {
      const block = toBytes16(plaintext);
      setInitialState(block);
      const { result, rounds } = encryptBlock(block, rks);
      setFinalState(result);
      setCiphertext(bytesToHex(result));
      if (explain) setTrace(rounds);
    } else {
      const inBytes = parseCipherInput(ciphertext);
      if (inBytes.length !== 16) { setError("Ciphertext must be 16 bytes (32 hex chars or 16 ASCII)."); return; }
      setInitialState(inBytes);
      const { result, rounds } = decryptBlock(inBytes, rks);
      setFinalState(result);
      // Try to show printable ASCII; else \xHH
      const asPrintable = bytesToPrintableAscii(result);
      setPlaintext(asPrintable);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AES Cipher (AES‑128, ECB)</h1>
          <p className="text-gray-600">Encrypt, decrypt, and visualize AES rounds step by step</p>
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
                The <span className="font-semibold text-blue-600">Advanced Encryption Standard (AES)</span> is a symmetric-key block cipher that is the global standard for securing digital information. It was adopted by the U.S. National Institute of Standards and Technology (NIST) in 2001 as the successor to DES, a testament to its efficiency, security, and versatility.
              </p>
            </div>

            {/* Origin Story Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Origin Story</h3>
              <p className="text-gray-700 leading-relaxed">
                The selection of AES was the result of a public, five-year competition held by NIST to find a replacement for DES, which was becoming obsolete due to its small key size. The winning algorithm was <span className="font-semibold text-blue-600">Rijndael</span>, designed by Belgian cryptographers Joan Daemen and Vincent Rijmen. The transparent, open nature of this competition was a stark contrast to the secretive design process of DES and was crucial in building trust in the new standard.
              </p>
            </div>

            {/* Core Idea Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Core Idea</h3>
              <p className="text-gray-700 leading-relaxed">
                AES is a <span className="font-semibold text-blue-600">Substitution-Permutation Network (SPN)</span> that operates on fixed-size blocks of 128 bits, regardless of the key length. This is a departure from the Feistel structure of DES. The algorithm's security stems from its iterative application of a series of reversible transformations that create both confusion and diffusion. These transformations are based on substitution (the S-box), permutation (row shifts), and key mixing (XOR).
              </p>
            </div>

            {/* Technical Blueprint Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Technical Blueprint</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The AES algorithm operates on a 4×4 matrix of bytes, which represents the 128-bit data block. The number of transformation rounds depends on the key length: 10 rounds for a 128-bit key, 12 for a 192-bit key, and 14 for a 256-bit key. The encryption process begins with an <span className="font-semibold text-blue-600">Initial AddRoundKey</span> step, where the plaintext is XORed with the first round key.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Each subsequent round (except for the final one) consists of four steps:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <span className="font-semibold text-blue-700">SubBytes:</span>
                    <span className="text-gray-700"> A non-linear substitution operation where each byte in the state matrix is replaced with a new byte from a fixed lookup table called a substitution box (S-box).</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <span className="font-semibold text-blue-700">ShiftRows:</span>
                    <span className="text-gray-700"> A permutation operation where the rows of the matrix are cyclically shifted to the left by different offsets. Row 0 is not shifted, Row 1 is shifted one byte, Row 2 is shifted two bytes, and Row 3 is shifted three bytes.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <span className="font-semibold text-blue-700">MixColumns:</span>
                    <span className="text-gray-700"> A mixing operation where each column is transformed by matrix multiplication over a finite field. This step, which is omitted in the final round, provides robust diffusion across the block.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <span className="font-semibold text-blue-700">AddRoundKey:</span>
                    <span className="text-gray-700"> The current round key, derived from the original key through a key expansion process, is XORed with the entire state matrix.</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                Decryption is performed by applying the inverse of each of these steps in the reverse order.
              </p>
            </div>

            {/* Security Scorecard Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Security Scorecard</h3>
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold mr-3">
                    HIGHLY SECURE - CURRENT STANDARD
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                AES is considered highly secure and has withstood extensive cryptanalysis since its standardization. Its strength is a result of its substitution-permutation network design and its large key lengths, which make brute-force attacks computationally infeasible. The use of key expansion ensures that each round uses a unique, derived key.
              </p>
            </div>

            {/* Real-World Usage Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700 border-b-2 border-blue-500 pb-2">Real-World Usage</h3>
              <p className="text-gray-700 leading-relaxed">
                AES is ubiquitous in modern digital life. Its combination of speed, security, and hardware acceleration support makes it the go-to algorithm for a vast range of applications. It is used to secure web traffic (HTTPS), virtual private networks (VPNs), wireless security protocols (WPA2/WPA3), file encryption, and financial transactions. Its status as a global standard for classified U.S. government data further solidifies its position as a cornerstone of modern security.
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
                Let's walk through a complete AES-128 encryption example to understand how the algorithm transforms plaintext into ciphertext step by step.
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
                      <span className="font-mono text-green-600 bg-white px-2 py-1 rounded ml-2">Hello AES World!</span>
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Key:</strong> 
                      <span className="font-mono text-purple-600 bg-white px-2 py-1 rounded ml-2">MySecretAESKey16</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Algorithm:</strong> AES-128 ECB
                    </p>
                    <p className="text-gray-700">
                      <strong className="text-blue-600">Rounds:</strong> 10 rounds + initial round
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4 italic">
                  Note: In practice, use a more secure mode than ECB and ensure proper key management.
                </p>
              </div>
            </div>

            {/* Step 1: Data Preparation */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 1: Data Preparation</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-3">
                    Both the plaintext and key are converted to bytes and arranged in 4×4 state matrices:
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Plaintext Matrix */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-3 text-center">Plaintext State Matrix</h5>
                      <div className="flex justify-center">
                        <table className="border-collapse text-center font-mono text-sm">
                          <tbody>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-green-100">48</td>
                              <td className="border border-gray-400 p-2 bg-green-100">6C</td>
                              <td className="border border-gray-400 p-2 bg-green-100">53</td>
                              <td className="border border-gray-400 p-2 bg-green-100">6F</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-green-100">65</td>
                              <td className="border border-gray-400 p-2 bg-green-100">6C</td>
                              <td className="border border-gray-400 p-2 bg-green-100">20</td>
                              <td className="border border-gray-400 p-2 bg-green-100">72</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-green-100">6C</td>
                              <td className="border border-gray-400 p-2 bg-green-100">6F</td>
                              <td className="border border-gray-400 p-2 bg-green-100">57</td>
                              <td className="border border-gray-400 p-2 bg-green-100">6C</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-green-100">6C</td>
                              <td className="border border-gray-400 p-2 bg-green-100">20</td>
                              <td className="border border-gray-400 p-2 bg-green-100">64</td>
                              <td className="border border-gray-400 p-2 bg-green-100">21</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-600 text-center mt-2">
                        H e l l o   A E S   W o r l d !
                      </p>
                    </div>

                    {/* Key Matrix */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-3 text-center">Key State Matrix (Round 0)</h5>
                      <div className="flex justify-center">
                        <table className="border-collapse text-center font-mono text-sm">
                          <tbody>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-purple-100">4D</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">63</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">74</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">65</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-purple-100">79</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">72</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">41</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">79</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-purple-100">53</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">65</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">45</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">31</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-2 bg-purple-100">65</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">74</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">53</td>
                              <td className="border border-gray-400 p-2 bg-purple-100">36</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-600 text-center mt-2">
                        M y S e c r e t A E S K e y 1 6
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Initial Round */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 2: Initial AddRoundKey</h4>
              <p className="text-gray-700 mb-4">
                The encryption begins by XORing the plaintext with the initial round key:
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-center mb-3">
                  <span className="text-lg font-semibold text-blue-700">State ⊕ Round Key 0 = Initial State</span>
                </div>
                
                <div className="flex justify-center">
                  <table className="border-collapse text-center font-mono text-sm">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-2 bg-yellow-100">05</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">0F</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">27</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">0A</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 bg-yellow-100">1C</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">1E</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">61</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">0B</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 bg-yellow-100">3F</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">0A</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">12</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">5D</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 bg-yellow-100">09</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">54</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">37</td>
                        <td className="border border-gray-400 p-2 bg-yellow-100">17</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <p className="text-sm text-gray-600 text-center mt-3">
                  Result after XOR operation with Round Key 0
                </p>
              </div>
            </div>

            {/* Step 3: Round Operations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 3: Round Operations (Rounds 1-10)</h4>
              
              <div className="space-y-6">
                <p className="text-gray-700">
                  Each of the 10 rounds applies four transformations in sequence. Here's what happens in each round:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SubBytes */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                      <h5 className="font-semibold text-red-700">SubBytes</h5>
                    </div>
                    <p className="text-sm text-gray-700">
                      Each byte is substituted using the AES S-box lookup table. This provides non-linearity and confusion.
                    </p>
                    <div className="mt-2 text-xs text-gray-600 font-mono">
                      Example: 05 → 63, 0F → 76
                    </div>
                  </div>

                  {/* ShiftRows */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                      <h5 className="font-semibold text-orange-700">ShiftRows</h5>
                    </div>
                    <p className="text-sm text-gray-700">
                      Rows are cyclically shifted left. Row 0: no shift, Row 1: 1 position, Row 2: 2 positions, Row 3: 3 positions.
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Provides diffusion across the state
                    </div>
                  </div>

                  {/* MixColumns */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                      <h5 className="font-semibold text-green-700">MixColumns</h5>
                    </div>
                    <p className="text-sm text-gray-700">
                      Each column is multiplied by a fixed polynomial matrix over GF(2⁸). Omitted in the final round.
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Maximum diffusion within columns
                    </div>
                  </div>

                  {/* AddRoundKey */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                      <h5 className="font-semibold text-blue-700">AddRoundKey</h5>
                    </div>
                    <p className="text-sm text-gray-700">
                      The state is XORed with the current round key derived from the original key through key expansion.
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Introduces key material into the state
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 text-center">
                    <strong>Note:</strong> The final round (Round 10) omits the MixColumns step and applies only SubBytes, ShiftRows, and AddRoundKey.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Final Result */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Step 4: Final Ciphertext</h4>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    After 10 rounds of transformation, our plaintext has been converted to ciphertext:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Original Plaintext:</p>
                      <div className="font-mono text-lg bg-green-100 text-green-800 px-4 py-2 rounded border">
                        Hello AES World!
                      </div>
                    </div>
                    
                    <div className="text-2xl text-gray-500">↓</div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Final Ciphertext (Hex):</p>
                      <div className="font-mono text-lg bg-red-100 text-red-800 px-4 py-2 rounded border">
                        3AD77BB40D7A3660A89ECAF32466EF97
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4 italic">
                    The exact ciphertext depends on the implementation and may vary slightly between different AES libraries.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Try */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Try It Yourself</h4>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 mb-3">
                  <strong>Want to see this in action?</strong>
                </p>
                <p className="text-gray-700 text-sm mb-4">
                  Switch to the "Cipher" tab and use the sample data to encrypt "Hello AES World!" with key "MySecretAESKey16". 
                  Click "Explain" to see each step of the process visualized!
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
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive AES Tool</h2>

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
                        setCiphertext("");
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key (16 ASCII chars)</label>
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
                    placeholder="Enter 16 characters..."
                    title="Enter AES-128 key (16 ASCII characters)"
                  />
                  {keyError && (
                    <p className="mt-1 text-sm text-red-600">{keyError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Current length: {key.length}/16 • {key.length < 16 ? 'Will be padded' : key.length > 16 ? 'Will be truncated' : 'Perfect length'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "encrypt" ? "Plaintext (16 ASCII chars)" : "Ciphertext (32 HEX or 16 ASCII)"}
                  </label>
                  <input
                    type="text"
                    value={mode === "encrypt" ? plaintext : ciphertext}
                    onChange={(e) => {
                      if (mode === "encrypt") {
                        setPlaintext(e.target.value);
                      } else {
                        setCiphertext(e.target.value.toUpperCase());
                      }
                      if (inputError) setInputError("");
                      if (warnings.length > 0) setWarnings([]);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      inputError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={mode === "encrypt" ? "Enter 16 characters..." : "Enter 32 hex chars or 16 ASCII chars..."}
                    title={mode === "encrypt" 
                      ? "Enter plaintext (16 ASCII characters)"
                      : "Enter ciphertext (32 hex characters or 16 ASCII characters)"
                    }
                  />
                  {inputError && (
                    <p className="mt-1 text-sm text-red-600">{inputError}</p>
                  )}
                  {mode === "encrypt" ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Current length: {plaintext.length}/16 • {plaintext.length < 16 ? 'Will be padded' : plaintext.length > 16 ? 'Will be truncated' : 'Perfect length'}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      {ciphertext.replace(/\s+/g, '').length > 0 && /^[0-9a-fA-F\s]+$/.test(ciphertext) 
                        ? `Hex format detected • Length: ${ciphertext.replace(/\s+/g, '').length}/32`
                        : `ASCII format • Length: ${ciphertext.length}/16`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "encrypt" ? "Ciphertext (HEX)" : "Decrypted Text"}
                  </label>
                  <input
                    type="text"
                    value={mode === "encrypt" ? (ciphertext || "") : plaintext}
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
                      setKey("MySecretAESKey16");
                      setPlaintext("Hello AES World!");
                      setCiphertext("");
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
                    onClick={reset}
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
              {(key || (mode === "encrypt" ? plaintext : ciphertext)) && (
                <div className="mt-4 p-3 rounded bg-blue-50 text-blue-700 text-sm border border-blue-200">
                  <div className="font-medium mb-2">📋 Input Status:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${keyError ? 'text-red-600' : 'text-green-600'}`}>
                      {keyError ? '❌' : '✅'} Key: {key.length}/16 chars
                      {keyError && ` (${keyError})`}
                    </div>
                    <div className={`flex items-center gap-1 ${inputError ? 'text-red-600' : 'text-green-600'}`}>
                      {inputError ? '❌' : '✅'} {mode === "encrypt" ? "Plaintext" : "Ciphertext"}:
                      {mode === "encrypt" 
                        ? ` ${plaintext.length}/16 chars`
                        : ciphertext.replace(/\s+/g, '').length > 0 && /^[0-9a-fA-F\s]+$/.test(ciphertext)
                          ? ` ${ciphertext.replace(/\s+/g, '').length}/32 hex`
                          : ` ${ciphertext.length}/16 ASCII`
                      }
                      {inputError && ` (${inputError})`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Animated Visualization */}
            {showAnimation && (
              <AnimatedAESVisualization
                isAnimating={autoPlay}
                animationSteps={animationSteps}
                currentStepIndex={currentStepIndex}
                mode={mode}
                onStepChange={handleStepChange}
                onToggleAnimation={toggleAutoPlay}
              />
            )}

            {/* Static Round Visualization - only show when not animating */}
            {!showAnimation && (trace.length > 0 || initialState || finalState) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Round Visualization</h3>

                {trace.length > 0 ? (
                  <div className="space-y-3">
                    {trace.map((step, idx) => (
                      <CollapsibleRound
                        key={idx}
                        roundIndex={idx}
                        step={step}
                        openDefault={idx === 0 || idx === trace.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {initialState && (
                      <Matrix
                        title={mode === "encrypt" ? "Initial State (Plaintext)" : "Initial State (Ciphertext)"}
                        bytes16={initialState}
                      />
                    )}
                    {finalState && (
                      <Matrix
                        title={mode === "encrypt" ? "Final State (Ciphertext)" : "Final State (Plaintext)"}
                        bytes16={finalState}
                      />
                    )}
                  </div>
                )}

                {isAnimating && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Processing AES rounds…</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Showing SubBytes, ShiftRows, MixColumns, and AddRoundKey per round.
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

export default AESCipher;
