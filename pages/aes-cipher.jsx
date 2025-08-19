//aes-cipher.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw } from "lucide-react";

/* =========================================================================================
   Minimal AES-128 ECB implementation with round-by-round trace (inside this single file)
   ========================================================================================= */

// --- Tables (S-Box, Inv S-Box, Rcon) ---
const S = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];
const iS = [
  0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb,
  0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb,
  0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e,
  0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25,
  0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,0xb6,0x92,
  0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,0x9d,0x84,
  0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,0x45,0x06,
  0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,0x8a,0x6b,
  0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,0xe6,0x73,
  0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,0xdf,0x6e,
  0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,0xbe,0x1b,
  0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,0x5a,0xf4,
  0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,0xec,0x5f,
  0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,0x9c,0xef,
  0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,0x99,0x61,
  0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,0x0c,0x7d
];
const RCON = [
  0x00000000,0x01000000,0x02000000,0x04000000,0x08000000,
  0x10000000,0x20000000,0x40000000,0x80000000,0x1b000000,0x36000000
];

// --- Helpers ---
const te = new TextEncoder();
const td = new TextDecoder();

const toBytes16 = (str) => {
  const b = te.encode(str);
  const out = new Uint8Array(16).fill(0x20);
  out.set(b.slice(0, 16));
  return out;
};
const bytesToHex = (bytes) => Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
const hexToBytes = (hex) => {
  const clean = hex.replace(/\s+/g,"");
  if (clean.length % 2) return new Uint8Array();
  const out = new Uint8Array(clean.length/2);
  for (let i=0;i<out.length;i++) out[i]=parseInt(clean.substr(i*2,2),16);
  return out;
};
const bytesToPrintableAscii = (bytes) => {
  let s = "";
  for (const b of bytes) s += (b>=32 && b<=126) ? String.fromCharCode(b) : "\\x"+b.toString(16).padStart(2,"0");
  return s;
};

// State <-> Matrix (row-major for display; internally we keep a 16-byte array)
const toMatrixRows = (bytes16) => {
  const m = [[],[],[],[]];
  for (let i=0;i<16;i++) m[Math.floor(i/4)].push(bytes16[i]);
  return m;
};

// Galois mult
const xtime = (a)=>((a<<1) ^ ((a & 0x80)?0x1b:0)) & 0xff;
const gmul = (a,b)=>{
  let p=0;
  for(let i=0;i<8;i++){
    if (b & 1) p^=a;
    const hi=a&0x80;
    a=(a<<1)&0xff;
    if(hi) a^=0x1b;
    b>>=1;
  }
  return p;
};

// Round steps
const subBytes = (s)=>s.map(b=>S[b]);
const invSubBytes = (s)=>s.map(b=>iS[b]);

// Rotate left a 4-byte row by n
const rotl4 = (row4, n) => {
  const out = new Uint8Array(4);
  for (let c = 0; c < 4; c++) out[c] = row4[(c + n) % 4];
  return out;
};
console.log(rotl4([1,2,3,4], 1));
// Rotate right a 4-byte row by n
const rotr4 = (row4, n) => {
  const out = new Uint8Array(4);
  for (let c = 0; c < 4; c++) out[c] = row4[(c - n + 4) % 4];
  return out;
};

const shiftRows = (s) => {
  const t = s.slice();                 // Uint8Array(16)
  for (let r = 0; r < 4; r++) {
    const base = r * 4;
    const row = t.slice(base, base + 4);     // Uint8Array(4)
    const rot = rotl4(row, r);               // rotate left by r
    for (let c = 0; c < 4; c++) t[base + c] = rot[c];
  }
  return t;
};

const invShiftRows = (s) => {
  const t = s.slice();
  for (let r = 0; r < 4; r++) {
    const base = r * 4;
    const row = t.slice(base, base + 4);
    const rot = rotr4(row, r);               // rotate right by r
    for (let c = 0; c < 4; c++) t[base + c] = rot[c];
  }
  return t;
};


const mixSingleColumn = (a)=>[
  gmul(0x02,a[0]) ^ gmul(0x03,a[1]) ^ a[2] ^ a[3],
  a[0] ^ gmul(0x02,a[1]) ^ gmul(0x03,a[2]) ^ a[3],
  a[0] ^ a[1] ^ gmul(0x02,a[2]) ^ gmul(0x03,a[3]),
  gmul(0x03,a[0]) ^ a[1] ^ a[2] ^ gmul(0x02,a[3])
].map(x=>x&0xff);

