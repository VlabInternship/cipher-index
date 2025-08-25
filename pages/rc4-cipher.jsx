import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookOpen, Play, Code } from 'lucide-react';
// --- Helper Components ---

// A single cell in the visualization grid
const Cell = ({ value, isHighlightedI, isHighlightedJ, isSwap }) => (
  <div
    className={`w-12 h-12 s            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-gray-800" /> Introduction
              </h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  RC4, or Rivest Cipher 4, is a stream cipher that was once one of the most widely used encryption algorithms in the world. 
                  It is known for its remarkable simplicity and speed, which made it ideal for many applications that required efficient 
                  encryption and decryption of large amounts of data.
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
              <div className="space-y-4 text-gray-800">order border-chacha-accent/30 flex items-center justify-center text-sm font-mono transit            <d            <div className="bg-chacha-accent/5 rounded-lg p-6">
                                </div>
                </div>
              </div>
            </div>
          </div>
        </div>)}assName="text-2xl font-bold mb-4 text-chacha-primary">Real-World Usage</h2> className="bg-chacha-accent/5 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-chacha-primary">Security Scorecard</h2>n-all duration-300
      ${isHighlightedI ? 'bg-chacha-accent text-chacha-alt ring-2 ring-chacha-accent/30' : ''}
      ${isHighlightedJ ? 'bg-chacha-primary text-chacha-alt ring-2 ring-chacha-primary/30' : ''}
      ${isSwap ? 'bg-chacha-accent/70 text-chacha-alt transform scale-110' : ''}
      ${!isHighlightedI && !isHighlightedJ && !isSwap ? 'bg-chacha-bg' : ''}
    `}
  >
    {value}
  </div>
);

// The main visualization grid for the S-array
const SArrayGrid = ({ s, i, j, swapIndices }) => (
  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 p-2 bg-chacha-bg rounded-lg shadow-inner">
    {s.map((value, index) => (
      <Cell
        key={index}
        value={value}
        isHighlightedI={index === i}
        isHighlightedJ={index === j}
        isSwap={swapIndices && (index === swapIndices.i || index === swapIndices.j)}
      />
    ))}
  </div>
);

