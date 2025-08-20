import React, { useState } from 'react';
import { Lock, Unlock, BookOpen, Code, RotateCcw } from 'lucide-react';

const VigenereCipher = () => {
  // Color scheme
  const colors = {
    background: '#f8f9fa',
    primary: '#4a6fa5',
    primaryLight: '#6e9ccc',
    secondary: '#ffffff',
    accentGreen: '#28a745',
    accentYellow: '#ffc107',
    accentRed: '#dc3545',
    textDark: '#2d3a4a',
    textLight: '#6c757d',
    border: '#dee2e6'
  };

  // State management
  const [activeTab, setActiveTab] = useState('theory');
  const [plaintext, setPlaintext] = useState('attackatdawn');
  const [key, setKey] = useState('LEMON');
  const [ciphertext, setCiphertext] = useState('LXFOPVEFRNHR');
  const [mode, setMode] = useState('encrypt');

  // Vigenère cipher implementation
  const processVigenere = (text, key, encrypt = true) => {
    // Clean the input text and key
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (cleanKey.length === 0) return '';
    
    let result = '';
    
    for (let i = 0; i < cleanText.length; i++) {
      const textChar = cleanText[i];
      const keyChar = cleanKey[i % cleanKey.length];
      
      const textCode = textChar.charCodeAt(0) - 65;
      const keyCode = keyChar.charCodeAt(0) - 65;
      
      let resultCode;
      if (encrypt) {
        resultCode = (textCode + keyCode) % 26;
      } else {
        resultCode = (textCode - keyCode + 26) % 26;
      }
      
      result += String.fromCharCode(resultCode + 65);
      
      // Add space every 5 characters for better readability
      if ((i + 1) % 5 === 0 && (i + 1) < cleanText.length) {
        result += ' ';
      }
    }
    
    return result;
  };

  // Process the text based on mode
  const processText = () => {
    if (mode === 'encrypt') {
      const result = processVigenere(plaintext, key, true);
      setCiphertext(result);
    } else {
      const result = processVigenere(ciphertext, key, false);
      setPlaintext(result);
    }
  };

  // Reset function
  const resetForm = () => {
    setPlaintext('attackatdawn');
    setKey('LEMON');
    setCiphertext('LXFOPVEFRNHR');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textDark }}>Vigenère Cipher</h1>
          <p className="text-sm" style={{ color: colors.textLight }}>Learn, simulate, and understand the encryption and decryption process</p>
        </div>

        {/* Navigation Tabs - Compact Layout */}
        <div className="flex mb-6 justify-center">
          <div className="flex rounded-md shadow-sm overflow-hidden">
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                activeTab === 'theory' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              style={{
                backgroundColor: activeTab === 'theory' ? colors.primary : colors.secondary,
                border: `1px solid ${colors.border}`
              }}
            >
              <BookOpen size={16} />
              Theory
            </button>
            <button
              onClick={() => setActiveTab('example')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                activeTab === 'example' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              style={{
                backgroundColor: activeTab === 'example' ? colors.primary : colors.secondary,
                border: `1px solid ${colors.border}`
              }}
            >
              <Code size={16} />
              Example
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                activeTab === 'simulation' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              style={{
                backgroundColor: activeTab === 'simulation' ? colors.primary : colors.secondary,
                border: `1px solid ${colors.border}`
              }}
            >
              <Lock size={16} />
              Simulation
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6" style={{ border: `1px solid ${colors.border}` }}>
          {/* Theory Section */}
          {activeTab === 'theory' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ color: colors.textDark }}>Introduction</h2>
              <p className="text-sm" style={{ color: colors.textDark }}>
                The <span className="font-bold" style={{ color: colors.primary }}>Vigenère cipher</span> is a method for encrypting text that uses a series of different Caesar ciphers. It stands out from simpler substitution ciphers by using a polyalphabetic approach, where the substitution alphabet for each letter of the plaintext is determined by a corresponding letter from a keyword. This technique was a significant advancement because it interfered with a straightforward application of frequency analysis, which had proven effective against simpler ciphers.
              </p>
              
              <h2 className="text-xl font-bold mt-6" style={{ color: colors.textDark }}>Origin Story</h2>
              <p className="text-sm" style={{ color: colors.textDark }}>
                While the cipher is named after Blaise de Vigenère, its invention is more complex. The concept evolved from earlier polyalphabetic ciphers, but Vigenère is often credited with a strong, definitive formulation. It was first described in a book by Giovan Battista Bellaso in 1553, but Vigenère's later work and popularization led to the cipher being named in his honor.
              </p>
              
              <h2 className="text-xl font-bold mt-6" style={{ color: colors.textDark }}>Core Idea</h2>
              <p className="text-sm" style={{ color: colors.textDark }}>
                The core principle of the Vigenère cipher is to disguise the natural frequency of letters in the plaintext. In a simple substitution cipher, a letter like 'E' will always map to the same ciphertext letter. The Vigenère cipher, however, uses a repeating keyword to apply a different shift to each plaintext letter. This ensures that the same plaintext letter can be encrypted as different ciphertext letters at various points in a message, thereby defeating simple frequency analysis.
              </p>
              
              <h2 className="text-xl font-bold mt-6" style={{ color: colors.textDark }}>Technical Blueprint</h2>
              <p className="text-sm" style={{ color: colors.textDark }}>
                The Vigenère cipher is often implemented using a Vigenère square or <span className="font-bold" style={{ color: colors.primary }}>tabula recta</span>, which is a table of 26 alphabets, each shifted cyclically to the left compared to the previous one.
              </p>
              <p className="text-sm" style={{ color: colors.textDark }}>
                To encrypt, a keyword is chosen and repeated to match the length of the plaintext message. Each plaintext letter is then paired with the corresponding key letter. To find the ciphertext letter, the sender locates the row that begins with the key letter and the column that corresponds to the plaintext letter. The letter at their intersection is the encrypted letter.
              </p>
              <p className="text-sm" style={{ color: colors.textDark }}>
                The process can also be described algebraically. If the alphabet A-Z is mapped to numbers 0-25, encryption can be expressed using modular arithmetic: <code className="bg-gray-100 p-1 rounded text-xs">C_i = (P_i + K_i) mod 26</code>. Decryption reverses this process using subtraction modulo 26: <code className="bg-gray-100 p-1 rounded text-xs">P_i = (C_i - K_i) mod 26</code>.
              </p>
              
              <h2 className="text-xl font-bold mt-6" style={{ color: colors.textDark }}>Security Scorecard</h2>
              <div className="inline-block px-3 py-1 mb-2 rounded-full text-xs text-white font-semibold" style={{ backgroundColor: colors.accentRed }}>
                Insecure - Obsolete
              </div>
              <p className="text-sm" style={{ color: colors.textDark }}>
                The Vigenère cipher's strength lies in its ability to resist simple frequency analysis. However, its primary weakness stems from the repeating nature of its key. If a cryptanalyst can determine the length of the key, they can break the ciphertext into several smaller ciphertexts, each of which is essentially a simple Caesar cipher that can be easily broken. Methods like the <span className="font-bold" style={{ color: colors.primary }}>Kasiski examination</span> and the <span className="font-bold" style={{ color: colors.primary }}>Friedman test</span> exploit the repeating key to find its length by identifying repeated ciphertext segments and analyzing the distance between them.
              </p>
              
              <h2 className="text-xl font-bold mt-6" style={{ color: colors.textDark }}>Real-World Usage</h2>
              <p className="text-sm" style={{ color: colors.textDark }}>
                The Vigenère cipher was simple enough to be used as a "field cipher" and was famously employed by the Confederate States of America during the American Civil War, using a brass cipher disk to facilitate its implementation. The cipher's historical significance is that a version with a random, non-reusable key as long as the message becomes a one-time pad, which is a theoretically unbreakable cipher.
              </p>
            </div>
          )}

          {/* Example Section */}
          {activeTab === 'example' && (
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textDark }}>Solved Example: Vigenère Cipher</h2>
              
              <div className="mb-4">
                <p className="text-sm mb-1" style={{ color: colors.textDark }}><strong>Plaintext:</strong> <span className="font-bold" style={{ color: colors.primary }}>attackatdawn</span></p>
                <p className="text-sm" style={{ color: colors.textDark }}><strong>Keyword:</strong> <span className="font-bold" style={{ color: colors.primary }}>LEMON</span></p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textDark }}>Step 1: Align Plaintext and Key</h4>
                <p className="text-sm mb-2" style={{ color: colors.textDark }}>The keyword is repeated to match the length of the plaintext.</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto" style={{ color: colors.textDark }}>
                  Plaintext: attackatdawn<br />
                  Key:       LEMONLEMONLE
                </pre>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textDark }}>Step 2: Encrypt Letter by Letter</h4>
                <p className="text-sm mb-2" style={{ color: colors.textDark }}>The encryption is performed using the Vigenère square (or algebraic calculation).</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto" style={{ color: colors.textDark }}>
                  A (plaintext) + L (key) = L<br />
                  T (plaintext) + E (key) = X<br />
                  T (plaintext) + M (key) = F<br />
                  A (plaintext) + O (key) = O<br />
                  C (plaintext) + N (key) = P<br />
                  K (plaintext) + L (key) = V<br />
                  A (plaintext) + E (key) = E<br />
                  T (plaintext) + M (key) = F<br />
                  D (plaintext) + O (key) = R<br />
                  A (plaintext) + N (key) = N<br />
                  W (plaintext) + L (key) = H<br />
                  N (plaintext) + E (key) = R
                </pre>
              </div>
              
              <div>
                <p className="text-sm mb-1" style={{ color: colors.textDark }}><strong>Ciphertext:</strong> <span className="font-bold" style={{ color: colors.primary }}>LXFOPVEFRNHR</span></p>
                <p className="text-xs" style={{ color: colors.textLight }}>
                  Note: Spaces are added for readability but are not part of the actual ciphertext
                </p>
              </div>
            </div>
          )}

          {/* Simulation Section */}
          {activeTab === 'simulation' && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>Interactive Simulation</h2>
              
              <div className="flex justify-center mb-4">
                <div className="rounded-md p-1 flex" style={{ backgroundColor: colors.background }}>
                  <button
                    onClick={() => setMode('encrypt')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                      mode === 'encrypt' 
                        ? 'text-white' 
                        : 'text-gray-600 hover:text-green-500'
                    }`}
                    style={{
                      backgroundColor: mode === 'encrypt' ? colors.accentGreen : 'transparent'
                    }}
                  >
                    <Lock size={14} />
                    Encrypt
                  </button>
                  <button
                    onClick={() => setMode('decrypt')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                      mode === 'decrypt' 
                        ? 'text-white' 
                        : 'text-gray-600 hover:text-red-500'
                    }`}
                    style={{
                      backgroundColor: mode === 'decrypt' ? colors.accentRed : 'transparent'
                    }}
                  >
                    <Unlock size={14} />
                    Decrypt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-4">
                {/* In decryption mode, show ciphertext first, then plaintext */}
                {mode === 'decrypt' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textLight }}>
                        Ciphertext
                      </label>
                      <input
                        type="text"
                        value={ciphertext}
                        onChange={(e) => setCiphertext(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., LXFOPVEFRNHR"
                        style={{ backgroundColor: colors.secondary }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textLight }}>
                        Key
                      </label>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., LEMON"
                        style={{ backgroundColor: colors.secondary }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textLight }}>
                        Plaintext
                      </label>
                      <input
                        type="text"
                        value={plaintext}
                        onChange={(e) => setPlaintext(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., attackatdawn"
                        style={{ backgroundColor: colors.secondary }}
                        readOnly
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textLight }}>
                        Plaintext
                      </label>
                      <input
                        type="text"
                        value={plaintext}
                        onChange={(e) => setPlaintext(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., attackatdawn"
                        style={{ backgroundColor: colors.secondary }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textLight }}>
                        Key
                      </label>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., LEMON"
                        style={{ backgroundColor: colors.secondary }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textLight }}>
                        Ciphertext
                      </label>
                      <input
                        type="text"
                        value={ciphertext}
                        onChange={(e) => setCiphertext(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., LXFOPVEFRNHR"
                        style={{ backgroundColor: colors.secondary }}
                        readOnly
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={processText}
                  disabled={mode === 'encrypt' ? !plaintext || !key : !ciphertext || !key}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    (mode === 'encrypt' ? !plaintext || !key : !ciphertext || !key)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : mode === 'encrypt'
                      ? 'hover:shadow text-white'
                      : 'hover:shadow text-white'
                  }`}
                  style={{
                    backgroundColor: (mode === 'encrypt' ? !plaintext || !key : !ciphertext || !key)
                      ? undefined 
                      : mode === 'encrypt'
                      ? colors.accentGreen
                      : colors.accentRed
                  }}
                >
                  {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
                </button>
                
                <button
                  onClick={resetForm}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1"
                  style={{ backgroundColor: colors.textLight, color: 'white' }}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>

              <div className="p-3 rounded-md text-center text-xs" style={{ backgroundColor: colors.background }}>
                <p className="font-medium mb-1" style={{ color: colors.textLight }}>
                  {mode === 'encrypt' ? 'Encryption Formula' : 'Decryption Formula'}
                </p>
                <p className="font-mono" style={{ color: colors.textDark }}>
                  {mode === 'encrypt' 
                    ? 'Ciphertext = (Plaintext + Key) mod 26' 
                    : 'Plaintext = (Ciphertext - Key + 26) mod 26'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-xs" style={{ color: colors.textLight }}>
          <p>Vigenère Cipher Simulation Tool © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default VigenereCipher;