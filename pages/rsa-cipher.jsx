import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from "next/navigation";


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
const Visualizer = ({ message, keys, animationState, currentStep, currentCharacter, decryptedText }) => {
  const styles = {
    flexCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    arrow: { fontSize: '2rem', color: '#007bff' },
    stageCard: {
      backgroundColor: '#f9f9f9',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      width: '100%',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
    valueText: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      color: '#0056b3'
    },
    label: {
      marginTop: '10px',
      color: '#666',
      fontSize: '0.9rem'
    }
  };

  const stageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const isEncrypting = animationState === 'encrypting';
  const isDecrypting = animationState === 'decrypting';
  const showInitial = !isEncrypting && !isDecrypting;

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      
      {/* Encryption Flow */}
      {isEncrypting && (
        <div style={{ ...styles.flexCenter, width: '100%' }}>
          {/* Plaintext to ASCII */}
          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate="visible"
            variants={stageVariants}
          >
            <div style={styles.valueText}>{currentCharacter}</div>
            <div style={styles.label}>Plaintext Character</div>
          </motion.div>
          <div style={styles.arrow}>↓</div>

          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate={currentStep >= 1 ? "visible" : "hidden"}
            variants={stageVariants}
          >
            <div style={styles.valueText}>{message.charCodeAt(message.indexOf(currentCharacter))}</div>
            <div style={styles.label}>ASCII Value</div>
          </motion.div>
          <div style={styles.arrow}>↓</div>

          {/* ASCII to Ciphertext */}
          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate={currentStep >= 2 ? "visible" : "hidden"}
            variants={stageVariants}
          >
            <div style={styles.valueText}>
              <AnimatePresence>
                {currentStep >= 2 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {modPow(message.charCodeAt(message.indexOf(currentCharacter)), keys.publicKey.e, keys.publicKey.n)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div style={styles.label}>
              C = {message.charCodeAt(message.indexOf(currentCharacter))}^{keys.publicKey.e} mod {keys.publicKey.n}
            </div>
          </motion.div>
          <div style={styles.arrow}>↓</div>

          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate={currentStep >= 3 ? "visible" : "hidden"}
            variants={stageVariants}
          >
            <div style={styles.valueText}>
              <AnimatePresence>
                {currentStep >= 3 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {modPow(message.charCodeAt(message.indexOf(currentCharacter)), keys.publicKey.e, keys.publicKey.n)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div style={styles.label}>Ciphertext (Number)</div>
          </motion.div>
        </div>
      )}

      {/* Decryption Flow */}
      {isDecrypting && (
        <div style={{ ...styles.flexCenter, width: '100%' }}>
          {/* Ciphertext to ASCII */}
          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate="visible"
            variants={stageVariants}
          >
            <div style={styles.valueText}>{currentCharacter}</div>
            <div style={styles.label}>Ciphertext Number</div>
          </motion.div>
          <div style={styles.arrow}>↓</div>

          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate={currentStep >= 1 ? "visible" : "hidden"}
            variants={stageVariants}
          >
            <div style={styles.valueText}>
              <AnimatePresence>
                {currentStep >= 1 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {modPow(currentCharacter, keys.privateKey.d, keys.privateKey.n)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div style={styles.label}>
              M = {currentCharacter}^{keys.privateKey.d} mod {keys.privateKey.n}
            </div>
          </motion.div>
          <div style={styles.arrow}>↓</div>

          {/* ASCII to Plaintext */}
          <motion.div
            style={styles.stageCard}
            initial="hidden"
            animate={currentStep >= 2 ? "visible" : "hidden"}
            variants={stageVariants}
          >
            <div style={styles.valueText}>
              <AnimatePresence>
                {currentStep >= 2 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {String.fromCharCode(modPow(currentCharacter, keys.privateKey.d, keys.privateKey.n))}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div style={styles.label}>Decrypted Character</div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('simulation');
  const [step, setStep] = useState(1);
  const [animationState, setAnimationState] = useState('idle');
  const [animationIndex, setAnimationIndex] = useState(-1);
  const router = useRouter(); 

  // RSA Parameters
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [message, setMessage] = useState('hello');
  const [keys, setKeys] = useState(null);
  const [encryptedMessage, setEncryptedMessage] = useState([]);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [showDetails, setShowDetails] = useState({});

  // CSS-in-JS styles based on user's provided object
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Inter, Arial, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    title: {
      color: '#0056b3',
      fontSize: '2rem',
      marginBottom: '20px',
      fontWeight: 'bold'
    },
    tabContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px'
    },
    tab: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s'
    },
    activeTab: {
      backgroundColor: '#0056b3',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: '#f9f9f9',
      color: '#0056b3',
      border: '1px solid #0056b3'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      padding: '30px',
      marginBottom: '20px'
    },
    sectionTitle: {
      color: '#0056b3',
      fontSize: '1.5rem',
      marginBottom: '20px',
      fontWeight: 'bold'
    },
    subsectionTitle: {
      color: '#007bff',
      fontSize: '1.2rem',
      marginBottom: '15px',
      fontWeight: '600'
    },
    inputContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      marginBottom: '5px',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#0056b3',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.3s'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    resultGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    resultCard: {
      backgroundColor: '#f9f9f9',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      marginBottom: '15px'
    },
    stepContainer: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px'
    },
    stepHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    stepButton: {
      padding: '5px 10px',
      fontSize: '12px',
      backgroundColor: '#0056b3',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    detailsContainer: {
      marginTop: '15px',
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    },
    errorText: {
      color: '#ff0000',
      fontSize: '12px',
      marginTop: '2px'
    },
    mathSteps: {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#333',
      lineHeight: '1.4'
    },
    // Flexbox for horizontal alignment
    flexHorizontal: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    // Vertical alignment for steps
    flexVertical: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    }
  };

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

    const animateChar = (index) => {
      if (index < messageNumbers.length) {
        setAnimationIndex(index);
        setTimeout(() => animateChar(index + 1), 3000); // 3-second delay between characters
      } else {
        setAnimationState('idle');
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

    const animateChar = (index) => {
      if (index < encryptedMessage.length) {
        setAnimationIndex(index);
        setTimeout(() => animateChar(index + 1), 3000); // 3-second delay between characters
      } else {
        setAnimationState('idle');
      }
    };
    animateChar(0);
  };
  
  const renderTab = (id, label) => (
    <button
      key={id}
      onClick={() => {
        setActiveTab(id);
        setStep(1); // Reset step when changing tabs
        setAnimationState('idle');
        setAnimationIndex(-1);
      }}
      style={{
        ...styles.tab,
        ...(activeTab === id ? styles.activeTab : styles.inactiveTab)
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>RSA — Theory • Example • Simulation</h1>
        
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          {renderTab('theory', 'Theory')}
          {renderTab('example', 'Example')}
          {renderTab('simulation', 'Simulation')}
        </div>
      </div>

      <div style={styles.content}>
        {/* Theory Tab */}
{activeTab === 'theory' && (
  <div style={styles.card}>


    <h2 style={styles.sectionTitle}>RSA Algorithm Theory</h2>

    {/* Introduction */}
    <div style={styles.resultCard}>
      <h3 style={styles.subsectionTitle}>Introduction</h3>
      <p>
        The RSA algorithm is a foundational public-key cryptography system that
        enables secure communication without requiring a pre-shared secret key.
        It is a cornerstone of modern digital security and has been widely used
        for secure data transmission, digital signatures, and authentication
        since its invention.
      </p>
    </div>

    {/* Origin Story */}
    <div style={styles.resultCard}>
      <h3 style={styles.subsectionTitle}>Origin Story</h3>
      <p>
        The RSA algorithm was invented in 1977 by Ron Rivest, Adi Shamir, and
        Leonard Adleman, who lent their initials to its name. The development of
        RSA was revolutionary because it introduced the concept of public-key
        cryptography, fundamentally solving the key distribution problem that
        had long been a major challenge in symmetric cryptography.
      </p>
    </div>

    {/* Core Idea */}
    <div style={styles.resultCard}>
      <h3 style={styles.subsectionTitle}>Core Idea</h3>
      <p>
        The security of RSA is based on the computational difficulty of integer
        factorization, specifically the difficulty of factoring the product of
        two very large prime numbers. It is easy to multiply two primes but
        infeasible to reverse the process. This one-way function forms the
        basis of RSA’s key pair.
      </p>
    </div>

    {/* Technical Blueprint */}
    <div style={styles.resultCard}>
      <h3 style={styles.subsectionTitle}>Technical Blueprint</h3>
      <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
        <li>
          <strong>Key Generation:</strong> Choose primes p, q → n = p × q →
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
    <div style={styles.resultCard}>
      <h3 style={styles.subsectionTitle}>Security Scorecard</h3>
      <p>
        The strength of RSA depends on key size. While 512-bit keys are now
        insecure, modern systems use 2048-bit or larger keys. RSA can be
        vulnerable to side-channel attacks (timing, power analysis), and weak
        random number generation may compromise security.
      </p>
    </div>

    {/* Real-World Usage */}
    <div style={styles.resultCard}>
      <h3 style={styles.subsectionTitle}>Real-World Usage</h3>
      <p>
        RSA is widely used in digital security: HTTPS, TLS/SSL handshakes,
        secure email, digital signatures, and secure key exchange. Its elegant
        solution to key distribution enabled the secure internet we rely on
        today.
      </p>
    </div>
        {/* Back Button */}
    <button
       onClick={() => router.push("/")}
  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
>
  ⬅ Back to Home
</button>
  </div>
)}

        {/* Example Tab */}
        {activeTab === 'example' && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>RSA Example</h2>
            
            <div style={styles.resultGrid}>
              <div style={styles.resultCard}>
                <h3 style={styles.subsectionTitle}>Step 1: Choose Primes</h3>
                <p>p = 61, q = 53</p>
              </div>
              
              <div style={styles.resultCard}>
                <h3 style={styles.subsectionTitle}>Step 2: Calculate n</h3>
                <p>n = 61 × 53 = 3233</p>
              </div>
              
              <div style={styles.resultCard}>
                <h3 style={styles.subsectionTitle}>Step 3: Calculate φ(n)</h3>
                <p>φ(n) = (61-1) × (53-1) = 60 × 52 = 3120</p>
              </div>
              
              <div style={styles.resultCard}>
                <h3 style={styles.subsectionTitle}>Step 4: Choose e</h3>
                <p>e = 17 (gcd(17, 3120) = 1)</p>
              </div>
              
              <div style={styles.resultCard}>
                <h3 style={styles.subsectionTitle}>Step 5: Calculate d</h3>
                <p>d = 2753 (17 × 2753 ≡ 1 mod 3120)</p>
              </div>
              
              <div style={styles.resultCard}>
                <h3 style={styles.subsectionTitle}>Keys Generated</h3>
                <p>Public: (17, 3233)</p>
                <p>Private: (2753, 3233)</p>
              </div>
            </div>
            {/* Back Button */}
    <button
       onClick={() => router.push("/")}
  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
>
  ⬅ Back to Home
</button>

          </div>
        
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div>
            {/* Controls */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Simulation Controls</h2>
              
              <div style={styles.inputContainer}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Prime p</label>
                  <input
                    type="number"
                    value={p}
                    onChange={(e) => setP(parseInt(e.target.value))}
                    style={styles.input}
                  />
                  {!isPrime(p) && <span style={styles.errorText}>Not prime</span>}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Prime q</label>
                  <input
                    type="number"
                    value={q}
                    onChange={(e) => setQ(parseInt(e.target.value))}
                    style={styles.input}
                  />
                  {!isPrime(q) && <span style={styles.errorText}>Not prime</span>}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Message</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>&nbsp;</label>
                  <button 
                    onClick={handleEncryption} 
                    style={{
                      ...styles.button,
                      ...((!isPrime(p) || !isPrime(q) || p === q) && styles.buttonDisabled)
                    }}
                    disabled={!isPrime(p) || !isPrime(q) || p === q || animationState !== 'idle'}
                  >
                    Encrypt
                  </button>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>&nbsp;</label>
                  <button 
                    onClick={handleDecryption} 
                    style={{
                      ...styles.button,
                      ...((encryptedMessage.length === 0) && styles.buttonDisabled)
                    }}
                    disabled={encryptedMessage.length === 0 || animationState !== 'idle'}
                  >
                    Decrypt
                  </button>
                </div>
              </div>
              
              {/* Display Keys */}
              {keys && (
                <div style={styles.resultGrid}>
                  <div style={styles.resultCard}>
                    <h3 style={styles.subsectionTitle}>Public Key (e, n)</h3>
                    <p>({keys.publicKey.e}, {keys.publicKey.n})</p>
                  </div>
                  <div style={styles.resultCard}>
                    <h3 style={styles.subsectionTitle}>Private Key (d, n)</h3>
                    <p>({keys.privateKey.d}, {keys.privateKey.n})</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Animated Simulation Steps */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Animated Simulation</h2>
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
                    currentStep={animationState === 'encrypting' ? animationIndex : (animationState === 'decrypting' ? animationIndex : -1)}
                    currentCharacter={animationState === 'encrypting' ? message[animationIndex] : encryptedMessage[animationIndex]}
                  />
                )}
              </div>
              
            </div>

            {/* Final Results */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Results</h2>
              <div style={styles.resultGrid}>
                <div style={styles.resultCard}>
                  <h3 style={styles.subsectionTitle}>Plaintext</h3>
                  <p style={{fontFamily: 'monospace'}}>{message}</p>
                </div>
                <div style={styles.resultCard}>
                  <h3 style={styles.subsectionTitle}>Ciphertext</h3>
                  <p style={{fontFamily: 'monospace'}}>{encryptedMessage.join(', ')}</p>
                </div>
                <div style={styles.resultCard}>
                  <h3 style={styles.subsectionTitle}>Decrypted Text</h3>
                  <p style={{fontFamily: 'monospace'}}>{decryptedMessage}</p>
                </div>
              </div>
            </div>
            {/* Back Button */}
                <button
       onClick={() => router.push("/")}
  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
>
  ⬅ Back to Home
</button>

          </div>
          
        )}
        
      </div>
      
    </div>
  );
}

export default App;
