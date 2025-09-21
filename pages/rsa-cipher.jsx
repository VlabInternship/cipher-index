import React, { useState, useEffect } from 'react';

// RSA Helper Functions
// Checks if a number is prime.
const isPrime = (n) => {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
};

// Calculates the Greatest Common Divisor using Euclidean algorithm.
const gcd = (a, b) => {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};

// Finds the modular multiplicative inverse.
const modInverse = (a, m) => {
  for (let i = 1; i < m; i++) {
    if ((a * i) % m === 1) return i;
  }
  return 1;
};

// Performs modular exponentiation (power function).
const modPow = (base, exp, mod) => {
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
};

// Generates the public and private keys for RSA.
const generateKeys = (p, q) => {
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  
  // Find e (commonly 65537 or smaller values)
  let e = 3;
  while (e < phi && gcd(e, phi) !== 1) {
    e += 2;
  }
  
  // Calculate d
  const d = modInverse(e, phi);
  
  return {
    publicKey: { e, n },
    privateKey: { d, n },
    p, q, phi
  };
};

// Converts plain text to an array of ASCII numbers.
const textToNumbers = (text) => {
  return text.split('').map(char => char.charCodeAt(0));
};

// Converts an array of ASCII numbers back to text.
const numbersToText = (numbers) => {
  return numbers.map(num => String.fromCharCode(num)).join('');
};

// Encrypts a message using the public key.
const encrypt = (message, publicKey) => {
  const numbers = textToNumbers(message);
  return numbers.map(num => modPow(num, publicKey.e, publicKey.n));
};

// Decrypts an encrypted array of numbers using the private key.
const decrypt = (encryptedNumbers, privateKey) => {
  const decryptedNumbers = encryptedNumbers.map(num => modPow(num, privateKey.d, privateKey.n));
  return numbersToText(decryptedNumbers);
};