const invMixSingleColumn = (a)=>[
  gmul(0x0e,a[0]) ^ gmul(0x0b,a[1]) ^ gmul(0x0d,a[2]) ^ gmul(0x09,a[3]),
  gmul(0x09,a[0]) ^ gmul(0x0e,a[1]) ^ gmul(0x0b,a[2]) ^ gmul(0x0d,a[3]),
  gmul(0x0d,a[0]) ^ gmul(0x09,a[1]) ^ gmul(0x0e,a[2]) ^ gmul(0x0b,a[3]),
  gmul(0x0b,a[0]) ^ gmul(0x0d,a[1]) ^ gmul(0x09,a[2]) ^ gmul(0x0e,a[3])
].map(x=>x&0xff);

const mixColumns = (s)=>{
  const t = s.slice();
  for (let c=0;c<4;c++){
    const col=[t[c],t[4+c],t[8+c],t[12+c]];
    const m=mixSingleColumn(col);
    t[c]=m[0]; t[4+c]=m[1]; t[8+c]=m[2]; t[12+c]=m[3];
  }
  return t;
};
const invMixColumns = (s)=>{
  const t = s.slice();
  for (let c=0;c<4;c++){
    const col=[t[c],t[4+c],t[8+c],t[12+c]];
    const m=invMixSingleColumn(col);
    t[c]=m[0]; t[4+c]=m[1]; t[8+c]=m[2]; t[12+c]=m[3];
  }
  return t;
};

const addRoundKey = (s, rk)=> s.map((b,i)=> b ^ rk[i]);

// Key expansion (AES-128 -> 11 round keys of 16 bytes)
const rotWord = (w)=>( (w<<8)&0xffffffff ) | (w>>>24);
const subWord = (w)=>{
  return ((S[(w>>>24)&0xff]<<24) | (S[(w>>>16)&0xff]<<16) | (S[(w>>>8)&0xff]<<8) | S[w&0xff])>>>0;
};
const bytesToWords = (b)=>[
  (b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3],
  (b[4]<<24)|(b[5]<<16)|(b[6]<<8)|b[7],
  (b[8]<<24)|(b[9]<<16)|(b[10]<<8)|b[11],
  (b[12]<<24)|(b[13]<<16)|(b[14]<<8)|b[15]
].map(x=>x>>>0);
const wordsToBytes = (w)=>{
  const out=new Uint8Array(16);
  for(let i=0;i<4;i++){
    out[i*4+0]=(w[i]>>>24)&0xff;
    out[i*4+1]=(w[i]>>>16)&0xff;
    out[i*4+2]=(w[i]>>>8)&0xff;
    out[i*4+3]=w[i]&0xff;
  }
  return out;
};

const expandKey = (key16)=>{
  const Nk=4, Nb=4, Nr=10;
  const W = new Array(Nb*(Nr+1));
  let temp;
  const keyWords = bytesToWords(key16);
  for(let i=0;i<Nk;i++) W[i]=keyWords[i];
  for(let i=Nk;i<Nb*(Nr+1);i++){
    temp=W[i-1];
    if(i%Nk===0){
      temp = subWord(rotWord(temp)) ^ RCON[i/Nk];
    }
    W[i]=(W[i-Nk]^temp)>>>0;
  }
  // Convert to round keys (11 * 16 bytes)
  const rks=[];
  for(let r=0;r<=Nr;r++){
    rks.push(wordsToBytes(W.slice(r*4,r*4+4)));
  }
  return rks;
};

// Encrypt/Decrypt one 16-byte block with trace
const encryptBlock = (input16, rks)=>{
  let state = input16.slice();
  const rounds = [];

  // Round 0
  state = addRoundKey(state, rks[0]);
  rounds.push({ addRoundKey: state.slice() });

  // Rounds 1..9
  for (let r=1;r<=9;r++){
    state = subBytes(state);   const sb=state.slice();
    state = shiftRows(state);  const sr=state.slice();
    state = mixColumns(state); const mc=state.slice();
    state = addRoundKey(state, rks[r]); const ark=state.slice();
    rounds.push({ subBytes: sb, shiftRows: sr, mixColumns: mc, addRoundKey: ark });
  }

  // Round 10
  state = subBytes(state);   const sb10=state.slice();
  state = shiftRows(state);  const sr10=state.slice();
  state = addRoundKey(state, rks[10]); const ark10=state.slice();
  rounds.push({ subBytes: sb10, shiftRows: sr10, addRoundKey: ark10 });

  return { result: state, rounds };
};

