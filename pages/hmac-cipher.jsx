// HMAC simulator in AES-style UI (Tailwind only)
// Save this as: pages/hmac-cipher.jsx

import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import CryptoJS from 'crypto-js';

const getHashFunction = (algo) => {
  switch (algo) {
    case 'MD5': return CryptoJS.MD5;
    case 'SHA256': return CryptoJS.SHA256;
    case 'SHA512': return CryptoJS.SHA512;
    default: return CryptoJS.SHA256;
  }
};

const getBlockSize = (algo) => {
  switch (algo) {
    case 'SHA512': return 128;
    default: return 64;
  }
};

const xorWithByte = (wordArray, byteVal) => {
  const bytes = CryptoJS.enc.Hex.parse(wordArray.toString(CryptoJS.enc.Hex));
  const xorBytes = [];
  for (let i = 0; i < bytes.sigBytes; i++) {
    const wordIndex = (i / 4) | 0;
    const byteShift = 24 - ((i % 4) * 8);
    const byte = (bytes.words[wordIndex] >>> byteShift) & 0xff;
    xorBytes.push(byte ^ byteVal);
  }
  return CryptoJS.lib.WordArray.create(xorBytes);
};

const computeHMACSteps = (msg, key, algo) => {
  const hashFunc = getHashFunction(algo);
  const blockSize = getBlockSize(algo);
  const ipad = 0x36, opad = 0x5c;

  let keyBuf = CryptoJS.enc.Utf8.parse(key);
  if (keyBuf.sigBytes > blockSize) {
    keyBuf = hashFunc(key);
  }

  if (keyBuf.sigBytes < blockSize) {
    const padding = CryptoJS.lib.WordArray.create(new Array(blockSize - keyBuf.sigBytes).fill(0));
    keyBuf = keyBuf.concat(padding);
  }

  const paddedKey = keyBuf.toString(CryptoJS.enc.Hex);
  const s1 = xorWithByte(keyBuf, ipad);
  const innerHash = hashFunc(s1.concat(CryptoJS.enc.Utf8.parse(msg)));
  const s2 = xorWithByte(keyBuf, opad);
  const finalHmac = hashFunc(s2.concat(innerHash)).toString(CryptoJS.enc.Hex);

  return {
    paddedKey,
    ipadXOR: s1.toString(CryptoJS.enc.Hex),
    innerHash: innerHash.toString(CryptoJS.enc.Hex),
    opadXOR: s2.toString(CryptoJS.enc.Hex),
    finalHash: finalHmac,
  };
};

export default function HmacCipher() {
  const [activeTab, setActiveTab] = useState('interactive');
  const [message, setMessage] = useState('Hello World');
  const [key, setKey] = useState('secret');
  const [algo, setAlgo] = useState('SHA512');
  const [output, setOutput] = useState(null);

  const run = () => {
    const result = computeHMACSteps(message, key, algo);
    setOutput(result);
  };

  const reset = () => {
    setOutput(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">HMAC Simulation</h1>
          <p className="text-gray-600">Visualize step-by-step HMAC computation using various hash algorithms</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button onClick={() => setActiveTab('theory')} className={`px-6 py-2 rounded-md ${activeTab === 'theory' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Theory</button>
            <button onClick={() => setActiveTab('interactive')} className={`px-6 py-2 rounded-md ${activeTab === 'interactive' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Interactive Tool</button>
          </div>
        </div>

        {activeTab === 'theory' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">What is HMAC?</h2>
            <p className="text-gray-700 mb-4">
              HMAC (Hash-based Message Authentication Code) combines a secret key with a hash function to verify both data integrity and authenticity.
            </p>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">HMAC(K, m) = H((K ⊕ opad) ∥ H((K ⊕ ipad) ∥ m))</pre>
          </div>
        )}

        {activeTab === 'interactive' && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Key</label>
                <input type="text" value={key} onChange={(e) => setKey(e.target.value)} className="w-full p-3 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Hash Algorithm</label>
                <select value={algo} onChange={(e) => setAlgo(e.target.value)} className="w-full p-3 border rounded">
                  <option value="SHA256">SHA-256</option>
                  <option value="SHA512">SHA-512</option>
                  <option value="MD5">MD5</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={run} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg">
                <Play size={18} /> Compute
              </button>
              <button onClick={reset} className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg">
                <RotateCcw size={18} /> Reset
              </button>
            </div>

            {output && (
              <div className="space-y-3 text-sm">
                {Object.entries(output).map(([label, value]) => (
                  <div key={label}>
                    <div className="font-semibold text-gray-700 mb-1">{label.replace(/([a-z])([A-Z])/g, '$1 $2')}:</div>
                    <div className="bg-slate-100 p-3 rounded font-mono break-words overflow-x-auto">
                      <code>{value}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