// Component for the animated visualizer
const Visualizer = ({ message, keys, animationState, currentStep, currentCharacter }) => {
  const isEncrypting = animationState === 'encrypting';
  const isDecrypting = animationState === 'decrypting';

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Encryption Flow */}
      {isEncrypting && (
        <div className="flex flex-row items-center justify-center w-full space-x-6">
          <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
            <div className="text-xl font-bold font-mono text-[#0056b3]">{currentCharacter}</div>
            <div className="mt-2 text-gray-500 text-sm">Plaintext Character</div>
          </div>
          <div className="text-4xl text-[#007bff]">→</div>
          {currentStep >= 1 && (
            <>
              <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
                <div className="text-xl font-bold font-mono text-[#0056b3]">{message.charCodeAt(message.indexOf(currentCharacter))}</div>
                <div className="mt-2 text-gray-500 text-sm">ASCII Value</div>
              </div>
              <div className="text-4xl text-[#007bff]">→</div>
            </>
          )}
          {currentStep >= 2 && (
            <>
              <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
                <div className="text-xl font-bold font-mono text-[#0056b3]">{modPow(message.charCodeAt(message.indexOf(currentCharacter)), keys.publicKey.e, keys.publicKey.n)}</div>
                <div className="mt-2 text-gray-500 text-sm">C = M^e mod n</div>
              </div>
              <div className="text-4xl text-[#007bff]">→</div>
            </>
          )}
          {currentStep >= 3 && (
            <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
              <div className="text-xl font-bold font-mono text-[#0056b3]">{modPow(message.charCodeAt(message.indexOf(currentCharacter)), keys.publicKey.e, keys.publicKey.n)}</div>
              <div className="mt-2 text-gray-500 text-sm">Ciphertext (Number)</div>
            </div>
          )}
        </div>
      )}

      {/* Decryption Flow */}
      {isDecrypting && (
        <div className="flex flex-row items-center justify-center w-full space-x-6">
          <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
            <div className="text-xl font-bold font-mono text-[#0056b3]">{currentCharacter}</div>
            <div className="mt-2 text-gray-500 text-sm">Ciphertext Number</div>
          </div>
          <div className="text-4xl text-[#007bff]">→</div>
          {currentStep >= 1 && (
            <>
              <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
                <div className="text-xl font-bold font-mono text-[#0056b3]">{modPow(currentCharacter, keys.privateKey.d, keys.privateKey.n)}</div>
                <div className="mt-2 text-gray-500 text-sm">M = C^d mod n</div>
              </div>
              <div className="text-4xl text-[#007bff]">→</div>
            </>
          )}
          {currentStep >= 2 && (
            <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm w-full min-h-[100px] flex flex-col justify-center items-center text-center">
              <div className="text-xl font-bold font-mono text-[#0056b3]">{String.fromCharCode(modPow(currentCharacter, keys.privateKey.d, keys.privateKey.n))}</div>
              <div className="mt-2 text-gray-500 text-sm">Decrypted Character</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('theory');
  const [step, setStep] = useState(1);
  const [animationState, setAnimationState] = useState('idle');
  const [animationIndex, setAnimationIndex] = useState(-1);

  // RSA Parameters
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [message, setMessage] = useState('hello');
  const [keys, setKeys] = useState(null);
  const [encryptedMessage, setEncryptedMessage] = useState([]);
  const [decryptedMessage, setDecryptedMessage] = useState('');

  useEffect(() => {
    if (isPrime(p) && isPrime(q) && p !== q) {
      const generatedKeys = generateKeys(p, q);
      setKeys(generatedKeys);
    }
  }, [p, q]);

  const handleEncryption = () => {
    if (!keys || !message) return;
    
    setAnimationState('encrypting');
    setAnimationIndex(0);
    setStep(2);
    
    const messageNumbers = textToNumbers(message);
    const encrypted = encrypt(message, keys.publicKey);
    setEncryptedMessage(encrypted);

    let currentStep = 0;
    const animateChar = (index) => {
      if (index < messageNumbers.length) {
        setAnimationIndex(index);
        currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          if (currentStep > 3) {
            clearInterval(interval);
            animateChar(index + 1);
          } else {
            setStep(currentStep);
          }
        }, 1000);
      } else {
        setAnimationState('idle');
        setStep(1);
      }
    };
    animateChar(0);
  };

  const handleDecryption = () => {
    if (!encryptedMessage.length) return;

    setAnimationState('decrypting');
    setAnimationIndex(0);
    
    const decrypted = decrypt(encryptedMessage, keys.privateKey);
    setDecryptedMessage(decrypted);

    let currentStep = 0;
    const animateChar = (index) => {
      if (index < encryptedMessage.length) {
        setAnimationIndex(index);
        currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          if (currentStep > 2) {
            clearInterval(interval);
            animateChar(index + 1);
          } else {
            setStep(currentStep);
          }
        }, 1000);
      } else {
        setAnimationState('idle');
        setStep(1);
      }
    };
    animateChar(0);
  };
  
  const renderTab = (id, label) => (
    <button
      key={id}
      onClick={() => {
        setActiveTab(id);
        setStep(1);
        setAnimationState('idle');
        setAnimationIndex(-1);
      }}
      className={`py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${activeTab === id ? 'bg-[#0056b3] text-white shadow-md' : 'bg-gray-100 text-[#0056b3] border border-[#0056b3] hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <div className="bg-white p-5 shadow-md text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#0056b3] mb-5">RSA</h1>
        
        {/* Tab Navigation */}
        <div className="flex justify-center gap-2">
          {renderTab('theory', 'Theory')}
          {renderTab('example', 'Example')}
          {renderTab('simulation', 'Simulation')}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-5">
        {/* Theory Tab */}
        {activeTab === 'theory' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
            <h2 className="text-xl font-semibold text-[#0056b3] mb-4">RSA Algorithm Theory</h2>
            {/* Introduction */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Introduction</h3>
              <p>
                The RSA algorithm is a foundational public-key cryptography system that
                enables secure communication without requiring a pre-shared secret key.
                It is a cornerstone of modern digital security and has been widely used
                for secure data transmission, digital signatures, and authentication
                since its invention.
              </p>
            </div>
            {/* Origin Story */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Origin Story</h3>
              <p>
                The RSA algorithm was invented in 1977 by Ron Rivest, Adi Shamir, and
                Leonard Adleman, who lent their initials to its name. The development of
                RSA was revolutionary because it introduced the concept of public-key
                cryptography, fundamentally solving the key distribution problem that
                had long been a major challenge in symmetric cryptography.
              </p>
            </div>
            {/* Core Idea */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Core Idea</h3>
              <p>
                The security of RSA is based on the computational difficulty of integer
                factorization, specifically the difficulty of factoring the product of
                two very large prime numbers. It is easy to multiply two primes but
                infeasible to reverse the process. This one-way function forms the
                basis of RSA’s key pair.
              </p>
            </div>
            {/* Technical Blueprint */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Technical Blueprint</h3>
              <ol className="list-decimal list-inside pl-5 space-y-2">
                <li>
                  <strong>Key Generation:</strong> Choose primes p, q → n = p x q →
                  φ(n) = (p−1)(q−1). Select e with gcd(e, φ(n)) = 1, then compute d as
                  modular inverse of e mod φ(n). Public key = (n, e), Private key = (n,
                  d).
                </li>
                <li>
                  <strong>Encryption:</strong> c = m^e mod n
                </li>
                <li>
                  <strong>Decryption:</strong> m = c^d mod n
                </li>
              </ol>
            </div>
            {/* Security Scorecard */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Security Scorecard</h3>
              <p>
                The strength of RSA depends on key size. While 512-bit keys are now
                insecure, modern systems use 2048-bit or larger keys. RSA can be
                vulnerable to side-channel attacks (timing, power analysis), and weak
                random number generation may compromise security.
              </p>
            </div>
            {/* Real-World Usage */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Real-World Usage</h3>
              <p>
                RSA is widely used in digital security: HTTPS, TLS/SSL handshakes,
                secure email, digital signatures, and secure key exchange. Its elegant
                solution to key distribution enabled the secure internet we rely on
                today.
              </p>
            </div>
          </div>
        )}

        {/* Example Tab */}
        {activeTab === 'example' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
            <h2 className="text-xl font-semibold text-[#0056b3] mb-4">RSA Example</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-[#007bff] mb-3">Step 1: Choose Primes</h3>
                <p>p = 61, q = 53</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-[#007bff] mb-3">Step 2: Calculate n</h3>
                <p>n = 61 x 53 = 3233</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-[#007bff] mb-3">Step 3: Calculate φ(n)</h3>
                <p>φ(n) = (61-1) x (53-1) = 60 x 52 = 3120</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-[#007bff] mb-3">Step 4: Choose e</h3>
                <p>e = 17 (gcd(17, 3120) = 1)</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-[#007bff] mb-3">Step 5: Calculate d</h3>
                <p>d = 2753 (17 x 2753 ≡ 1 mod 3120)</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-[#007bff] mb-3">Keys Generated</h3>
                <p>Public: (17, 3233)</p>
                <p>Private: (2753, 3233)</p>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div>
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
              <h2 className="text-xl font-semibold text-[#0056b3] mb-4">Simulation Controls</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Prime p</label>
                  <input
                    type="number"
                    value={p}
                    onChange={(e) => setP(parseInt(e.target.value))}
                    className="p-2 border border-gray-300 rounded-md text-sm"
                  />
                  {!isPrime(p) && <span className="text-red-500 text-xs mt-1">Not prime</span>}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Prime q</label>
                  <input
                    type="number"
                    value={q}
                    onChange={(e) => setQ(parseInt(e.target.value))}
                    className="p-2 border border-gray-300 rounded-md text-sm"
                  />
                  {!isPrime(q) && <span className="text-red-500 text-xs mt-1">Not prime</span>}
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Message</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">&nbsp;</label>
                  <button 
                    onClick={handleEncryption} 
                    className={`py-3 px-6 rounded-md shadow-sm font-semibold text-white bg-[#0056b3] hover:bg-[#004a99] transition-colors ${(!isPrime(p) || !isPrime(q) || p === q) ? 'bg-gray-300 cursor-not-allowed' : ''}`}
                    disabled={!isPrime(p) || !isPrime(q) || p === q || animationState !== 'idle'}
                  >
                    Encrypt
                  </button>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">&nbsp;</label>
                  <button 
                    onClick={handleDecryption} 
                    className={`py-3 px-6 rounded-md shadow-sm font-semibold text-white bg-[#0056b3] hover:bg-[#004a99] transition-colors ${(encryptedMessage.length === 0) ? 'bg-gray-300 cursor-not-allowed' : ''}`}
                    disabled={encryptedMessage.length === 0 || animationState !== 'idle'}
                  >
                    Decrypt
                  </button>
                </div>
              </div>
              
              {/* Display Keys */}
              {keys && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-[#007bff] mb-3">Public Key (e, n)</h3>
                    <p>({keys.publicKey.e}, {keys.publicKey.n})</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-[#007bff] mb-3">Private Key (d, n)</h3>
                    <p>({keys.privateKey.d}, {keys.privateKey.n})</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Animated Simulation Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
              <h2 className="text-xl font-semibold text-[#0056b3] mb-4">Animated Simulation</h2>
              <div className="flex justify-center items-center">
                {animationState === 'idle' && (
                  <div className="text-gray-500 italic text-center">
                    Click Encrypt or Decrypt to see the animation.
                  </div>
                )}
                {animationState !== 'idle' && (
                  <Visualizer
                    message={message}
                    keys={keys}
                    animationState={animationState}
                    currentStep={step}
                    currentCharacter={animationState === 'encrypting' ? message[animationIndex] : encryptedMessage[animationIndex]}
                    />
                )}
              </div>
            </div>

            {/* Final Results */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
              <h2 className="text-xl font-semibold text-[#0056b3] mb-4">Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-[#007bff] mb-3">Plaintext</h3>
                  <p className="font-mono">{message}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-[#007bff] mb-3">Ciphertext</h3>
                  <p className="font-mono">{encryptedMessage.join(', ')}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-[#007bff] mb-3">Decrypted Text</h3>
                  <p className="font-mono">{decryptedMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-gray-600 text-sm">
          RSA Cipher Simulation Tool © 2025
        </p>
      </footer>
    </div>
  );
}

export default App;
