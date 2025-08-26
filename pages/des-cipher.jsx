//des-cipher.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw } from "lucide-react";

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
  const ER = permute(R, E);              // 32 -> 48
  const x = xorBits(ER, K);              // 48
  const s = sboxSubstitute(x);           // 48 -> 32
  const p = permute(s, P);               // 32
  const newR = xorBits(L, p);            // 32
  const newL = R;                        // 32
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

const NibbleGrid = ({ title, bits, perRow = 16 }) => {
  const nibbles = bitsToHexNibbles(bits);
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="font-semibold text-gray-800 mb-3">{title}</div>
      <div className="flex flex-wrap gap-1">
        {nibbles.map((h, i) => (
          <div
            key={i}
            className="w-8 h-8 border-2 rounded flex items-center justify-center text-sm font-mono border-blue-300 bg-blue-50 text-blue-700"
            title={`Nibble ${i}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-600 font-mono break-all">{nibbles.join("")}</div>
    </div>
  );
};

const HalfRow = ({ title, bits32 }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="font-semibold text-gray-800 mb-2">{title}</div>
    <div className="font-mono text-sm bg-gray-50 rounded p-2 overflow-x-auto">
      {bitsToHexNibbles(bits32).join("") /* 8 hex */}
    </div>
  </div>
);

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
  const [activeTab, setActiveTab] = useState("interactive");
  const [mode, setMode] = useState("encrypt");
  const [plaintext, setPlaintext] = useState("DES DEMO "); // 8 chars
  const [key, setKey] = useState("8byteKey");             // 8 chars (padded/truncated)
  const [cipherInput, setCipherInput] = useState("");     // hex or ascii for decrypt / hex output for encrypt
  const [isAnimating, setIsAnimating] = useState(false);
  const [trace, setTrace] = useState([]);                 // per-round
  const [initial, setInitial] = useState(null);           // 64 bits
  const [final, setFinal] = useState(null);               // 64 bits
  const [subkeys, setSubkeys] = useState([]);             // K1..K16 (for display)
  const [error, setError] = useState("");

  const reset = () => {
    setIsAnimating(false);
    setTrace([]);
    setInitial(null);
    setFinal(null);
    setError("");
  };

  const parseCipherInput = (val) => {
    const clean = val.trim();
    const isHex = clean.length > 0 && clean.length % 2 === 0 && /^[0-9a-fA-F\s]+$/.test(clean);
    return isHex ? hexToBytes(clean) : toBytes8(clean);
  };

  const runCore = (explain) => {
    reset();

    const keyBytes = toBytes8(key);
    const Ks = keySchedule(keyBytes);   // K1..K16 (48 bits)
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
    setIsAnimating(true);
    runCore(true);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
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
              onClick={() => setActiveTab("interactive")}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === "interactive" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Interactive Tool
            </button>
          </div>
        </div>

        {/* Theory */}

        {activeTab === "theory" && (
          <div class="p-8 space-y-6 text-gray-800">
            <div className="bg-white rounded-lg shadow-lg p-6">

              <h1 class="text-3xl font-bold text-indigo-700">Introduction to DES (Data Encryption Standard)</h1>
              <p>
                The Data Encryption Standard (DES) is a symmetric key encryption algorithm developed in the early 1970s by IBM and adopted as a federal standard by the U.S. National Institute of Standards and Technology (NIST) in 1977. It was the first modern cipher standardized for widespread public use and became the cornerstone of digital security for over two decades.
              </p>

              <h2 class="text-2xl font-semibold text-blue-600">Why Was DES Created?</h2>
              <p>
                In the 1970s, digital communication systems were becoming increasingly popular, and there was an urgent need for a standardized way to protect sensitive data. IBM's Lucifer algorithm was modified and submitted to the NBS (now NIST), and with collaboration from the NSA, it was refined into what we know today as DES. The final version was published as FIPS PUB 46 in 1977.
              </p>

              <h2 class="text-2xl font-semibold text-blue-600">Key Characteristics of DES</h2>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li><strong>Type:</strong> Symmetric-key block cipher</li>
                <li><strong>Block Size:</strong> 64 bits</li>
                <li><strong>Key Size:</strong> 64 bits (56 bits used for encryption, 8 bits for parity check)</li>
                <li><strong>Structure:</strong> 16-round Feistel network</li>
                <li><strong>Mode of Operation:</strong> Can be used in ECB, CBC, CFB, OFB, and CTR modes</li>
                <li><strong>Speed:</strong> Efficient in hardware; slower in software by modern standards</li>
              </ul>

              <h2 class="text-2xl font-semibold text-blue-600">DES Encryption Process</h2>
              <p>
                DES transforms a 64-bit block of plaintext into a 64-bit block of ciphertext through multiple permutations and substitutions across 16 rounds. The structure of DES is based on a Feistel network where each round modifies half of the data based on a function of the other half and a round-specific key.
              </p>

              <h3 class="text-xl font-medium text-blue-500">Steps</h3>
              <ul class="list-decimal list-inside ml-4 space-y-1">
                <li>Initial Permutation (IP)</li>
                <li>Split into Left (L) and Right (R) halves</li>
                <li>For 16 Rounds: R[i] = L[i-1], L[i] = R[i-1] XOR f(L[i-1], Key[i])</li>
                <li>Final Permutation (IP<sup>-1</sup>)</li>
              </ul>

              <h2 class="text-2xl font-semibold text-blue-600">DES Decryption Process</h2>
              <p>
                The decryption process of DES is the same as encryption except the round keys are used in reverse order. The symmetry of the Feistel structure allows encryption and decryption to use the same algorithm.
              </p>

              <h2 class="text-2xl font-semibold text-blue-600">Mathematics Behind DES</h2>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li><strong>Expansion:</strong> 32-bit half block is expanded to 48 bits</li>
                <li><strong>Substitution:</strong> 48-bit block passes through 8 S-boxes (each 6-bit input → 4-bit output)</li>
                <li><strong>Permutation:</strong> The output is permuted using a fixed P-table</li>
                <li><strong>XOR:</strong> Round key is XORed with the expanded block</li>
              </ul>

              <h2 class="text-2xl font-semibold text-blue-600">Security of DES</h2>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li><strong>Short Key Length:</strong> 56 bits are vulnerable to brute-force attacks</li>
                <li><strong>Known Attacks:</strong> Differential and linear cryptanalysis</li>
                <li><strong>Triple DES (3DES):</strong> Applied DES three times to improve security (Encrypt-Decrypt-Encrypt)</li>
              </ul>

              <h2 class="text-2xl font-semibold text-blue-600">Modern Replacement</h2>
              <p>
                DES is now considered insecure for most applications. It has been replaced by the Advanced Encryption Standard (AES), which supports longer key lengths and more robust security.
              </p>

              <h2 class="text-xl font-medium text-green-700">References</h2>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li><a href="https://en.wikipedia.org/wiki/Data_Encryption_Standard" class="text-blue-500 underline">Wikipedia – Data Encryption Standard</a></li>
                <li><a href="https://www.geeksforgeeks.org/data-encryption-standard-des-set-1/" class="text-blue-500 underline">GeeksforGeeks – DES Explained</a></li>
                <li><a href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.46-3.pdf" class="text-blue-500 underline">FIPS PUB 46-3 (NIST) – DES Standard</a></li>
              </ul>
            </div>
          </div>)}
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
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="encrypt">Encrypt</option>
                    <option value="decrypt">Decrypt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key (8 ASCII chars)</label>
                  <input
                    type="text"
                    value={key}
                    maxLength={8}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8 chars (parity ignored)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "encrypt" ? "Plaintext (8 ASCII chars)" : "Ciphertext (16 HEX or 8 ASCII)"}
                  </label>
                  <input
                    type="text"
                    value={mode === "encrypt" ? plaintext : cipherInput}
                    onChange={(e) => (mode === "encrypt" ? setPlaintext(e.target.value) : setCipherInput(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={mode === "encrypt" ? "Exactly 8 chars (pad/truncate)" : "e.g. 85E813540F0AB405"}
                  />
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

              <div className="flex gap-4 mt-6">
                <button
                  onClick={runExplain}
                  disabled={isAnimating}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={18} />
                  {isAnimating ? "Visualizing..." : "Explain"}
                </button>

                <button
                  onClick={() => runCore(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {mode === "encrypt" ? <Lock size={18} /> : <Unlock size={18} />}
                  {mode === "encrypt" ? "Encrypt" : "Decrypt"}
                </button>

                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
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

            {/* Round visualization */}
            {(trace.length > 0 || initial || final) && (
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
    </div>
  );
};

export default DESCipher;
