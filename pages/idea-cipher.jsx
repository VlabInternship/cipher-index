//idea-cipher.jsx

import React, { useState } from 'react';
import { Play, RotateCcw, BookOpen, Code, Lock, Unlock } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState("theory");
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
    <div className="bg-chacha-bg min-h-screen py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">IDEA Cipher</h1>
          <p className="text-lg text-gray-600 mb-8">International Data Encryption Algorithm</p>
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
                    Interactive IDEA Simulation
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext (Hex)'}
                        </label>
                        <input 
                          type="text" 
                          value={input} 
                          onChange={(e) => setInput(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={handleRun} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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
                        <h3 className="font-semibold text-gray-700 mb-2">
                          {mode === 'encrypt' ? 'Ciphertext (Hex):' : 'Decrypted Text:'}
                        </h3>
                        <div className="bg-white p-3 rounded border font-mono text-blue-700 break-all overflow-x-auto">
                          {output}
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
                    The International Data Encryption Algorithm (IDEA), originally known as Improved Proposed Encryption Standard (IPES), is a symmetric-key block cipher developed as a potential replacement for DES. It operates on 64-bit blocks using a 128-bit key and is notable for its unique design philosophy that blends operations from different algebraic groups.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    IDEA was designed by James Massey and Xuejia Lai in 1991. It was developed under a research contract with the Hasler Foundation, which aimed to create a more secure alternative to DES. The cipher was patented, but the designers made it freely available for non-commercial use. This decision was aimed at encouraging adoption but ultimately limited its widespread use in commercial products.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The core idea behind IDEA is to achieve security by interleaving operations from three "algebraically incompatible" groups. These operations are bitwise XOR, addition modulo 2<sup>16</sup>, and multiplication modulo 2<sup>16</sup>+1. The use of these three distinct and non-linear operations makes the relationship between plaintext and ciphertext highly complex, providing a high level of confusion and diffusion.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Technical Blueprint</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    IDEA operates on a 64-bit plaintext block, which is first divided into four 16-bit sub-blocks. It consists of eight identical rounds, followed by a final output transformation (or "half-round"). Each round uses six 16-bit sub-keys derived from the main 128-bit key. The key schedule generates a total of 52 subkeys through a series of left circular shifts of the main key.
                  </p>
                  <p>
                    A single round involves a series of 14 steps that apply the three core algebraic operations to the four sub-blocks and the six sub-keys. Decryption works similarly to encryption, but the round keys are used in reverse order, and some of the subkeys are replaced by their additive or multiplicative inverses.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    IDEA was considered very strong against differential cryptanalysis, which was a major attack vector against DES. For a time, it was praised as one of the best available encryption methods. However, as with other ciphers, attacks against reduced-round versions have been developed. Its key schedule has also been found to have a class of weak keys, though they are rare enough to not be a practical concern for randomly chosen keys. The cipher's complicated development and patent issues also limited its popularity.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    IDEA was famously used in early versions of OpenPGP, a widely used email encryption software. Its adoption was limited by its patented status and the emergence of the unpatented and publicly vetted AES as the new global standard. The story of IDEA demonstrates that a technically sound and innovative algorithm may not achieve widespread adoption due to factors beyond its security, such as legal and development complexities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "example" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Solved Example: International Data Encryption Algorithm (IDEA)</h2>
                <div className="space-y-4 text-gray-800">
                  <p className="mb-4">
                    A full numerical walkthrough of IDEA is highly complex. This example will illustrate the flow of a single round based on a simplified model.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Example: A single round of IDEA encryption (conceptual walkthrough)</h3>
                      <div className="ml-4 space-y-2">
                        <p><strong>Plaintext Block:</strong> A 64-bit block, represented as four 16-bit sub-blocks: P₁, P₂, P₃, P₄.</p>
                        <p><strong>Subkeys:</strong> Six 16-bit subkeys for the round: K₁, K₂, K₃, K₄, K₅, K₆.</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Input Multiplication and Addition</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          The first four subkeys are combined with the plaintext sub-blocks using multiplication modulo 2<sup>16</sup>+1 and addition modulo 2<sup>16</sup>:
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm space-y-1">
                            <p>A = P₁ ⊗ K₁ (multiplication)</p>
                            <p>B = P₂ ⊕ K₂ (addition)</p>
                            <p>C = P₃ ⊕ K₃ (addition)</p>
                            <p>D = P₄ ⊗ K₄ (multiplication)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: The MA and ADD Operations</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          The intermediate results are then mixed using XOR and the two other algebraic operations:
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm space-y-1">
                            <p>E = A ⊕ C (XOR)</p>
                            <p>F = B ⊕ D (XOR)</p>
                            <p>G = E ⊗ K₅ (multiplication)</p>
                            <p>H = F ⊕ G (addition)</p>
                            <p>I = H ⊗ K₆ (multiplication)</p>
                            <p>J = G ⊕ I (XOR)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 3: Final XORs and Swapping</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          The final results for the round are computed by XORing the original and intermediate values. For sufficient diffusion, two of the sub-blocks are swapped at the end of each round:
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm space-y-1">
                            <p>P₁' = A ⊕ I</p>
                            <p>P₂' = B ⊕ J</p>
                            <p>P₃' = C ⊕ I</p>
                            <p>P₄' = D ⊕ J</p>
                          </div>
                        </div>
                        <p>
                          The output of the round is the set of four new sub-blocks, which become the input for the next round. This process is repeated eight times, followed by a final output transformation to produce the ciphertext.
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
    </div>
  );
}
