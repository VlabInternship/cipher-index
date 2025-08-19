import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw } from 'lucide-react';

// Helpers for Feistel Cipher
const stringToBinary = (str) => str.split('').map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join('');
const xorBinary = (a, b) => a.split('').map((bit, i) => (bit ^ b[i]).toString()).join('');
const rotlBitsStr = (bits, n) => bits.slice(n % bits.length) + bits.slice(0, n % bits.length);
const permuteInterleave = (bits) => {
  let even = '', odd = '';
  for (let i = 0; i < bits.length; i++) {
    if (i % 2 === 0) {
      even += bits[i];
    } else {
      odd += bits[i];
    }
  }
  return odd + even;
};
const binToNibbles = (bits) => bits.padEnd(Math.ceil(bits.length / 4) * 4, '0').match(/.{4}/g).map(b => parseInt(b, 2));
const nibblesToBin = (arr) => arr.map(n => n.toString(2).padStart(4, '0')).join('');

const S0 = [12,5,6,11,9,0,10,13,3,14,15,8,4,7,1,2];
const S1 = [6,8,2,3,9,10,5,12,1,14,4,7,0,15,13,11];
const generateRoundKey = (baseKey, round) => {
  const r = round % baseKey.length;
  const rotated = baseKey.slice(r) + baseKey.slice(0, r);
  const salt = String.fromCharCode(65 + (round % 26)) + String(round % 10);
  return rotated + round + salt;
};
const fFunction = (rightBits, roundKey) => {
  const keyBits = stringToBinary(roundKey);
  const R = rightBits.padEnd(Math.ceil(rightBits.length / 4) * 4, '0');
  const K = (keyBits + keyBits).slice(0, R.length);
  const Rn = binToNibbles(R);
  const Kn = binToNibbles(K);
  const afterS = Rn.map((n, i) => (i % 2 === 0 ? S0[n ^ Kn[i]] : S1[n ^ Kn[i]]));
  let out = nibblesToBin(afterS);
  out = permuteInterleave(out);
  out = rotlBitsStr(out, (roundKey.length % 7) + 1);
  return out.slice(0, rightBits.length);
};

const FeistelRound = ({ step, roundIndex, openDefault = false }) => {
  const [open, setOpen] = useState(openDefault);
  return (
    <div className="border rounded-lg">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
        <div className="font-semibold text-gray-800">Round {roundIndex}</div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="p-4 space-y-1 font-mono text-sm bg-white">
          <div><strong>L:</strong> {step.L}</div>
          <div><strong>R:</strong> {step.R}</div>
          {step.f && <div><strong>F:</strong> {step.f}</div>}
          {step.rk && <div><strong>K:</strong> {step.rk}</div>}
        </div>
      )}
    </div>
  );
};

export default function FeistelCipher() {
  const [activeTab, setActiveTab] = useState("interactive");
  const [mode, setMode] = useState("encrypt");
  const [plaintext, setPlaintext] = useState("HELLO123");
  const [key, setKey] = useState("SECRET");
  const [rounds, setRounds] = useState(4);
  const [output, setOutput] = useState("");
  const [trace, setTrace] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const reset = () => {
    setOutput("");
    setTrace([]);
    setIsAnimating(false);
  };

  const run = (explain = false) => {
    reset();
    const bin = stringToBinary(plaintext);
    const padded = bin.length % 2 ? bin + '0' : bin;
    let L = padded.slice(0, padded.length / 2);
    let R = padded.slice(padded.length / 2);
    const log = [{ round: 0, L, R }];

    const order = mode === 'encrypt' ? [...Array(rounds)].map((_, i) => i + 1) : [...Array(rounds)].map((_, i) => rounds - i);

    for (let r of order) {
      const rk = generateRoundKey(key, r);
      const f = fFunction(mode === 'encrypt' ? R : L, rk);
      const newL = mode === 'encrypt' ? R : xorBinary(R, f);
      const newR = mode === 'encrypt' ? xorBinary(L, f) : L;
      L = newL;
      R = newR;
      log.push({ round: r, rk, f, L, R });
    }

    setOutput((L + R).match(/.{4}/g).map(b => parseInt(b, 2).toString(16).padStart(2, '0')).join(' '));
    if (explain) setTrace(log);
  };

  const runExplain = () => {
    setIsAnimating(true);
    run(true);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Feistel Cipher</h1>
          <p className="text-gray-600">Visualize encryption & decryption using round-based Feistel network</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button onClick={() => setActiveTab("theory")} className={`px-6 py-2 rounded-md ${activeTab === "theory" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Theory</button>
            <button onClick={() => setActiveTab("interactive")} className={`px-6 py-2 rounded-md ${activeTab === "interactive" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Interactive Tool</button>
          </div>
        </div>

        {activeTab === "theory" && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">How Feistel Cipher Works</h2>
            <div className="prose max-w-none text-gray-700">
              <p>Feistel ciphers operate on plaintext split into two halves: L and R. Each round applies a function F and a round key to mix these halves.</p>
              <ol className="list-decimal list-inside">
                <li>Lₙ₊₁ = Rₙ</li>
                <li>Rₙ₊₁ = Lₙ ⊕ F(Rₙ, Kₙ)</li>
                <li>Repeat for defined rounds</li>
              </ol>
              <p>The decryption process is identical but uses keys in reverse order.</p>
            </div>
          </div>
        )}

        {activeTab === "interactive" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive Feistel Tool</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-3 border rounded-lg">
                    <option value="encrypt">Encrypt</option>
                    <option value="decrypt">Decrypt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key</label>
                  <input type="text" value={key} onChange={(e) => setKey(e.target.value)} className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                  <input type="text" value={plaintext} onChange={(e) => setPlaintext(e.target.value)} className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rounds</label>
                  <input type="number" value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className="w-full p-3 border rounded-lg" min={1} max={16} />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button onClick={runExplain} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg"><Play size={18} /> Explain</button>
                <button onClick={() => run(false)} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg">{mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />} {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}</button>
                <button onClick={reset} className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg"><RotateCcw size={18} /> Reset</button>
              </div>

              {output && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-1">Output (Hex):</h3>
                  <div className="bg-gray-100 p-3 rounded font-mono text-blue-700 break-all overflow-x-auto">{output}</div>
                </div>
              )}
            </div>

            {trace.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Round Visualization</h3>
                <div className="space-y-3">
                  {trace.map((step, idx) => (<FeistelRound key={idx} roundIndex={step.round} step={step} openDefault={idx === 0 || idx === trace.length - 1} />))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
