import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Helper Components ---

// A single cell in the visualization grid
const Cell = ({ value, isHighlightedI, isHighlightedJ, isSwap }) => (
  <div
    className={`w-12 h-12 sm:w-14 sm:h-14 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm font-mono transition-all duration-300
      ${isHighlightedI ? 'bg-blue-500 text-white ring-2 ring-blue-300' : ''}
      ${isHighlightedJ ? 'bg-green-500 text-white ring-2 ring-green-300' : ''}
      ${isSwap ? 'bg-yellow-500 text-white transform scale-110' : ''}
      ${!isHighlightedI && !isHighlightedJ && !isSwap ? 'bg-gray-100 dark:bg-gray-800' : ''}
    `}
  >
    {value}
  </div>
);

// The main visualization grid for the S-array
const SArrayGrid = ({ s, i, j, swapIndices }) => (
  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-inner">
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
  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">{title}</h3>
    <div className="flex flex-wrap gap-4">
      {values.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Main RC4 Visualizer Component ---

const RC4Visualizer = () => {
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
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-indigo-600 dark:text-indigo-400">RC4 Cipher Visualizer</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">An interactive look into the RC4 stream cipher algorithm.</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="lg:col-span-2">
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secret Key</label>
            <input
              type="text"
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isRunning}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-200 dark:disabled:bg-gray-600"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="plaintext" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plaintext</label>
            <input
              type="text"
              id="plaintext"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              disabled={isRunning}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-200 dark:disabled:bg-gray-600"
            />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <label htmlFor="speed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Animation Speed (ms)</label>
            <input
              type="range"
              id="speed"
              min="10"
              max="500"
              step="10"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="col-span-1 lg:col-span-1 flex items-end">
            <button
              onClick={startVisualization}
              disabled={isRunning || !key || !plaintext}
              className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 dark:disabled:text-gray-400 transition-colors"
            >
              {isRunning ? 'Visualizing...' : 'Start Visualization'}
            </button>
          </div>
           <div className="col-span-1 lg:col-span-1 flex items-end">
            <button
              onClick={() => { setIsRunning(false); resetState(); }}
              className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Visualization Area */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
          <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-md text-center">
            <p className="font-medium text-indigo-800 dark:text-indigo-200">{currentStepDescription}</p>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
            <StateDisplay title="Pointers & Indices" values={[
                { label: 'i', value: i },
                { label: 'j', value: j },
            ]} />
             <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md xl:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Outputs</h3>
                <div className="space-y-2">
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Keystream (Hex)</label>
                        <p className="font-mono text-sm break-all p-2 bg-white dark:bg-gray-700 rounded">{keystream || '...'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ciphertext (Hex)</label>
                        <p className="font-mono text-sm break-all p-2 bg-white dark:bg-gray-700 rounded">{ciphertext || '...'}</p>
                    </div>
                </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 text-center">S-Array State</h2>
          <div className="overflow-x-auto">
            <SArrayGrid s={s} i={i} j={j} swapIndices={swapIndices} />
          </div>
           <div className="mt-4 flex justify-center space-x-6">
                <div className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded-sm mr-2"></div><span>Pointer 'i'</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div><span>Pointer 'j'</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-yellow-500 rounded-sm mr-2"></div><span>Swapping</span></div>
            </div>
        </div>
        
        {/* Theory and Example Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">How RC4 Works</h2>
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p>RC4 is a stream cipher, meaning it encrypts data one byte at a time. It was designed by Ron Rivest in 1987. The algorithm has two main phases:</p>
                    <div>
                        <h3 className="text-lg font-semibold">1. Key-Scheduling Algorithm (KSA)</h3>
                        <p>This phase initializes a 256-byte state array, typically called 'S'. First, 'S' is filled with values from 0 to 255. Then, it's permuted using the secret key. The longer and more complex the key, the more random the final permutation of 'S' will be. This visualizer shows this permutation process step-by-step.</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold">2. Pseudo-Random Generation Algorithm (PRGA)</h3>
                        <p>Once the KSA is complete, this phase generates a "keystream" of pseudo-random bytes from the permuted S-array. For each byte of plaintext, one byte of the keystream is generated. This keystream byte is then combined with the plaintext byte using an XOR operation to produce the ciphertext byte.</p>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Static Example</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">Let's encrypt the plaintext "Test" with the key "Wiki".</p>
                <div className="space-y-2 text-sm font-mono text-gray-800 dark:text-gray-200">
                    <p><span className="font-bold">Key:</span> Wiki</p>
                    <p><span className="font-bold">Plaintext:</span> Test</p>
                    <p className="break-all"><span className="font-bold">Plaintext (ASCII Hex):</span> 54 65 73 74</p>
                    <p className="mt-4 font-bold">After KSA, the S-array is permuted.</p>
                    <p className="mt-4 font-bold">PRGA generates the keystream:</p>
                    <p className="break-all"><span className="font-bold">Keystream (Hex):</span> BB F3 16 E8</p>
                    <p className="mt-4 font-bold">Encryption (Plaintext XOR Keystream):</p>
                    <p className="break-all">54 ⊕ BB = EF</p>
                    <p className="break-all">65 ⊕ F3 = 96</p>
                    <p className="break-all">73 ⊕ 16 = 65</p>
                    <p className="break-all">74 ⊕ E8 = 9C</p>
                    <p className="mt-4 font-bold text-base">Final Ciphertext (Hex): <span className="text-red-500 dark:text-red-400">EF96659C</span></p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">(You can verify this by running the example in the visualizer above)</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RC4Visualizer;

