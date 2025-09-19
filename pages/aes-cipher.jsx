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

const Matrix = ({ title, bytes16 }) => {
  const m = bytes16 ? toMatrixRows(bytes16) : [[], [], [], []];
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="font-semibold text-gray-800 mb-3">{title}</div>
      <div className="inline-block border rounded-lg overflow-hidden">
        {m.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 font-mono text-xs"
                title={`[${r},${c}]`}
              >
                {typeof cell === "number" ? cell.toString(16).padStart(2, "0").toUpperCase() : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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

  const reset = () => {
    setIsAnimating(false);
    setTrace([]);
    setInitialState(null);
    setFinalState(null);
    setError("");
    setKeyError("");
    setInputError("");
    setWarnings([]);
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
    setIsAnimating(true);
    runCore(true);
    setTimeout(() => setIsAnimating(false), 800);
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-blue-700">Introduction</h1>
              <p>The Advanced Encryption Standard (AES) is a symmetric-key block cipher that is the global standard for securing digital information. It was adopted by the U.S. National Institute of Standards and Technology (NIST) in 2001 as the successor to DES, a testament to its efficiency, security, and versatility.</p>
              
              <h2 className="text-2xl font-semibold text-blue-600 mt-6">Origin Story</h2>
              <p>The selection of AES was the result of a public, five-year competition held by NIST to find a replacement for DES, which was becoming obsolete due to its small key size. The winning algorithm was Rijndael, designed by Belgian cryptographers Joan Daemen and Vincent Rijmen. The transparent, open nature of this competition was a stark contrast to the secretive design process of DES and was crucial in building trust in the new standard.</p>
              
              <h2 className="text-2xl font-semibold text-blue-600 mt-6">Core Idea</h2>
              <p>AES is a **Substitution-Permutation Network (SPN)** that operates on fixed-size blocks of 128 bits, regardless of the key length. This is a departure from the Feistel structure of DES. The algorithm's security stems from its iterative application of a series of reversible transformations that create both confusion and diffusion. These transformations are based on substitution (the S-box), permutation (row shifts), and key mixing (XOR).</p>
              
              <h2 className="text-2xl font-semibold text-blue-600 mt-6">Technical Blueprint</h2>
              <p>The AES algorithm operates on a $4 \times 4$ matrix of bytes, which represents the 128-bit data block. The number of transformation rounds depends on the key length: 10 rounds for a 128-bit key, 12 for a 192-bit key, and 14 for a 256-bit key. The encryption process begins with an **Initial AddRoundKey** step, where the plaintext is XORed with the first round key.  Each subsequent round (except for the final one) consists of four steps:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li><strong>SubBytes:</strong> A non-linear substitution operation where each byte in the state matrix is replaced with a new byte from a fixed lookup table called a substitution box (S-box).</li>
                <li><strong>ShiftRows:</strong> A permutation operation where the rows of the matrix are cyclically shifted to the left by different offsets. Row 0 is not shifted, Row 1 is shifted one byte, Row 2 is shifted two bytes, and Row 3 is shifted three bytes.</li>
                <li><strong>MixColumns:</strong> A mixing operation where each column is transformed by matrix multiplication over a finite field. This step, which is omitted in the final round, provides robust diffusion across the block.</li>
                <li><strong>AddRoundKey:</strong> The current round key, derived from the original key through a key expansion process, is XORed with the entire state matrix.</li>
              </ul>
              <p className="mt-4">Decryption is performed by applying the inverse of each of these steps in the reverse order.</p>

              <h2 className="text-2xl font-semibold text-blue-600 mt-6">Security Scorecard</h2>
              <p>AES is considered highly secure and has withstood extensive cryptanalysis since its standardization. Its strength is a result of its substitution-permutation network design and its large key lengths, which make brute-force attacks computationally infeasible. The use of key expansion ensures that each round uses a unique, derived key.</p>
              
              <h2 className="text-2xl font-semibold text-blue-600 mt-6">Real-World Usage</h2>
              <p>AES is ubiquitous in modern digital life. Its combination of speed, security, and hardware acceleration support makes it the go-to algorithm for a vast range of applications. It is used to secure web traffic (HTTPS), virtual private networks (VPNs), wireless security protocols (WPA2/WPA3), file encryption, and financial transactions. Its status as a global standard for classified U.S. government data further solidifies its position as a cornerstone of modern security.</p>
            </div>
          </div>
        )}

        {/* Example */}
        {activeTab === "example" && (
          <div className="p-8 space-y-6 text-gray-800">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-blue-700">Solved Example:</h1>
              <p>A full numerical walkthrough of an AES round is complex, but a conceptual example can illustrate the effect of each step on a simplified data block.</p>
              <h3 className="text-xl font-medium text-blue-500 mt-4">Example: A single round of AES-128 encryption.</h3>
              <p><strong>Plaintext Block:</strong> <code>00 11 22 33 44 55 66 77 88 99 AA BB CC DD EE FF</code></p>
              <p><strong>Initial Key:</strong> <code>01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF</code></p>
              <p className="text-sm italic">Note: These values are for demonstration purposes only.</p>
              
              <h3 className="text-xl font-medium text-blue-500 mt-6">Step 1: The Initial State</h3>
              <p>The 128-bit plaintext is arranged into a $4 \times 4$ state matrix, column-wise:</p>
              <pre className="bg-gray-100 p-4 rounded-lg font-mono text-sm mt-2 overflow-x-auto">
                00  44  88  CC<br />
                11  55  99  DD<br />
                22  66  AA  EE<br />
                33  77  BB  FF<br />
              </pre>
              
              <h3 className="text-xl font-medium text-blue-500 mt-6">Step 2: Initial AddRoundKey</h3>
              <p>The initial state is XORed ($\oplus$) with the original key (RoundKey0):</p>
              <pre className="bg-gray-100 p-4 rounded-lg font-mono text-sm mt-2 overflow-x-auto">
                00$\oplus$01  44$\oplus$89  88$\oplus$01  CC$\oplus$89<br />
                11$\oplus$23  55$\oplus$AB  99$\oplus$23  DD$\oplus$AB<br />
                22$\oplus$45  66$\oplus$CD  AA$\oplus$45  EE$\oplus$CD<br />
                33$\oplus$67  77$\oplus$EF  BB$\oplus$67  FF$\oplus$EF<br />
              </pre>
              <p className="mt-2">This produces a new state matrix.</p>

              <h3 className="text-xl font-medium text-blue-500 mt-6">Step 3: Round 1 (of 10 total rounds)</h3>
              <p>The new state matrix undergoes the four main round steps.</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
                <li><strong>SubBytes:</strong> Each byte in the matrix is replaced by a value from the S-box lookup table. For example, <code>00</code> from the first row and column might be replaced with <code>63</code>.</li>
                <li><strong>ShiftRows:</strong> The rows are cyclically shifted. Row 0 is unchanged. Row 1 is shifted left by 1 byte. Row 2 is shifted left by 2 bytes. Row 3 is shifted left by 3 bytes. This permutation moves bytes to new columns, spreading their influence.</li>
                <li><strong>MixColumns:</strong> Each column of the matrix is treated as a vector and multiplied by a fixed, invertible matrix over a finite field. This is a complex mathematical operation that ensures a single change in an input bit diffuses throughout the entire column, increasing the cipher's diffusion.</li>
                <li><strong>AddRoundKey:</strong> The resulting matrix is XORed with the next round key, which was generated in the key expansion process.</li>
              </ul>
              <p className="mt-4">These four steps are repeated for the remaining rounds. The final round omits the MixColumns step, and the final AddRoundKey produces the ciphertext. Decryption reverses this process by applying the inverse operations in the opposite order.</p>
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

                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={18} />
                  Reset
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
                    onClick={() => {
                      setKey("");
                      setPlaintext("");
                      setCiphertext("");
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

            {(trace.length > 0 || initialState || finalState) && (
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
      <footer className="text-center py-8">
        <p className="text-gray-600 text-sm">
          AES Cipher Simulation Tool © 2025
        </p>
      </footer>
    </div>
  );
};

export default AESCipher;
