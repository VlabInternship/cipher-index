import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw, BookOpen, Code } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState("theory");
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
    <div className="bg-chacha-bg min-h-screen py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Feistel Cipher</h1>
          <p className="text-lg text-gray-600 mb-8">The Foundation of Block Cipher Design</p>
        </header>
        <nav className="flex justify-center mb-8">
          <div className="bg-chacha-accent/10 rounded-lg p-1 flex space-x-1 shadow-md">
            {["theory", "example", "cipher"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-4 py-2 md:px-6 md:py-3 rounded-md font-medium transition-all text-sm md:text-base flex items-center gap-2 ${activeTab === tab ? "bg-chacha-accent text-chacha-alt shadow-lg" : "text-chacha-accent hover:text-chacha-alt hover:bg-chacha-accent/20"}`}
              >
                {tab === "theory" && <BookOpen className="w-4 h-4 md:w-5 md:h-5" />}
                {tab === "example" && <Play className="w-4 h-4 md:w-5 md:h-5" />}
                {tab === "cipher" && <Code className="w-4 h-4 md:w-5 md:h-5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </nav>
        <main>
          {activeTab === "cipher" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                    <Play className="text-blue-600" size={20} />
                    Interactive Feistel Simulation
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                        <select 
                          value={mode} 
                          onChange={(e) => setMode(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="encrypt">Encrypt</option>
                          <option value="decrypt">Decrypt</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                        <input 
                          type="text" 
                          value={key} 
                          onChange={(e) => setKey(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Input Text</label>
                        <input 
                          type="text" 
                          value={plaintext} 
                          onChange={(e) => setPlaintext(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rounds</label>
                        <input 
                          type="number" 
                          value={rounds} 
                          onChange={(e) => setRounds(Number(e.target.value))} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          min={1} 
                          max={16} 
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={runExplain} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        <Play size={18} /> Explain Steps
                      </button>
                      <button 
                        onClick={() => run(false)} 
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />} 
                        {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
                      </button>
                      <button 
                        onClick={reset} 
                        className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
                      >
                        <RotateCcw size={18} /> Reset
                      </button>
                    </div>

                    {output && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-2">Output (Hex):</h3>
                        <div className="bg-white p-3 rounded border font-mono text-blue-700 break-all overflow-x-auto">
                          {output}
                        </div>
                      </div>
                    )}

                    {trace.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Round-by-Round Visualization</h3>
                        <div className="space-y-3">
                          {trace.map((step, idx) => (
                            <FeistelRound 
                              key={idx} 
                              roundIndex={step.round} 
                              step={step} 
                              openDefault={idx === 0 || idx === trace.length - 1} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "theory" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Introduction</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The Feistel cipher is not a single cryptographic algorithm but a symmetric structure used in the construction of block ciphers.14 Named after Horst Feistel, who pioneered its use at IBM, it is also commonly referred to as a Feistel network.15 This structure is a design pattern that has been used as a foundational component in many prominent ciphers, including the Data Encryption Standard (DES).16
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The central idea of a Feistel network is to make an entire block cipher invertible, even when its core "round function" is not.15 This is achieved by dividing the plaintext block into two equal halves. The round function operates on one half, and its output is combined with the other half using a reversible operation, typically XOR.15 The halves are then swapped for the next round.17 This iterative process, consisting of a series of identical rounds, guarantees that the ciphertext can be perfectly decrypted by simply reversing the key schedule.15
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Technical Blueprint</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The Feistel network process is an elegant and simple blueprint for an iterated cipher.16 A plaintext block is split into a left half, L₀, and a right half, R₀.15 For each round i from 1 to n, the following operations are performed:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="font-mono text-sm space-y-1">
                      <p>L<sub>i</sub> = R<sub>i-1</sub></p>
                      <p>R<sub>i</sub> = L<sub>i-1</sub> ⊕ f(R<sub>i-1</sub>, K<sub>i</sub>)</p>
                    </div>
                  </div>
                  <p>
                    Where f is the non-invertible round function and K<sub>i</sub> is the subkey for that round.15 This process is repeated for a fixed number of rounds, and the final output is the concatenation of the last two halves.17
                  </p>
                  <p>
                    Decryption is remarkably similar to encryption, with the key schedule used in reverse order.15 By applying the same process with the subkeys in reverse, the original plaintext halves are recovered. The decryption formula is:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="font-mono text-sm space-y-1">
                      <p>R<sub>i-1</sub> = L<sub>i</sub></p>
                      <p>L<sub>i-1</sub> = R<sub>i</sub> ⊕ f(L<sub>i</sub>, K<sub>i</sub>)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The Feistel structure offers a key advantage over other designs like Substitution-Permutation Networks: the round function does not need to be designed with invertibility in mind.15 This freedom allows the round function to be made arbitrarily complex, enhancing security. Furthermore, the similarity between the encryption and decryption processes significantly reduces the size of the code or circuitry required to implement the cipher.15 This design also avoids reliance on substitution boxes that could create timing-based side-channel vulnerabilities in software.15
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The Feistel network is a foundational design principle, not a specific algorithm itself.17 Its influence is pervasive in the history of symmetric cryptography. The Data Encryption Standard (DES), a landmark cipher from the 1970s, is a classic example of a Feistel cipher.16 The structure is also used as a component in more complex ciphers like Skipjack and MISTY1 and in schemes like the Optimal Asymmetric Encryption Padding (OAEP).15
                  </p>
                  <p>
                    The evolution from simple, manual ciphers to Feistel networks represents a fundamental paradigm shift in cryptographic design. The historical ciphers explored earlier relied on simple, isolated rules. The Feistel structure, by contrast, introduced an iterative, multi-round, and hardware-friendly blueprint.15 The shift from a single, manual rule to a provably invertible, iterative process was a critical step in enabling the widespread use of cryptography in automated systems.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "example" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Solved Example: Feistel Cipher</h2>
                <div className="space-y-4 text-gray-800">
                  <p className="mb-4">
                    A complete numerical walkthrough of a Feistel cipher is too complex for a simplified example, but the conceptual flow is as follows:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Divide the Plaintext Block</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          A 64-bit plaintext block is split into a 32-bit left half (L) and a 32-bit right half (R).
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: Perform the Round Operations</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          The right half (R) is fed into the round function (f) along with the round key (K). The output of the function is then XORed with the left half (L) to produce a new right half.
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm">
                            <p><strong>newR = L XOR f(R, K)</strong></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 3: Swap the Halves</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          The old right half (R) becomes the new left half, and the result from the previous step (newR) becomes the new right half.
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm">
                            <p><strong>newL = R</strong></p>
                          </div>
                        </div>
                        <p>
                          This process is repeated for a number of rounds. Decryption simply reverses the process by using the round keys in reverse order.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-gray-600 text-sm">
          Feistel Cipher Simulation Tool © 2025
        </p>
      </footer>
    </div>
  );
}
