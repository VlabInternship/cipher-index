import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, Eye, EyeOff, BookOpen, Code } from 'lucide-react';

const OneTimePadCipher = () => {
  const [activeTab, setActiveTab] = useState("theory");
  const [formData, setFormData] = useState({
    message: 'HELLO',
    key: 'XMCKL'
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBinary, setShowBinary] = useState(false);
  const [animationSpeed] = useState(800);
  const [mode, setMode] = useState('encrypt');
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  // Generate random key
  const generateRandomKey = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * 26)]).join('');
  };

  // Convert char to number (A=0, B=1, etc.)
  const charToNum = (char) => char.charCodeAt(0) - 65;
  
  // Convert number to char
  const numToChar = (num) => String.fromCharCode((num % 26) + 65);

  // Encrypt/Decrypt functions
  const encrypt = (msg, k) => {
    return msg.split('').map((char, i) => {
      if (char.match(/[A-Z]/)) {
        return numToChar(charToNum(char) + charToNum(k[i % k.length]));
      }
      return char;
    }).join('');
  };

  const decrypt = (cipher, k) => {
    return cipher.split('').map((char, i) => {
      if (char.match(/[A-Z]/)) {
        return numToChar(charToNum(char) - charToNum(k[i % k.length]) + 26);
      }
      return char;
    }).join('');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase().replace(/[^A-Z]/g, '')
    }));
  };

  // Process the cipher (encrypt/decrypt)
  const processCipher = () => {
    const { message, key } = formData;
    const adjustedKey = key.length >= message.length ? key : key + generateRandomKey(message.length - key.length);
    
    if (mode === 'encrypt') {
      setResult({
        input: message,
        output: encrypt(message, adjustedKey),
        operation: '+',
        title: 'Encryption Process',
        description: 'Message + Key = Cipher',
        adjustedKey
      });
    } else {
      setResult({
        input: message,
        output: decrypt(message, adjustedKey),
        operation: '-',
        title: 'Decryption Process',
        description: 'Cipher - Key = Message',
        adjustedKey
      });
    }
  };

  // Animation control
  const startAnimation = (e) => {
    e.preventDefault();
    if (isAnimating) return;
    
    processCipher();
    setIsAnimating(true);
    setCurrentStep(0);
    
    const steps = Math.max(formData.message.length, formData.key.length);
    let step = 0;
    
    intervalRef.current = setInterval(() => {
      if (step >= steps) {
        setIsAnimating(false);
        clearInterval(intervalRef.current);
        return;
      }
      setCurrentStep(step + 1);
      step++;
    }, animationSpeed);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    clearInterval(intervalRef.current);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setCurrentStep(0);
    clearInterval(intervalRef.current);
    setResult(null);
  };

  return (
    <div className="bg-chacha-bg min-h-screen py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">One-Time Pad Cipher</h1>
          <p className="text-lg text-gray-600 mb-8">The Only Mathematically Proven Unbreakable Encryption</p>
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
                {/* Interactive Section */}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                    <Play className="text-blue-600" size={20} />
                    Interactive Demonstration
                  </h2>
                  
                  <form onSubmit={startAnimation} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          {mode === 'encrypt' ? 'Message' : 'Ciphertext'} (A-Z only)
                        </label>
                        <input
                          type="text"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Key (A-Z only)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="key"
                            value={formData.key}
                            onChange={handleInputChange}
                            className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                key: generateRandomKey(prev.message.length)
                              }));
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                          >
                            Random
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Operation Mode
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMode('encrypt');
                              resetAnimation();
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium ${
                              mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Encrypt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMode('decrypt');
                              resetAnimation();
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium ${
                              mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Decrypt
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Display Options
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowBinary(!showBinary)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          {showBinary ? <EyeOff size={16} /> : <Eye size={16} />}
                          {showBinary ? 'Hide' : 'Show'} Numbers
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="submit"
                        disabled={isAnimating}
                        className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Play size={16} />
                        Start Animation
                      </button>
                      <button
                        type="button"
                        onClick={stopAnimation}
                        disabled={!isAnimating}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                      >
                        <Pause size={16} />
                        Stop
                      </button>
                      <button
                        type="button"
                        onClick={resetAnimation}
                        className="col-span-3 flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
                      >
                        <RotateCcw size={16} />
                        Reset All
                      </button>
                    </div>
                  </form>

                  {/* Animation Display */}
                  {result && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <h3 className="font-semibold mb-2 text-blue-700">{result.title}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{mode === 'encrypt' ? 'Message:' : 'Cipher:'}</span>
                            <span>Key:</span>
                            <span>{mode === 'encrypt' ? 'Cipher:' : 'Message:'}</span>
                          </div>
                          
                          <div className="font-mono space-y-2">
                            {result.input.split('').map((char, i) => {
                              const keyChar = result.adjustedKey[i];
                              let outputChar;
                              
                              if (mode === 'encrypt') {
                                outputChar = numToChar(charToNum(char) + charToNum(keyChar));
                              } else {
                                outputChar = numToChar(charToNum(char) - charToNum(keyChar) + 26);
                              }
                              
                              return (
                                <div key={i} className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className={`transition-all ${currentStep > i ? 'text-blue-600' : 'text-gray-800'}`}>
                                      {char}
                                      {showBinary && (
                                        <span className="text-xs text-gray-500 ml-1">({charToNum(char)})</span>
                                      )}
                                    </span>
                                    <span className="text-gray-500">{result.operation}</span>
                                    <span className={`transition-all ${currentStep > i ? 'text-blue-700' : 'text-gray-800'}`}>
                                      {keyChar || '?'}
                                      {showBinary && keyChar && (
                                        <span className="text-xs text-gray-500 ml-1">({charToNum(keyChar)})</span>
                                      )}
                                    </span>
                                    <span className="text-gray-500">=</span>
                                    <span className={`transition-all ${currentStep > i ? 'text-blue-800' : 'text-gray-400'}`}>
                                      {currentStep > i ? outputChar : '?'}
                                      {showBinary && currentStep > i && (
                                        <span className="text-xs text-gray-500 ml-1">({charToNum(outputChar)})</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        <h3 className="font-semibold mb-2 text-green-700">
                          {mode === 'encrypt' ? 'Encrypted Text' : 'Decrypted Message'}
                        </h3>
                        <div className="font-mono bg-white rounded p-2 text-center border border-gray-200">
                          {result.output}
                        </div>
                      </div>
                    </div>
                  )}
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
                    The One-Time Pad (OTP) is an encryption technique that is mathematically proven to be unbreakable, provided it is used correctly.11 It is the only known encryption system that offers perfect secrecy, a concept in information theory that guarantees the ciphertext provides no information about the plaintext.12
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The one-time pad concept was first described in 1882 by Frank Miller. It was later re-invented and patented by Gilbert Vernam in 1919 for use with telegraphy. However, its theoretical invulnerability was not mathematically proven until Claude Shannon's seminal work in 1949, where he established the conditions under which a cipher could be considered "perfectly secret".12
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The core idea is to encrypt a plaintext message by combining it with a random, secret key of equal or greater length, using a simple operation like modular addition or bitwise XOR.11 The key must be used only once, hence the name. This ensures that for any given ciphertext, every possible plaintext message is equally likely, making it impossible for an attacker to deduce the original message without possessing the key.12 The randomness of the key and its single use are the fundamental pillars of its security.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Technical Blueprint</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The process is straightforward. Plaintext and key are converted into a numerical representation, typically binary. Each bit or character of the plaintext is combined with the corresponding bit or character of the key using an XOR operation.12 Decryption is the exact same process because XOR is its own inverse; XORing the ciphertext with the same key restores the original plaintext.12 A Vigenère cipher with a non-repeating key as long as the message is, in essence, a one-time pad.4
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    The OTP is mathematically unbreakable, but only if four critical conditions are met:
                  </p>
                  <ul className="ml-4 space-y-2">
                    <li><strong>Key Length:</strong> The key must be at least as long as the plaintext message.12</li>
                    <li><strong>True Randomness:</strong> The key must be generated from a truly random source, not a pseudo-random one.12</li>
                    <li><strong>Single Use:</strong> The key must never be reused, in whole or in part, for any other message.12</li>
                    <li><strong>Absolute Secrecy:</strong> The key must be kept completely secret by all communicating parties.12</li>
                  </ul>
                  <p>
                    The failure to meet any of these conditions can compromise the security of the cipher. For instance, if a key is reused, a simple XOR of the two ciphertexts reveals the XOR of the two plaintexts, often leading to a simple-to-solve cryptogram.
                  </p>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
                <div className="space-y-4 text-gray-800">
                  <p>
                    Because of its stringent requirements, the one-time pad is not suitable for general-purpose encryption in a digital world. The most significant challenge is the secure distribution and management of keys that are as large as the messages themselves.12 Despite these practical limitations, it has been used for high-stakes, sensitive communications, such as the Moscow-Washington hotline during the Cold War.12
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "example" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Solved Example: One-Time Pad</h2>
                <div className="space-y-4 text-gray-800">
                  <p className="mb-4">
                    This example demonstrates the simple, elegant process of the One-Time Pad using a binary representation of the plaintext and key.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-semibold text-gray-800 mb-3">Example Setup</h3>
                    <div className="space-y-2 font-mono text-sm">
                      <p><strong>Plaintext:</strong> HI</p>
                      <p><strong>Binary representation (ASCII):</strong> 01001000 01001001</p>
                      <p><strong>Key:</strong> (must be at least 16 bits long and truly random)</p>
                      <p><strong>Random Binary Key:</strong> 11010110 00111011</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Encryption (Plaintext XOR Key)</h3>
                      <div className="ml-4 space-y-2">
                        <p>Each bit of the plaintext is XORed with the corresponding bit of the key.</p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm space-y-1">
                            <p><strong>Plaintext:</strong> 01001000 01001001</p>
                            <p><strong>Key:</strong>       11010110 00111011</p>
                            <p><strong>Result:</strong>    10011110 01110010 (Ciphertext)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: Decryption (Ciphertext XOR Key)</h3>
                      <div className="ml-4 space-y-2">
                        <p>The ciphertext is XORed with the exact same key to recover the original plaintext.</p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="font-mono text-sm space-y-1">
                            <p><strong>Ciphertext:</strong> 10011110 01110010</p>
                            <p><strong>Key:</strong>        11010110 00111011</p>
                            <p><strong>Result:</strong>     01001000 01001001 (Original Plaintext)</p>
                          </div>
                        </div>
                        <p>The decrypted binary string is the ASCII representation of HI, proving that the process is a perfect involution.</p>
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
          One-Time Pad Simulation Tool © 2025
        </p>
      </footer>
    </div>
  );
};

export default OneTimePadCipher;