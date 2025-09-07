import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, Calculator, BookOpen, Code } from 'lucide-react';

const HillCipherApp = () => {
  const [activeTab, setActiveTab] = useState('Theory');
  const [plaintext, setPlaintext] = useState('HELLO');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [keyMatrix, setKeyMatrix] = useState([[3, 2], [5, 7]]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [encryptionSteps, setEncryptionSteps] = useState([]);
  const [decryptionSteps, setDecryptionSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  // Matrix operations
  const modInverse = (a, m) => {
    a = ((a % m) + m) % m;
    for (let i = 1; i < m; i++) {
      if ((a * i) % m === 1) return i;
    }
    return null;
  };

  const determinant2x2 = (matrix) => {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  };

  const matrixInverse2x2 = (matrix) => {
    const det = determinant2x2(matrix);
    const detMod = ((det % 26) + 26) % 26;
    const detInv = modInverse(detMod, 26);
    if (!detInv) return null;
    
    return [
      [((matrix[1][1] * detInv) % 26 + 26) % 26, ((-matrix[0][1] * detInv) % 26 + 26) % 26],
      [((-matrix[1][0] * detInv) % 26 + 26) % 26, ((matrix[0][0] * detInv) % 26 + 26) % 26]
    ];
  };

  const matrixMultiply = (matrix, vector) => {
    return [
      ((matrix[0][0] * vector[0] + matrix[0][1] * vector[1]) % 26 + 26) % 26,
      ((matrix[1][0] * vector[0] + matrix[1][1] * vector[1]) % 26 + 26) % 26
    ];
  };

  const charToNum = (char) => char.charCodeAt(0) - 65;
  const numToChar = (num) => String.fromCharCode(((num % 26) + 26) % 26 + 65);

  const generateEncryptionSteps = (text, key) => {
    const steps = [];
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    
    for (let i = 0; i < cleanText.length; i += 2) {
      const pair = cleanText.slice(i, i + 2).padEnd(2, 'X');
      const nums = [charToNum(pair[0]), charToNum(pair[1])];
      const result = matrixMultiply(key, nums);
      const chars = [numToChar(result[0]), numToChar(result[1])];
      
      steps.push({
        step: i / 2 + 1,
        pair: pair,
        numbers: nums,
        matrix: key,
        calculation: `[${key[0][0]} ${key[0][1]}] × [${nums[0]}] = [${result[0]}]`,
        calculation2: `[${key[1][0]} ${key[1][1]}]   [${nums[1]}]   [${result[1]}]`,
        result: result,
        chars: chars,
        cipherPair: chars.join('')
      });
    }
    
    return steps;
  };

  const generateDecryptionSteps = (text, key) => {
    const steps = [];
    const inverseKey = matrixInverse2x2(key);
    if (!inverseKey) return [];
    
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    
    for (let i = 0; i < cleanText.length; i += 2) {
      const pair = cleanText.slice(i, i + 2);
      if (pair.length < 2) break; // Skip incomplete pairs
      
      const nums = [charToNum(pair[0]), charToNum(pair[1])];
      const result = matrixMultiply(inverseKey, nums);
      const chars = [numToChar(result[0]), numToChar(result[1])];
      
      steps.push({
        step: i / 2 + 1,
        pair: pair,
        numbers: nums,
        matrix: inverseKey,
        calculation: `[${inverseKey[0][0]} ${inverseKey[0][1]}] × [${nums[0]}] = [${result[0]}]`,
        calculation2: `[${inverseKey[1][0]} ${inverseKey[1][1]}]   [${nums[1]}]   [${result[1]}]`,
        result: result,
        chars: chars,
        plainPair: chars.join('')
      });
    }
    
    return steps;
  };

  const encrypt = () => {
    const steps = generateEncryptionSteps(plaintext, keyMatrix);
    setEncryptionSteps(steps);
    setDecryptionSteps([]); // Clear decryption steps
    setCurrentStep(0);
    setIsEncrypting(true);
    setIsDecrypting(false);
    setShowSteps(true);
    
    const result = steps.map(step => step.cipherPair).join('');
    setCiphertext(result);
    setDecryptedResult(''); // Clear decrypted result
  };

  const decrypt = () => {
    if (!ciphertext.trim()) {
      alert('Please enter ciphertext to decrypt');
      return;
    }
    
    const inverseMatrix = matrixInverse2x2(keyMatrix);
    if (!inverseMatrix) {
      alert('Matrix is not invertible! Cannot decrypt.');
      return;
    }
    
    const steps = generateDecryptionSteps(ciphertext, keyMatrix);
    if (steps.length === 0) {
      alert('Invalid ciphertext or matrix');
      return;
    }
    
    setDecryptionSteps(steps);
    setEncryptionSteps([]); // Clear encryption steps
    setCurrentStep(0);
    setIsDecrypting(true);
    setIsEncrypting(false);
    setShowSteps(true);
    
    // Set the decrypted result immediately
    const result = steps.map(step => step.plainPair).join('');
    setDecryptedResult(result);
  };

  const nextStep = () => {
    if (isEncrypting && currentStep < encryptionSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (isDecrypting && currentStep < decryptionSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished all steps
      setIsEncrypting(false);
      setIsDecrypting(false);
    }
  };

  const resetSteps = () => {
    setCurrentStep(0);
    setIsEncrypting(false);
    setIsDecrypting(false);
    setShowSteps(false);
    setEncryptionSteps([]);
    setDecryptionSteps([]);
    setCiphertext('');
    setDecryptedResult('');
    setPlaintext('HELLO');
  };

  const tabs = ['Theory', 'Example', 'Simulation'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Hill Cipher</h1>
            <p className="text-gray-600 text-lg">Learn, simulate, and understand the encryption and decryption process</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 font-medium text-lg transition-all duration-200 border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Theory Tab */}
        {activeTab === 'Theory' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-600 mb-4">Introduction</h2>
                <div className="h-1 w-24 bg-blue-600 mb-6"></div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  The <span className="text-blue-600 font-semibold">Hill cipher</span>, also known as the Hill cipher, is a polygraphic substitution cipher 
                  based on linear algebra. It was invented by Lester S. Hill in 1929. Unlike simpler substitution ciphers 
                  that encrypt single letters, Hill operates on blocks of letters, known as bigrams or digrams. This 
                  innovation makes it significantly harder to break using simple frequency analysis, which was the primary 
                  attack vector against monoalphabetic ciphers of the time.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-600 mb-4">Origin Story</h2>
                <div className="h-1 w-24 bg-blue-600 mb-6"></div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  The cipher's history is rooted in mathematical innovation, as it was invented by <span className="text-blue-600 font-semibold">Lester S. Hill</span> in 1929. However, it 
                  became famous and was widely promoted by mathematician and cryptographer Hill himself, after whom it was named. This cipher marked 
                  a major step forward from the simple Caesar cipher and more complex Vigenère systems then in use, as it 
                  provided a greater level of security with a mathematical foundation based on linear algebra.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-600 mb-4">How It Works</h2>
                <div className="h-1 w-24 bg-blue-600 mb-6"></div>
                <div className="space-y-4 text-gray-700 text-lg">
                  <p>The Hill Cipher operates through these key principles:</p>
                  <div className="pl-6 space-y-3">
                    <p>• The plaintext is divided into blocks (usually pairs of letters)</p>
                    <p>• Each letter is converted to a number (A=0, B=1, ..., Z=25)</p>
                    <p>• The key is represented as an n×n matrix</p>
                    <p>• Each block is multiplied by the key matrix modulo 26</p>
                    <p>• The resulting numbers are converted back to letters</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-600 mb-4">Mathematical Foundation</h2>
                <div className="h-1 w-24 bg-blue-600 mb-6"></div>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="font-mono text-lg space-y-3">
                    <p><strong>For encryption:</strong> C = K × P (mod 26)</p>
                    <p><strong>For decryption:</strong> P = K⁻¹ × C (mod 26)</p>
                  </div>
                  <div className="mt-4 text-gray-700">
                    <p className="font-semibold mb-2">Where:</p>
                    <div className="pl-4 space-y-1">
                      <p>• C = Ciphertext vector</p>
                      <p>• P = Plaintext vector</p>
                      <p>• K = Key matrix</p>
                      <p>• K⁻¹ = Inverse of key matrix</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-blue-600 mb-4">Security Requirements</h2>
                <div className="h-1 w-24 bg-blue-600 mb-6"></div>
                <div className="space-y-3 text-gray-700 text-lg">
                  <p>• The key matrix must be invertible modulo 26</p>
                  <p>• gcd(det(K), 26) = 1 (determinant must be coprime to 26)</p>
                  <p>• Larger key matrices provide better security</p>
                  <p>• The key must be kept secret and chosen carefully</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example Tab */}
        {activeTab === 'Example' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-600 mb-4">Hill Cipher Example</h2>
                <div className="h-1 w-24 bg-blue-600 mb-6"></div>
              </div>

              <div className="space-y-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">Encryption Example</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-lg"><strong>Plaintext:</strong> "HELLO"</p>
                      <p className="text-lg"><strong>Key Matrix:</strong></p>
                      <div className="font-mono text-lg mt-2 bg-white p-4 rounded inline-block border">
                        [3 2]<br />
                        [5 7]
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-blue-700">Step 1: Convert to numbers</h4>
                      <p className="text-gray-700">H=7, E=4, L=11, L=11, O=14</p>
                      <p className="text-gray-700">Pairs: HE → [7,4], LL → [11,11], OX → [14,23] (padding with X)</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-blue-700">Step 2: Matrix multiplication</h4>
                      <div className="font-mono text-sm bg-white p-4 rounded border">
                        <p className="font-semibold">First pair [7,4]:</p>
                        <p>[3 2] × [7]  = [3×7 + 2×4] = [29] ≡ [3] (mod 26)</p>
                        <p>[5 7]   [4]    [5×7 + 7×4]   [63]   [11]</p>
                        <p className="text-green-600 font-semibold">Result: [3,11] → DL</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-blue-700">Step 3: Continue for all pairs</h4>
                      <p className="text-gray-700">Apply the same process to all letter pairs to get the complete ciphertext.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Decryption Process</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    To decrypt, we need the inverse of the key matrix and apply the same process with the inverse matrix.
                    The key matrix must be invertible modulo 26 for decryption to work properly.
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-lg"><strong>Key Matrix Inverse:</strong></p>
                    <div className="font-mono text-lg mt-2 bg-white p-4 rounded inline-block border">
                      Calculate K⁻¹ (mod 26)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'Simulation' && (
          <div className="space-y-6">
            {/* Key Matrix Configuration */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Key Matrix Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Key Matrix (2×2)
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-48">
                    {keyMatrix.map((row, i) =>
                      row.map((val, j) => (
                        <input
                          key={`${i}-${j}`}
                          type="number"
                          value={val}
                          onChange={(e) => {
                            const newMatrix = [...keyMatrix];
                            newMatrix[i][j] = parseInt(e.target.value) || 0;
                            setKeyMatrix(newMatrix);
                          }}
                          className="px-3 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Matrix Properties
                  </label>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Determinant:</span> {determinant2x2(keyMatrix)} 
                      <span className="ml-2 text-gray-500">(mod 26: {((determinant2x2(keyMatrix) % 26) + 26) % 26})</span>
                    </div>
                    {matrixInverse2x2(keyMatrix) ? (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ Matrix is invertible
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 font-medium">
                        ✗ Matrix not invertible (determinant not coprime with 26)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Encryption Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Encryption</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plaintext (A-Z only)
                  </label>
                  <input
                    type="text"
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter plaintext..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciphertext Result
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg font-mono">
                    {ciphertext || 'Click encrypt to see result'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={encrypt}
                  disabled={!plaintext || !matrixInverse2x2(keyMatrix)}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  <Lock size={20} />
                  <span>Encrypt</span>
                </button>

                <button
                  onClick={resetSteps}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-lg font-medium"
                >
                  <RotateCcw size={20} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Decryption Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Decryption</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciphertext
                  </label>
                  <input
                    type="text"
                    value={ciphertext}
                    onChange={(e) => setCiphertext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter ciphertext or use result from encryption..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decrypted Result
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg font-mono">
                    {decryptedResult || 'Click decrypt to see result'}
                  </div>
                </div>
              </div>

              <button
                onClick={decrypt}
                disabled={!ciphertext || !matrixInverse2x2(keyMatrix)}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
              >
                <Unlock size={20} />
                <span>Decrypt</span>
              </button>
            </div>

            {/* Animation Steps */}
            {showSteps && (encryptionSteps.length > 0 || decryptionSteps.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {encryptionSteps.length > 0 ? 'Encryption' : 'Decryption'} Steps
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      Step {currentStep + 1} of {encryptionSteps.length > 0 ? encryptionSteps.length : decryptionSteps.length}
                    </span>
                    {((isEncrypting && currentStep < encryptionSteps.length - 1) || (isDecrypting && currentStep < decryptionSteps.length - 1)) && (
                      <button
                        onClick={nextStep}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play size={16} />
                        <span>Next Step</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(encryptionSteps.length > 0 ? encryptionSteps : decryptionSteps).map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const bgColor = isActive ? 'bg-blue-50 border-blue-300' : 
                                   isCompleted ? 'bg-green-50 border-green-300' : 
                                   'bg-gray-50 border-gray-200';
                    const textColor = isActive ? 'text-blue-800' : 
                                     isCompleted ? 'text-green-800' : 
                                     'text-gray-500';
                    
                    return (
                      <div key={index} className={`p-4 border-2 rounded-lg transition-all duration-500 ${bgColor} ${textColor}`}>
                        <div className="text-sm font-semibold mb-3">Step {step.step}</div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="bg-white px-2 py-1 rounded text-xs font-medium">Input:</span>
                            <span className="font-mono font-semibold">{step.pair}</span>
                            <span>→</span>
                            <span className="font-mono">[{step.numbers.join(', ')}]</span>
                          </div>
                          
                          <div className="text-xs bg-white p-2 rounded border">
                            <div className="font-mono whitespace-pre leading-tight">{step.calculation}</div>
                            <div className="font-mono whitespace-pre leading-tight">{step.calculation2}</div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="bg-white px-2 py-1 rounded text-xs font-medium">Output:</span>
                            <span className="font-mono">[{step.result.join(', ')}]</span>
                            <span>→</span>
                            <span className="font-mono font-bold text-lg px-2 py-1 bg-white rounded border-2 border-current">
                              {encryptionSteps.length > 0 ? step.cipherPair : step.plainPair}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {currentStep >= 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg border">
                    <h4 className="font-bold text-lg mb-2">
                      {encryptionSteps.length > 0 ? 'Current Ciphertext:' : 'Current Plaintext:'}
                    </h4>
                    <div className="font-mono text-2xl font-bold text-center p-4 bg-white rounded-lg border-2 border-dashed">
                      {encryptionSteps.length > 0 
                        ? encryptionSteps.slice(0, currentStep + 1).map(step => step.cipherPair).join('')
                        : decryptionSteps.slice(0, currentStep + 1).map(step => step.plainPair).join('')
                      }
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

export default HillCipherApp;