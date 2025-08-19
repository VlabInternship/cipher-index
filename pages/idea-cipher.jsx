//idea-cipher.jsx

import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

// Very simplified IDEA (demo only)
const mod65537 = (x) => (x === 0 ? 0 : x % 65537);
const modInverse = (x) => {
  for (let i = 1; i < 65536; i++) {
    if ((x * i) % 65537 === 1) return i;
  }
  return 0;
};

const simpleIdeaEncrypt = (plain, key) => {
  const p = plain.split('').map(c => c.charCodeAt(0));
  const k = key.split('').map(c => c.charCodeAt(0));
  const result = p.map((val, i) => (val ^ (k[i % k.length])));
  return result.map(n => n.toString(16).padStart(2, '0')).join('');
};

const simpleIdeaDecrypt = (cipherHex, key) => {
  const bytes = cipherHex.match(/.{2}/g).map(h => parseInt(h, 16));
  const k = key.split('').map(c => c.charCodeAt(0));
  const result = bytes.map((val, i) => (val ^ (k[i % k.length])));
  return result.map(n => String.fromCharCode(n)).join('');
};

export default function IdeaCipher() {
  const [tab, setTab] = useState('interactive');
  const [input, setInput] = useState('HELLOIDEA');
  const [key, setKey] = useState('MYKEY123');
  const [mode, setMode] = useState('encrypt');
  const [output, setOutput] = useState('');

  const handleRun = () => {
    if (mode === 'encrypt') {
      setOutput(simpleIdeaEncrypt(input, key));
    } else {
      setOutput(simpleIdeaDecrypt(input, key));
    }
  };

  const reset = () => {
    setInput('');
    setKey('');
    setOutput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">IDEA Cipher Simulator</h1>

        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow p-1">
            <button onClick={() => setTab('theory')} className={`px-6 py-2 rounded-l-md ${tab === 'theory' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Theory</button>
            <button onClick={() => setTab('interactive')} className={`px-6 py-2 rounded-r-md ${tab === 'interactive' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Interactive Tool</button>
          </div>
        </div>

        {tab === 'theory' && (
          <div className="bg-white rounded-lg shadow p-6 text-gray-800 space-y-4">
            <h2 className="text-2xl font-bold">What is IDEA Cipher?</h2>
            <p>
              The International Data Encryption Algorithm (IDEA) is a symmetric block cipher known for its strength and structure. It uses 64-bit blocks with a 128-bit key, performing multiple rounds of substitution and permutation using modular arithmetic.
            </p>
            <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto font-mono">
Rounds = 8 + 1 Output Transformation
Each round:
  - Multiplication mod 65537
  - Addition mod 2^16
  - XOR mixing
            </pre>
          </div>
        )}

        {tab === 'interactive' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{mode === 'encrypt' ? 'Plaintext' : 'Ciphertext (Hex)'}</label>
                <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Key</label>
                <input value={key} onChange={(e) => setKey(e.target.value)} className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-3 border rounded">
                  <option value="encrypt">Encrypt</option>
                  <option value="decrypt">Decrypt</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleRun} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg">
                <Play size={18} /> Run
              </button>
              <button onClick={reset} className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg">
                <RotateCcw size={18} /> Reset
              </button>
            </div>

            {output && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">{mode === 'encrypt' ? 'Ciphertext (Hex):' : 'Decrypted Text:'}</h3>
                <div className="bg-slate-100 p-3 rounded font-mono text-blue-700 break-words overflow-x-auto">{output}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
