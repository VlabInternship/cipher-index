import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

const OneTimePadCipher = () => {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            One-Time Pad Cipher
          </h1>
          <p className="text-gray-600">
            The only mathematically proven unbreakable encryption method
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {/* Theory Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
              <Lock className="text-blue-600" size={20} />
              Theory & Principles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-blue-700">Perfect Secrecy</h3>
                  <p className="text-sm text-gray-700">
                    Unbreakable when key is random, used once, and kept secret.
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-blue-700">Modular Addition</h3>
                  <p className="text-sm text-gray-700">
                    Each character is combined with key using mod 26 arithmetic.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-blue-700">Key Requirements</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Truly random</li>
                    <li>• Same length as message</li>
                    <li>• Used only once</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

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

          {/* Security Analysis */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
              <Unlock className="text-blue-600" size={20} />
              Security Analysis
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="font-semibold text-green-700">Strengths</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Mathematically unbreakable</li>
                  <li>• Perfect secrecy when used correctly</li>
                  <li>• Immune to quantum computing</li>
                </ul>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <h3 className="font-semibold text-red-700">Limitations</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Key distribution problem</li>
                  <li>• Key must be truly random</li>
                  <li>• Key can only be used once</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneTimePadCipher;