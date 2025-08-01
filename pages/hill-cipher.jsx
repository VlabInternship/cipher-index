import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, Calculator, BookOpen, Code } from 'lucide-react';

const HillCipherApp = () => {
  const [activeTab, setActiveTab] = useState('theory');
  const [plaintext, setPlaintext] = useState('HELLO');
  const [ciphertext, setCiphertext] = useState('');
  const [keyMatrix, setKeyMatrix] = useState([[3, 2], [5, 7]]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [encryptionSteps, setEncryptionSteps] = useState([]);
  const [decryptionSteps, setDecryptionSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  // Matrix operations
  const modInverse = (a, m) => {
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
    const detInv = modInverse(((det % 26) + 26) % 26, 26);
    if (!detInv) return null;
    
    return [
      [(matrix[1][1] * detInv) % 26, (-matrix[0][1] * detInv + 26 * 26) % 26],
      [(-matrix[1][0] * detInv + 26 * 26) % 26, (matrix[0][0] * detInv) % 26]
    ];
  };

  const matrixMultiply = (matrix, vector) => {
    return [
      (matrix[0][0] * vector[0] + matrix[0][1] * vector[1]) % 26,
      (matrix[1][0] * vector[0] + matrix[1][1] * vector[1]) % 26
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
    
    for (let i = 0; i < text.length; i += 2) {
      const pair = text.slice(i, i + 2);
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
    setCurrentStep(0);
    setIsEncrypting(true);
    setShowSteps(true);
    
    const result = steps.map(step => step.cipherPair).join('');
    setCiphertext(result);
  };

  const decrypt = () => {
    if (!ciphertext) return;
    const steps = generateDecryptionSteps(ciphertext, keyMatrix);
    setDecryptionSteps(steps);
    setCurrentStep(0);
    setIsDecrypting(true);
    setShowSteps(true);
  };

  const nextStep = () => {
    if (isEncrypting && currentStep < encryptionSteps.length) {
      setCurrentStep(prev => prev + 1);
      if (currentStep + 1 >= encryptionSteps.length) {
        setIsEncrypting(false);
      }
    } else if (isDecrypting && currentStep < decryptionSteps.length) {
      setCurrentStep(prev => prev + 1);
      if (currentStep + 1 >= decryptionSteps.length) {
        setIsDecrypting(false);
      }
    }
  };

  const resetSteps = () => {
    setCurrentStep(0);
    setIsEncrypting(false);
    setIsDecrypting(false);
    setShowSteps(false);
    setEncryptionSteps([]);
    setDecryptionSteps([]);
  };

  const AnimationStep = ({ step, isActive, isCompleted, type }) => {
    const bgColor = isActive ? 'bg-blue-100 border-blue-500' : 
                   isCompleted ? 'bg-green-100 border-green-400' : 
                   'bg-gray-50 border-gray-200';
    const textColor = isActive ? 'text-blue-800' : 
                     isCompleted ? 'text-green-800' : 
                     'text-gray-400';
    
    return (
      <div className={`p-4 border-2 rounded-lg transition-all duration-500 ${bgColor} ${textColor}`}>
        <div className="text-sm font-semibold mb-2">Step {step.step}</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Input:</span>
            <span className="font-mono">{type === 'encrypt' ? step.pair : step.pair}</span>
            <span className="text-xs">→</span>
            <span className="font-mono">[{step.numbers.join(', ')}]</span>
          </div>
          
          <div className="text-xs">
            <div className="font-mono whitespace-pre">{step.calculation}</div>
            <div className="font-mono whitespace-pre">{step.calculation2}</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Result:</span>
            <span className="font-mono">[{step.result.join(', ')}]</span>
            <span className="text-xs">→</span>
            <span className="font-mono font-bold text-green-600">
              {type === 'encrypt' ? step.cipherPair : step.plainPair}
            </span>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Hill Cipher Interactive Learning Tool</h1>
          <p className="text-gray-600">Learn and visualize how the Hill Cipher encryption works</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {[
              { id: 'theory', label: 'Theory', icon: BookOpen },
              { id: 'example', label: 'Example', icon: Calculator },
              { id: 'encrypt', label: 'Encrypt', icon: Lock },
              { id: 'decrypt', label: 'Decrypt', icon: Unlock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Hill Cipher Theory</h2>
            
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="text-xl font-semibold mb-3">What is Hill Cipher?</h3>
                <p className="leading-relaxed">
                  The Hill Cipher is a polygraphic substitution cipher based on linear algebra. It was invented by 
                  Lester S. Hill in 1929. Unlike simple substitution ciphers that encrypt one character at a time, 
                  the Hill Cipher encrypts blocks of characters simultaneously using matrix multiplication.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">How It Works</h3>
                <ul className="space-y-3 list-disc list-inside">
                  <li>The plaintext is divided into blocks (usually pairs of letters)</li>
                  <li>Each letter is converted to a number (A=0, B=1, ..., Z=25)</li>
                  <li>The key is represented as an n×n matrix</li>
                  <li>Each block is multiplied by the key matrix modulo 26</li>
                  <li>The resulting numbers are converted back to letters</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Mathematical Formula</h3>
                <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                  <p>For encryption: C = K × P (mod 26)</p>
                  <p>For decryption: P = K⁻¹ × C (mod 26)</p>
                  <p className="mt-2">Where:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>C = Ciphertext vector</li>
                    <li>P = Plaintext vector</li>
                    <li>K = Key matrix</li>
                    <li>K⁻¹ = Inverse of key matrix</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Security Requirements</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>The key matrix must be invertible modulo 26</li>
                  <li>gcd(det(K), 26) = 1 (determinant must be coprime to 26)</li>
                  <li>Larger key matrices provide better security</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Example Tab */}
        {activeTab === 'example' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Hill Cipher Example</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Encryption Example</h3>
                
                <div className="space-y-4">
                  <div>
                    <strong>Plaintext:</strong> "HELLO"
                    <br />
                    <strong>Key Matrix:</strong>
                    <div className="font-mono mt-2 bg-white p-2 rounded inline-block">
                      [3 2]<br />
                      [5 7]
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Step 1: Convert to numbers</h4>
                    <p>H=7, E=4, L=11, L=11, O=14</p>
                    <p>Pairs: HE → [7,4], LL → [11,11], OX → [14,23] (padding with X)</p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Step 2: Matrix multiplication</h4>
                    <div className="font-mono text-sm bg-gray-100 p-3 rounded">
                      <p>First pair [7,4]:</p>
                      <p>[3 2] × [7]  = [3×7 + 2×4] = [29] ≡ [3] (mod 26)</p>
                      <p>[5 7]   [4]    [5×7 + 7×4]   [63]   [11]</p>
                      <p>Result: [3,11] → DL</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Step 3: Continue for all pairs</h4>
                    <p>Complete encryption produces the ciphertext</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Decryption Process</h3>
                <p>To decrypt, we need the inverse of the key matrix and apply the same process with the inverse matrix.</p>
                
                <div className="mt-4">
                  <strong>Key Matrix Inverse:</strong>
                  <div className="font-mono mt-2 bg-white p-2 rounded inline-block">
                    Calculate K⁻¹ (mod 26)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Encrypt Tab */}
        {activeTab === 'encrypt' && (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Encryption Process</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plaintext (A-Z only)
                  </label>
                  <input
                    type="text"
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter plaintext..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Matrix (2×2)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={encrypt}
                  disabled={!plaintext}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={18} />
                  <span>Start Encryption</span>
                </button>

                <button
                  onClick={resetSteps}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </button>

                {ciphertext && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Result:</span>
                    <span className="font-mono text-lg font-bold text-green-600 bg-green-100 px-3 py-1 rounded">
                      {ciphertext}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Animation Steps */}
            {showSteps && encryptionSteps.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Encryption Steps</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Step {currentStep} of {encryptionSteps.length}
                    </span>
                    {(isEncrypting && currentStep < encryptionSteps.length) && (
                      <button
                        onClick={nextStep}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <span>Next Step</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {encryptionSteps.map((step, index) => (
                    <AnimationStep
                      key={index}
                      step={step}
                      isActive={index === currentStep - 1}
                      isCompleted={index < currentStep - 1}
                      type="encrypt"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decrypt Tab */}
        {activeTab === 'decrypt' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Decryption Process</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciphertext
                  </label>
                  <input
                    type="text"
                    value={ciphertext}
                    onChange={(e) => setCiphertext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ciphertext or use result from encryption..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inverse Key Matrix
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const inverse = matrixInverse2x2(keyMatrix);
                      return inverse ? inverse.map((row, i) =>
                        row.map((val, j) => (
                          <div
                            key={`${i}-${j}`}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-center bg-gray-100 text-gray-700"
                          >
                            {val}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-red-500 text-sm">
                          Matrix not invertible
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={decrypt}
                  disabled={!ciphertext || !matrixInverse2x2(keyMatrix)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Unlock size={18} />
                  <span>Start Decryption</span>
                </button>

                <button
                  onClick={resetSteps}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </button>

                {decryptionSteps.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Decrypted:</span>
                    <span className="font-mono text-lg font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded">
                      {decryptionSteps.map(step => step.plainPair).join('')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Decryption Animation Steps */}
            {showSteps && decryptionSteps.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Decryption Steps</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Step {currentStep} of {decryptionSteps.length}
                    </span>
                    {(isDecrypting && currentStep < decryptionSteps.length) && (
                      <button
                        onClick={nextStep}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <span>Next Step</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decryptionSteps.map((step, index) => (
                    <AnimationStep
                      key={index}
                      step={step}
                      isActive={index === currentStep - 1}
                      isCompleted={index < currentStep - 1}
                      type="decrypt"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Hill Cipher Interactive Learning Tool - Built with React</p>
        </div>
      </div>
    </div>
  );
};

export default HillCipherApp;