const decryptBlock = (input16, rks)=>{
  // rks[10]..rks[0]
  let state = input16.slice();
  const rounds = [];

  // Round 0 (inverse final)
  state = addRoundKey(state, rks[10]); const ark0=state.slice();
  state = invShiftRows(state); const isr0=state.slice();
  state = invSubBytes(state); const isb0=state.slice();
  rounds.push({ addRoundKey: ark0, shiftRows: isr0, subBytes: isb0 }); // naming aligned for UI

  // Rounds 9..1
  for (let r=9;r>=1;r--){
    state = addRoundKey(state, rks[r]); const ark=state.slice();
    state = invMixColumns(state); const imc=state.slice();
    state = invShiftRows(state);  const isr=state.slice();
    state = invSubBytes(state);   const isb=state.slice();
    rounds.push({ addRoundKey: ark, mixColumns: imc, shiftRows: isr, subBytes: isb });
  }

  // Final: round key 0
  state = addRoundKey(state, rks[0]); const arkf=state.slice();
  rounds.push({ addRoundKey: arkf });

  return { result: state, rounds };
};

/* ================================== UI bits ================================== */

const Matrix = ({ title, bytes16 }) => {
  const m = bytes16 ? toMatrixRows(bytes16) : [[],[],[],[]];
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
  const [activeTab, setActiveTab] = useState("interactive"); // default to tool like screenshot
  const [mode, setMode] = useState("encrypt");
  const [plaintext, setPlaintext] = useState("Hello, AES Demo!!"); // 16 chars
  const [key, setKey] = useState("Sixteen byte key");              // 16 chars
  const [ciphertext, setCiphertext] = useState("");                // HEX when encrypting / input when decrypting
  const [isAnimating, setIsAnimating] = useState(false);
  const [trace, setTrace] = useState([]);
  const [initialState, setInitialState] = useState(null);
  const [finalState, setFinalState] = useState(null);
  const [error, setError] = useState("");

  const reset = () => {
    setIsAnimating(false);
    setTrace([]);
    setInitialState(null);
    setFinalState(null);
    setError("");
  };

  const parseCipherInput = (val) => {
    const clean = val.trim();
    const isHex = clean.length > 0 && clean.length % 2 === 0 && /^[0-9a-fA-F\s]+$/.test(clean);
    return isHex ? hexToBytes(clean) : toBytes16(clean);
  };

  const runCore = (explain) => {
    reset();

    // Validate key & inputs a bit
    if (key.length === 0) { setError("Key required (16 ASCII chars; padded/truncated with spaces)"); return; }

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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AES Cipher (AES‑128, ECB)</h1>
          <p className="text-gray-600">Encrypt, decrypt, and visualize AES rounds step by step</p>
        </header>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "theory" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Theory
            </button>
            <button
              onClick={() => setActiveTab("interactive")}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "interactive" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Interactive Tool
            </button>
          </div>
        </div>

        {/* Theory */}
        {activeTab === "theory" && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">What is AES?</h2>
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                AES is a symmetric‑key block cipher. AES‑128 processes 16‑byte blocks using 10 rounds over a 4×4 state.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Encryption rounds</h3>
              <ol className="list-decimal list-inside mb-4 space-y-1">
                <li>Round 0: AddRoundKey</li>
                <li>Rounds 1–9: SubBytes → ShiftRows → MixColumns → AddRoundKey</li>
                <li>Round 10: SubBytes → ShiftRows → AddRoundKey</li>
              </ol>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Decryption</h3>
              <p className="mb-2">
                Uses inverse steps in reverse order with the same expanded keys in reverse: K₁₀ … K₀.
              </p>
              <p className="text-sm text-gray-600">Mode shown here: ECB (single 16‑byte block) for learning purposes.</p>
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
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="encrypt">Encrypt</option>
                    <option value="decrypt">Decrypt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key (16 ASCII chars)</label>
                  <input
                    type="text"
                    value={key}
                    maxLength={16}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sixteen byte key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "encrypt" ? "Plaintext (16 ASCII chars)" : "Ciphertext (32 HEX or 16 ASCII)"}
                  </label>
                  <input
                    type="text"
                    value={mode === "encrypt" ? plaintext : ciphertext}
                    onChange={(e) => (mode === "encrypt" ? setPlaintext(e.target.value) : setCiphertext(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={mode === "encrypt" ? "Exactly 16 characters (will pad/truncate)" : "e.g. 66E94BD4..."}
                  />
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
    </div>
  );
};

export default AESCipher;