// Component to display variables and pointers
const StateDisplay = ({ title, values }) => (
  <div className="bg-chacha-alt p-4 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-chacha-accent mb-3 border-b border-chacha-accent/20 pb-2">{title}</h3>
    <div className="flex flex-wrap gap-4">
      {values.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-sm text-chacha-accent">{label}</span>
          <span className="text-2xl font-bold font-mono text-chacha-primary">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Main RC4 Visualizer Component ---

const RC4Visualizer = () => {
  const [activeTab, setActiveTab] = useState('theory');
  const [key, setKey] = useState('Key');
  const [plaintext, setPlaintext] = useState('Plaintext');
  const [s, setS] = useState(Array.from({ length: 256 }, (_, i) => i));
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [keystream, setKeystream] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [animationStep, setAnimationStep] = useState('idle'); // ksa_init, ksa_perm, prga, done
  const [animationSpeed, setAnimationSpeed] = useState(50); // in ms
  const [swapIndices, setSwapIndices] = useState(null);

  const resetState = useCallback(() => {
    setS(Array.from({ length: 256 }, (_, k) => k));
    setI(0);
    setJ(0);
    setKeystream('');
    setCiphertext('');
    setAnimationStep('idle');
    setSwapIndices(null);
  }, []);

  const startVisualization = () => {
    if (isRunning) return;
    setIsRunning(true);
    resetState();
    setAnimationStep('ksa_init');
  };

  // The core animation logic using useEffect
  useEffect(() => {
    if (!isRunning) return;

    const timeout = setTimeout(() => {
      // --- 1. Key-Scheduling Algorithm (KSA) - Initialization ---
      if (animationStep === 'ksa_init') {
        const initialS = Array.from({ length: 256 }, (_, k) => k);
        setS(initialS);
        const k = Array.from({ length: 256 }, (_, idx) => key.charCodeAt(idx % key.length));
        setAnimationStep('ksa_perm');
        setI(0);
        setJ(0);
      }
      
      // --- 2. Key-Scheduling Algorithm (KSA) - Permutation ---
      else if (animationStep === 'ksa_perm') {
        if (i < 256) {
          setS(prevS => {
            const newS = [...prevS];
            const keyCharCode = key.charCodeAt(i % key.length);
            const newJ = (j + newS[i] + keyCharCode) % 256;
            
            // Highlight swap
            setSwapIndices({ i, j: newJ });
            
            // Perform swap after a short delay for visual effect
            setTimeout(() => {
                [newS[i], newS[newJ]] = [newS[newJ], newS[i]]; // Swap
                setS(newS);
                setJ(newJ);
                setI(i + 1);
                setSwapIndices(null);
            }, animationSpeed / 2);

            return newS; // return previous state while waiting for swap
          });
        } else {
          setAnimationStep('prga');
          setI(0);
          setJ(0);
        }
      }
      
      // --- 3. Pseudo-Random Generation Algorithm (PRGA) & Encryption ---
      else if (animationStep === 'prga') {
        if (i < plaintext.length) {
           setS(prevS => {
            const newS = [...prevS];
            const newI = (i + 1) % 256;
            const newJ = (j + newS[newI]) % 256;

            // Highlight swap
            setSwapIndices({ i: newI, j: newJ });

            // Perform swap and encryption after a short delay
            setTimeout(() => {
                [newS[newI], newS[newJ]] = [newS[newJ], newS[newI]];
                const t = (newS[newI] + newS[newJ]) % 256;
                const keystreamByte = newS[t];
                
                const plaintextByte = plaintext.charCodeAt(i);
                const ciphertextByte = plaintextByte ^ keystreamByte;

                setS(newS);
                setI(newI);
                setJ(newJ);
                setKeystream(prev => prev + keystreamByte.toString(16).padStart(2, '0').toUpperCase());
                setCiphertext(prev => prev + ciphertextByte.toString(16).padStart(2, '0').toUpperCase());
                setSwapIndices(null);
            }, animationSpeed / 2);
            
            return newS; // return previous state while waiting
          });
        } else {
          setAnimationStep('done');
          setIsRunning(false);
        }
      }
    }, animationSpeed);

    return () => clearTimeout(timeout);
  }, [isRunning, animationStep, i, j, key, plaintext, resetState, animationSpeed]);

  const currentStepDescription = useMemo(() => {
    switch (animationStep) {
      case 'idle': return 'Ready. Enter a key and plaintext, then press Start.';
      case 'ksa_init': return 'Step 1: Key-Scheduling Algorithm (KSA) - Initializing S-array from 0 to 255.';
      case 'ksa_perm': return `Step 1: KSA - Permuting S-array. j = (j + S[i] + key[i]) % 256. Swapping S[i] and S[j]. (i=${i})`;
      case 'prga': return `Step 2: Pseudo-Random Generation Algorithm (PRGA) & Encryption. Generating keystream and XORing with plaintext. (Character ${i+1}/${plaintext.length})`;
      case 'done': return 'Encryption Complete!';
      default: return '';
    }
  }, [animationStep, i, plaintext.length]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-chacha-bg min-h-screen text-chacha-accent">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">RC4 Cipher </h1>
          <p className="text-lg text-gray-600 mb-8">The Once-Ubiquitous Stream Cipher</p>
        </div>

        {/* Navbar */}
        <nav className="flex justify-center mb-6">
          <div className="bg-chacha-accent/10 rounded-lg p-1 flex space-x-1 shadow-md">
            {['theory', 'example', 'cipher'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-md font-medium transition-all text-sm md:text-base flex items-center gap-2 ${activeTab === tab ? 'bg-chacha-accent text-chacha-alt shadow-lg' : 'text-chacha-accent hover:text-chacha-alt hover:bg-chacha-accent/20'}`}
              >
                {tab === "theory" && <BookOpen className="w-4 h-4 md:w-5 md:h-5" />}
                {tab === "example" && <Play className="w-4 h-4 md:w-5 md:h-5" />}
                {tab === "cipher" && <Code className="w-4 h-4 md:w-5 md:h-5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        {/* Conditional tab panels */}
        {activeTab === 'cipher' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-chacha-alt rounded-lg shadow-lg">
              <div className="lg:col-span-2">
                <label htmlFor="key" className="block text-sm font-medium text-chacha-accent">Secret Key</label>
                <input
                  type="text"
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  disabled={isRunning}
                  className="mt-1 block w-full px-3 py-2 bg-chacha-bg border border-chacha-accent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-chacha-primary focus:border-chacha-primary sm:text-sm disabled:bg-chacha-alt"
                />
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="plaintext" className="block text-sm font-medium text-chacha-accent">Plaintext</label>
                <input
                  type="text"
                  id="plaintext"
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  disabled={isRunning}
                  className="mt-1 block w-full px-3 py-2 bg-chacha-bg border border-chacha-accent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-chacha-primary focus:border-chacha-primary sm:text-sm disabled:bg-chacha-alt"
                />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <label htmlFor="speed" className="block text-sm font-medium text-chacha-accent">Animation Speed (ms)</label>
                <input
                  type="range"
                  id="speed"
                  min="10"
                  max="500"
                  step="10"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full h-2 bg-chacha-accent/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="col-span-1 lg:col-span-1 flex items-end">
                <button
                  onClick={startVisualization}
                  disabled={isRunning || !key || !plaintext}
                  className="w-full bg-chacha-primary text-chacha-alt font-bold py-2 px-4 rounded-md hover:bg-chacha-primary/90 focus:outline-none focus:ring-2 focus:ring-chacha-primary disabled:bg-chacha-accent/30 transition-colors"
                >
                  {isRunning ? 'Visualizing...' : 'Start Visualization'}
                </button>
              </div>
              <div className="col-span-1 lg:col-span-1 flex items-end">
                <button
                  onClick={() => { setIsRunning(false); resetState(); }}
                  className="w-full bg-chacha-accent/20 text-chacha-accent font-bold py-2 px-4 rounded-md hover:bg-chacha-accent/30 focus:outline-none focus:ring-2 focus:ring-chacha-accent transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-chacha-alt p-4 rounded-lg shadow-lg">
              <div className="mb-4 p-3 bg-chacha-accent/5 rounded-md text-center">
                <p className="font-medium text-chacha-accent">{currentStepDescription}</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                <StateDisplay title="Pointers & Indices" values={[
                  { label: 'i', value: i },
                  { label: 'j', value: j },
                ]} />
                <div className="bg-chacha-alt p-4 rounded-lg shadow-md xl:col-span-2">
                  <h3 className="text-lg font-semibold text-chacha-accent mb-2">Outputs</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-chacha-accent">Keystream (Hex)</label>
                      <p className="font-mono text-sm break-all p-2 bg-chacha-bg rounded">{keystream || '...'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-chacha-accent">Ciphertext (Hex)</label>
                      <p className="font-mono text-sm break-all p-2 bg-chacha-bg rounded">{ciphertext || '...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">S-Array State</h2>
              <div className="overflow-x-auto">
                <SArrayGrid s={s} i={i} j={j} swapIndices={swapIndices} />
              </div>
              <div className="mt-4 flex justify-center space-x-6">
                <div className="flex items-center"><div className="w-4 h-4 bg-chacha-accent rounded-sm mr-2"></div><span>Pointer 'i'</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-chacha-primary rounded-sm mr-2"></div><span>Pointer 'j'</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-chacha-accent/70 rounded-sm mr-2"></div><span>Swapping</span></div>
              </div>
            </div>
          </>
        )}
        
        {/* Theory and Example tabs */}
        {activeTab === 'theory' && (
        <div className="mt-8">
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-gray-800" /> Introduction
              </h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  RC4, or Rivest Cipher 4, is a stream cipher that was once one of the most widely used encryption algorithms in the world. 
                  It is known for its remarkable simplicity and speed, which made it ideal for many applications that required efficient 
                  encryption and decryption of large amounts of data.
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  RC4 was developed by Ron Rivest in 1987 while he was working for RSA Security. The algorithm was initially a trade secret, 
                  and its rules were intended to be kept confidential. However, in 1994, an anonymous person posted an intricate description 
                  of the cipher's design on a public mailing list, revealing its inner workings to the world.
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  The fundamental concept behind RC4 is to generate a pseudo-random stream of bits, known as a keystream. This keystream 
                  is then combined with the plaintext using a simple bitwise XOR operation to produce the ciphertext. Decryption is the 
                  exact same process, as XORing the ciphertext with the same keystream restores the original plaintext. This design mimics 
                  the one-time pad but relies on a pseudo-random keystream rather than a truly random one.
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Technical Blueprint</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  RC4's operation is based on a secret internal state consisting of two parts: a permutation of all 256 possible bytes 
                  in an array, denoted as S, and two 8-bit index pointers, i and j. The process has two distinct phases:
                </p>
                <div className="ml-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Key-Scheduling Algorithm (KSA):</h3>
                    <p>
                      This algorithm is used to initialize the S array. The array is first initialized to an identity permutation 
                      (where S[i] = i). It is then processed through 256 iterations, mixing in bytes from the secret key to create 
                      a pseudo-random permutation.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Pseudo-Random Generation Algorithm (PRGA):</h3>
                    <p>
                      After the KSA is complete, the PRGA generates the keystream byte by byte. In each step, the index pointers i 
                      and j are updated, and the S array is permuted. A value is then selected from the S array based on the values 
                      of i and j to produce the keystream byte.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  Although fast and simple to implement, the public exposure of RC4's design revealed significant security flaws. 
                  The cipher is particularly vulnerable if the same key is used repeatedly, as this can lead to predictable keystream 
                  bits and allow an attacker to easily compromise the security of all messages encrypted with that key. Furthermore, 
                  several attacks have been developed that can distinguish the output of RC4 from a truly random sequence, and its 
                  use is now explicitly banned in some security standards.
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  RC4 was once a workhorse for many protocols, including SSL/TLS for web security and WEP for wireless security. 
                  However, due to its known vulnerabilities, it has been largely deprecated in favor of more robust and modern 
                  algorithms like AES and ChaCha20. The history of RC4 serves as a cautionary tale about the dangers of security 
                  through obscurity and underscores the critical importance of public, peer-reviewed cryptographic design.
                </p>
              </div>
            </div>
          </div>
        </div>)}

        {activeTab === 'example' && (
        <div className="mt-8">
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Solved Example: RC4</h2>
            <div className="space-y-4 text-gray-800">
              <p className="mb-4">
                The provided sources offer a simplified example of RC4 operating on 3-bit chunks instead of bytes. 
                This conceptual walkthrough demonstrates the core logic of the KSA and PRGA.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-800 mb-3">Example: Simplified RC4 with 3-bit chunks</h3>
                <div className="space-y-2 font-mono text-sm">
                  <p><strong>Key:</strong> [1 2 3 6] (a 4×3-bit key)</p>
                  <p><strong>Plaintext:</strong> [1 2 2 2] (a stream of 3-bit chunks)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Key-Scheduling Algorithm (KSA)</h3>
                  <div className="ml-4 space-y-2">
                    <p>
                      <strong>Initialization:</strong> The state vector S is initialized to the identity permutation: 
                      S = [0 1 2 3 4 5 6 7]. The temporary vector T is filled with the key, repeated as necessary: 
                      T = [1 2 3 6 1 2 3 6].
                    </p>
                    <p>
                      <strong>Initial Permutation:</strong> The S array is permuted. The source material walks through 
                      8 iterations to produce the final S state: S = [2 3 7 4 6 0 1 5].
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: Pseudo-Random Generation Algorithm (PRGA)</h3>
                  <p className="mb-3">The PRGA now generates a keystream, one 3-bit chunk at a time, for encryption.</p>
                  
                  <div className="ml-4 space-y-3">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-semibold text-gray-800 mb-2">Iteration 1:</h4>
                      <div className="space-y-1 text-sm">
                        <p>i = 1, j = 3.</p>
                        <p>S is swapped, resulting in S = [2 4 7 3 6 0 1 5].</p>
                        <p>A value t is computed, and a keystream value k is selected from S[t]. The first keystream value is k = S = 5.</p>
                        <p>The first plaintext chunk 1 is XORed with the keystream chunk 5: 1⊕5=4. The first ciphertext chunk is 4.</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-semibold text-gray-800 mb-2">Iteration 2:</h4>
                      <div className="space-y-1 text-sm">
                        <p>i = 2, j = 2.</p>
                        <p>S is swapped (or remains the same if the indices are equal), and S remains [2 4 7 3 6 0 1 5].</p>
                        <p>A keystream value k is generated. The second keystream value is k = S = 1.</p>
                        <p>The second plaintext chunk 2 is XORed with 1: 2⊕1=3. The second ciphertext chunk is 3.</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4">
                    The process continues for the remaining plaintext chunks, generating the ciphertext [4 3 2 3]. 
                    Decryption reverses this process by using the same keystream and XORing it with the ciphertext.
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
};


export default RC4Visualizer;

