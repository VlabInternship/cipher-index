// HMAC simulator in ChaCha20-style UI
// Save this as: pages/hmac-cipher.jsx

import React, { useState } from 'react';
import { Play, RotateCcw, BookOpen, Code } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('theory');
  const [message, setMessage] = useState('Hello World');
  const [key, setKey] = useState('secret');
  const [algo, setAlgo] = useState('SHA256');
  const [output, setOutput] = useState(null);

  const run = () => {
    const result = computeHMACSteps(message, key, algo);
    setOutput(result);
  };

  const reset = () => {
    setOutput(null);
  };

  return (
    <div className="bg-chacha-bg min-h-screen py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">HMAC Cipher</h1>
          <p className="text-lg text-gray-600 mb-8">Hash-based Message Authentication Code</p>
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
                    Interactive HMAC Simulation
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <input 
                          type="text" 
                          value={message} 
                          onChange={(e) => setMessage(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Secret Key</label>
                        <input 
                          type="text" 
                          value={key} 
                          onChange={(e) => setKey(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Hash Algorithm</label>
                        <select 
                          value={algo} 
                          onChange={(e) => setAlgo(e.target.value)} 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="SHA256">SHA-256</option>
                          <option value="SHA512">SHA-512</option>
                          <option value="MD5">MD5</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={run} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        <Play size={18} /> Compute HMAC
                      </button>
                      <button 
                        onClick={reset} 
                        className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
                      >
                        <RotateCcw size={18} /> Reset
                      </button>
                    </div>

                    {output && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">HMAC Computation Steps:</h3>
                        <div className="space-y-3 text-sm">
                          {Object.entries(output).map(([label, value]) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-4">
                              <div className="font-semibold text-gray-700 mb-2">
                                {label.replace(/([a-z])([A-Z])/g, '$1 $2')}:
                              </div>
                              <div className="bg-white p-3 rounded border font-mono text-xs break-words overflow-x-auto">
                                <code>{value}</code>
                              </div>
                            </div>
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
                    A Hash-based Message Authentication Code (HMAC) is a cryptographic technique used to verify both the data integrity and authenticity of a message.60 Unlike encryption, HMAC does not hide the contents of a message; instead, it provides a unique signature that can be used to prove that the message has not been altered and that it originated from a sender who possesses the shared secret key.60
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The HMAC construction was formally defined and analyzed in a 1996 paper by Mihir Bellare, Ran Canetti, and Hugo Krawczyk.61 The design was motivated by the existence of attacks on simpler methods of combining a key with a hash function, which led to a standardized, robust approach.61 The definition was standardized in RFC 2104 in 1997 and is now a component of many modern security protocols.61
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The core idea is to use a shared secret key and a cryptographic hash function in a specific two-pass process to create a message authentication code (MAC).60 The two-pass structure provides greater security than a simple keyed hash, as it offers better immunity against attacks like length extension.61 It allows two parties to authenticate messages without the complexity of a public-key infrastructure.61
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Technical Blueprint</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The HMAC process involves using the secret key to derive two new keys: an inner key and an outer key.61 The base secret key, K, is first normalized by padding it with zeros or hashing it if it is too long.62 This normalized key is then XORed with two fixed padding values, ipad (0x36) and opad (0x5c), to create the inner and outer keys, respectively.61
                  </p>
                  <p>
                    The HMAC computation then proceeds in two passes:
                  </p>
                  <ul className="ml-4 space-y-2">
                    <li><strong>Inner Hash:</strong> A hash is computed on the concatenation of the inner key and the message. This produces an intermediate hash value.62</li>
                    <li><strong>Outer Hash:</strong> The final HMAC code is then computed by hashing the concatenation of the outer key and the intermediate hash value.61</li>
                  </ul>
                  <p>
                    The final output size of the HMAC is the same as the output size of the underlying hash function (e.g., 256 bits for SHA-256).61 To verify a message, the recipient uses the same secret key to re-compute the HMAC and then compares the result with the received HMAC code.62
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The cryptographic strength of HMAC is tied to the security of the underlying hash function and the size and quality of the secret key.61 The two-pass design makes it substantially more resistant to collisions than unkeyed hash functions and provides immunity against length extension attacks, a critical vulnerability in simpler keyed hash schemes.61 Brute-force attacks on the key are the most common vulnerability.61
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    HMAC is an essential tool in modern digital security.60 It is widely used to authenticate client-server requests in REST APIs, sign JSON Web Tokens (JWTs), and ensure message integrity in protocols like TLS/SSL and IPsec.61 Its elegance and proven security have made it the de facto standard for message authentication.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "example" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Solved Example: HMAC</h2>
                <div className="space-y-4 text-gray-800">
                  <p className="mb-4">
                    The provided sources do not include a full numerical walkthrough of the HMAC process. This conceptual example illustrates the two-pass hashing process.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-semibold text-gray-800 mb-3">Example: A conceptual walkthrough of HMAC-SHA256.</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Secret Key:</strong> K</p>
                      <p><strong>Message:</strong> M</p>
                      <p><strong>Hash Function:</strong> SHA256 (block size of 64 bytes)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Key Normalization</h3>
                      <div className="ml-4 space-y-2">
                        <p>
                          First, the secret key, K, is processed. If its length is greater than 64 bytes, it is first hashed with SHA256 to produce a 32-byte key. If it is shorter, it is padded with zeros to a length of 64 bytes.62 This normalized key is denoted as K<sub>normalized</sub>.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: Inner and Outer Key Derivation</h3>
                      <div className="ml-4 space-y-2">
                        <p>The normalized key is XORed with the two fixed padding values to create the inner and outer keys.</p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="space-y-1 text-sm">
                            <p><strong>Inner Key:</strong> K<sub>inner</sub> = K<sub>normalized</sub> ⊕ ipad (where ipad is 64 bytes of 0x36).61</p>
                            <p><strong>Outer Key:</strong> K<sub>outer</sub> = K<sub>normalized</sub> ⊕ opad (where opad is 64 bytes of 0x5c).61</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 3: The Two-Pass Hashing Process</h3>
                      <div className="ml-4 space-y-3">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-semibold text-gray-800 mb-2">Inner Hash Computation:</h4>
                          <p className="text-sm">
                            The first hash is computed by concatenating the inner key with the message and then applying the SHA256 hash function:
                          </p>
                          <div className="font-mono text-sm mt-2 p-2 bg-white rounded border">
                            H<sub>inner</sub> = SHA256(K<sub>inner</sub> || M)
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-semibold text-gray-800 mb-2">Outer Hash Computation:</h4>
                          <p className="text-sm">
                            The second hash is computed by concatenating the outer key with the result of the inner hash and applying SHA256 again:
                          </p>
                          <div className="font-mono text-sm mt-2 p-2 bg-white rounded border">
                            HMAC = SHA256(K<sub>outer</sub> || H<sub>inner</sub>)
                          </div>
                        </div>
                      </div>
                      <p className="mt-4">
                        The resulting HMAC is the final message authentication code. This two-pass process is a sophisticated design choice that overcomes the vulnerabilities of simpler keyed hash functions and has made HMAC an essential tool for ensuring message authenticity and integrity in the digital world.
                      </p>
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
          HMAC Simulation Tool © 2025
        </p>
      </footer>
    </div>
  );
}
