import React, { useState, useEffect } from 'react';
import { Lock, Unlock, BookOpen, Code, Play, Pause, RotateCcw } from 'lucide-react';


const SpeckCipherVisualizer = () => {
  // Constants for Speck 32/64
  const WORD_SIZE = 16;
  const KEY_WORDS = 4; // m = 4 for 64-bit key
  const ROUNDS = 22;
  const ALPHA = 7;
  const BETA = 2;
  const MASK = (1 << WORD_SIZE) - 1;


  // Updated color scheme for the UI
  const colors = {
    background: '#f5f5f5',
    primary: '#0056b3',
    primaryLight: '#007bff',
    secondary: '#f9f9f9',
    accentGreen: '#28a745',
    accentYellow: '#ffc107',
    accentRed: '#dc3545',
    textDark: '#212529',
    textLight: '#6c757d'
  };


  // State management
  const [plaintext, setPlaintext] = useState('6574694C'); // Default: 'Lite'
  const [key, setKey] = useState('0F0E0D0C0B0A0908');
  const [ciphertext, setCiphertext] = useState('');
  const [activeMode, setActiveMode] = useState('encrypt');
  const [currentView, setCurrentView] = useState('theory');
  const [showViz, setShowViz] = useState(false);
  const [vizStep, setVizStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [stepData, setStepData] = useState([]);


  // --- Speck Cipher Logic ---
  const ROTR = (x, n) => ((x >>> n) | (x << (WORD_SIZE - n))) & MASK;
  const ROTL = (x, n) => ((x << n) | (x >>> (WORD_SIZE - n))) & MASK;
  const toHex = (n) => n.toString(16).padStart(4, '0').toUpperCase();


  const generateKeyScheduleWithSteps = (masterKey) => {
    const keySteps = [];
    const roundKeys = [masterKey[0]];
    const l = [...masterKey.slice(1)]; // l_0, l_1, l_2


    keySteps.push({ action: 'key_start', note: 'Key Schedule Generation Started'});
   
    for (let i = 0; i < ROUNDS - 1; i++) {
        const l_i = l[i];
        const k_i = roundKeys[i];
       
        const rot_l = ROTR(l_i, ALPHA);
        const add_k = (k_i + rot_l) & MASK;
        const l_new = add_k ^ i;
       
        const rot_k = ROTL(k_i, BETA);
        const k_new = rot_k ^ l_new;


        keySteps.push({
            action: 'key_expansion_round',
            note: `Generating Round Key k${i + 1}`,
            round: i,
            calc: [
                `l' = ROTR(l[${i}], ${ALPHA}) = ROTR(${toHex(l_i)}, ${ALPHA}) = ${toHex(rot_l)}`,
                `l'' = k[${i}] + l' = ${toHex(k_i)} + ${toHex(rot_l)} = ${toHex(add_k)}`,
                `new l-word = l'' ⊕ i = ${toHex(add_k)} ⊕ ${i} = ${toHex(l_new)}`,
                `k' = ROTL(k[${i}], ${BETA}) = ROTL(${toHex(k_i)}, ${BETA}) = ${toHex(rot_k)}`,
                `k[${i+1}] = k' ⊕ new l-word = ${toHex(rot_k)} ⊕ ${toHex(l_new)} = ${toHex(k_new)}`,
            ],
            k_out: toHex(k_new)
        });
        l.push(l_new);
        roundKeys.push(k_new);
    }
    keySteps.push({ action: 'key_expansion_complete', note: 'Key Schedule Complete', roundKeys: roundKeys.map(toHex) });
    return { roundKeys, keySteps };
  };


  const R_func = (x, y, k) => {
    x = (ROTR(x, ALPHA) + y) & MASK;
    x = x ^ k;
    y = ROTL(y, BETA) ^ x;
    return [x, y];
  };


  const R_inv_func = (x, y, k) => {
      y = ROTR(x ^ y, BETA);
      x = x ^ k;
      x = (x - y + (MASK + 1)) & MASK;
      x = ROTL(x, ALPHA);
      return [x, y];
  };
 
  const parseHex = (hexStr, numWords) => {
    const words = [];
    const cleanedHex = hexStr.replace(/[^0-9a-fA-F]/g, '');
    for (let i = 0; i < numWords; i++) {
        const wordHex = cleanedHex.substring(i * 4, (i + 1) * 4);
        if(wordHex) words.push(parseInt(wordHex, 16));
    }
    return words;
  };


  // --- Detailed Visualization Step Builder ---
  const buildCipherSteps = (pt, k_str, shouldEncrypt = true) => {
    const ptWords = parseHex(pt, 2);
    const keyWords = parseHex(k_str, KEY_WORDS);


    if (ptWords.length < 2 || keyWords.length < KEY_WORDS) return [];
   
    let stepsLog = [];
    stepsLog.push({ action: 'init', note: 'Initialization', x: toHex(ptWords[1]), y: toHex(ptWords[0]), key: keyWords.map(toHex) });
   
    const { roundKeys, keySteps } = generateKeyScheduleWithSteps(keyWords);
    stepsLog = [...stepsLog, ...keySteps];
   
    // Encryption/Decryption Steps
    let [x, y] = [ptWords[1], ptWords[0]];


    if (shouldEncrypt) {
      for (let i = 0; i < ROUNDS; i++) {
        const [x_out, y_out] = R_func(x, y, roundKeys[i]);
        stepsLog.push({
            action: 'round', note: `Encryption Round ${i}`, round: i,
            x_in: toHex(x), y_in: toHex(y), k_i: toHex(roundKeys[i]),
            calc: [
              `x' = ROTR(x, ${ALPHA}) + y = (ROTR(${toHex(x)}, ${ALPHA}) + ${toHex(y)}) = ${toHex((ROTR(x, ALPHA) + y) & MASK)}`,
              `x_out = x' ⊕ k_${i} = ${toHex((ROTR(x, ALPHA) + y) & MASK)} ⊕ ${toHex(roundKeys[i])} = ${toHex(x_out)}`,
              `y' = ROTL(y, ${BETA}) = ROTL(${toHex(y)}, ${BETA}) = ${toHex(ROTL(y, BETA))}`,
              `y_out = y' ⊕ x_out = ${toHex(ROTL(y, BETA))} ⊕ ${toHex(x_out)} = ${toHex(y_out)}`,
            ],
            x_out: toHex(x_out), y_out: toHex(y_out)
        });
        [x, y] = [x_out, y_out];
      }
    } else {
      for (let i = ROUNDS - 1; i >= 0; i--) {
        const [x_out, y_out] = R_inv_func(x, y, roundKeys[i]);
        stepsLog.push({
            action: 'round_inv', note: `Decryption Round ${i}`, round: i,
            x_in: toHex(x), y_in: toHex(y), k_i: toHex(roundKeys[i]),
            calc: [
              `y' = y ⊕ x = ${toHex(y)} ⊕ ${toHex(x)} = ${toHex(y ^ x)}`,
              `y_out = ROTR(y', ${BETA}) = ROTR(${toHex(y^x)}, ${BETA}) = ${toHex(y_out)}`,
              `x' = x ⊕ k_${i} = ${toHex(x)} ⊕ ${toHex(roundKeys[i])} = ${toHex(x ^ roundKeys[i])}`,
              `x'' = x' - y_out = ${toHex(x ^ roundKeys[i])} - ${toHex(y_out)} = ${toHex(((x ^ roundKeys[i]) - y_out + (MASK + 1)) & MASK)}`,
              `x_out = ROTL(x'', ${ALPHA}) = ROTL(${toHex(((x ^ roundKeys[i]) - y_out + (MASK + 1)) & MASK)}, ${ALPHA}) = ${toHex(x_out)}`,
            ],
            x_out: toHex(x_out), y_out: toHex(y_out)
        });
        [x, y] = [x_out, y_out];
      }
    }
    stepsLog.push({ action: 'complete', note: 'Process Complete', result: toHex(y) + toHex(x) });
    return stepsLog;
  };
 
  const handleCipherAction = () => {
    setShowViz(false);
    const ptWords = parseHex(plaintext, 2);
    const keyWords = parseHex(key, KEY_WORDS);
    if (ptWords.length < 2 || keyWords.length < KEY_WORDS) {
        setCiphertext("Invalid Hex input. Ensure plaintext is 8 hex chars and key is 16.");
        return;
    }
   
    const { roundKeys } = generateKeyScheduleWithSteps(keyWords);
    let [x, y] = [ptWords[1], ptWords[0]];


    if (activeMode === 'encrypt') {
        for (let i = 0; i < ROUNDS; i++) { [x, y] = R_func(x, y, roundKeys[i]); }
    } else {
        for (let i = ROUNDS - 1; i >= 0; i--) { [x, y] = R_inv_func(x, y, roundKeys[i]); }
    }
   
    setCiphertext(`${toHex(y)}${toHex(x)}`);
    startViz();
  };


  const startViz = () => {
    const vizSteps = buildCipherSteps(plaintext, key, activeMode === 'encrypt');
    setStepData(vizSteps);
    setVizStep(0);
    setShowViz(true);
    setAutoPlay(false);
  };
 
  const resetViz = () => { setShowViz(false); setVizStep(0); setAutoPlay(false); setStepData([]); };


  useEffect(() => {
    if (autoPlay && vizStep < stepData.length - 1) {
      const timer = setTimeout(() => setVizStep(prev => prev + 1), 1000);
      return () => clearTimeout(timer);
    } else if (vizStep >= stepData.length - 1) {
      setAutoPlay(false);
    }
  }, [autoPlay, vizStep, stepData.length]);


  const currentStepInfo = stepData[vizStep] || {};


  const VizPanel = () => (
    <div className="rounded-xl shadow-lg p-6 mt-6" style={{ backgroundColor: colors.secondary }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ color: colors.textDark }}>Step-by-Step Visualization</h3>
        <div className="flex gap-2">
            {!showViz ? ( <button onClick={handleCipherAction} disabled={!plaintext || !key} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-white ${!plaintext || !key ? 'bg-gray-400 cursor-not-allowed' : ''}`} style={{ backgroundColor: !plaintext || !key ? undefined : colors.primary }}><Play size={18} /> Start Visualization</button> ) : (
                <>
                    {!autoPlay ? (<button onClick={() => setAutoPlay(true)} className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-white" style={{ backgroundColor: colors.accentGreen }}><Play size={18} /> Play</button> ) : ( <button onClick={() => setAutoPlay(false)} className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-black" style={{ backgroundColor: colors.accentYellow }}><Pause size={18} /> Pause</button>)}
                    <button onClick={resetViz} className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-white" style={{ backgroundColor: colors.accentRed }}><RotateCcw size={18} /> Reset</button>
                </>
            )}
        </div>
      </div>
     
      {showViz && stepData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><span className="text-sm font-medium" style={{ color: colors.textLight }}>Step {vizStep + 1} of {stepData.length}</span><div className="w-full bg-gray-200 rounded-full h-2.5 mx-4"><div className="h-2.5 rounded-full transition-all duration-300" style={{ width: `${((vizStep + 1) / stepData.length) * 100}%`, backgroundColor: colors.primaryLight }}></div></div></div>
          <div className="rounded-lg p-4" style={{ backgroundColor: colors.background }}>
            <h4 className="text-lg font-bold mb-4 text-center" style={{ color: colors.primary }}>{currentStepInfo.note}</h4>
           
            {/* THIS IS THE FIX: Check for specific action types instead of using .includes() */}
            {(currentStepInfo.action === 'round' || currentStepInfo.action === 'round_inv') && (
              <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <h5 className="font-semibold text-center mb-2" style={{color: colors.textDark}}>Input State (Round {currentStepInfo.round})</h5>
                          <div className="flex justify-around font-mono text-center">
                              <div><label className="text-sm font-medium" style={{color: colors.textLight}}>x (Right)</label><div className="p-2 border rounded bg-white">{currentStepInfo.x_in}</div></div>
                              <div><label className="text-sm font-medium" style={{color: colors.textLight}}>y (Left)</label><div className="p-2 border rounded bg-white">{currentStepInfo.y_in}</div></div>
                          </div>
                      </div>
                      <div>
                          <h5 className="font-semibold text-center mb-2" style={{color: colors.textDark}}>Round Key</h5>
                          <div className="font-mono text-center"><label className="text-sm font-medium" style={{color: colors.textLight}}>k<sub>{currentStepInfo.round}</sub></label><div className="p-2 border rounded bg-white">{currentStepInfo.k_i}</div></div>
                      </div>
                  </div>
                  <div>
                      <h5 className="font-semibold text-center mb-2" style={{color: colors.textDark}}>Calculations</h5>
                      <div className="font-mono text-sm p-4 border rounded-lg bg-white shadow-inner"><ul className="space-y-2">{currentStepInfo.calc.map((line, idx) => (<li key={idx} className="p-2 rounded" style={{backgroundColor: '#f8f9fa'}}>{line}</li>))}</ul></div>
                  </div>
                  <div>
                      <h5 className="font-semibold text-center mb-2" style={{color: colors.accentGreen}}>Output State (Round {currentStepInfo.round})</h5>
                      <div className="flex justify-around font-mono text-center">
                           <div><label className="text-sm font-medium" style={{color: colors.textLight}}>New x</label><div className="p-2 border rounded" style={{backgroundColor: '#d1e7dd'}}>{currentStepInfo.x_out}</div></div>
                           <div><label className="text-sm font-medium" style={{color: colors.textLight}}>New y</label><div className="p-2 border rounded" style={{backgroundColor: '#d1e7dd'}}>{currentStepInfo.y_out}</div></div>
                      </div>
                  </div>
              </div>
            )}
            {currentStepInfo.action === 'key_expansion_round' && (
                <div>
                    <h5 className="font-semibold text-center mb-2" style={{color: colors.textDark}}>Calculations for k<sub>{currentStepInfo.round+1}</sub></h5>
                    <div className="font-mono text-sm p-4 border rounded-lg bg-white shadow-inner"><ul className="space-y-2">{currentStepInfo.calc.map((line, idx) => (<li key={idx} className="p-2 rounded" style={{backgroundColor: idx === currentStepInfo.calc.length-1 ? '#d1e7dd' : '#f8f9fa'}}>{line}</li>))}</ul></div>
                </div>
            )}
            {currentStepInfo.action === 'key_expansion_complete' && (<div className="p-4 bg-white rounded-lg shadow-inner"><h5 className="font-bold text-center mb-2" style={{color: colors.textDark}}>All 22 Round Keys</h5><div className="font-mono text-xs break-all text-center">{currentStepInfo.roundKeys.map((rk, i) => <span key={i} className="inline-block p-1 m-0.5 border rounded">k<sub>{i}</sub>:{rk}</span>)}</div></div>)}
            {currentStepInfo.action === 'complete' && (<div className="text-center font-mono p-4 rounded-lg" style={{backgroundColor: '#d1e7dd'}}><div className="text-lg font-bold" style={{color: colors.accentGreen}}>Final Result:</div><div className="text-2xl">{currentStepInfo.result}</div></div>)}
          </div>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8"><h1 className="text-4xl font-bold mb-2" style={{ color: colors.textDark }}>Speck Cipher Explorer</h1><p style={{ color: colors.textLight }}>An interactive tool for the Speck 32/64 lightweight block cipher</p></div>
  <div className="flex justify-center mb-8"><div className="rounded-lg shadow-lg p-1 flex bg-white"><button onClick={() => setCurrentView('theory')} className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${currentView === 'theory' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: currentView === 'theory' ? colors.primary : 'transparent' }}><BookOpen size={20} /> Theory</button><button onClick={() => setCurrentView('example')} className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${currentView === 'example' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: currentView === 'example' ? colors.primary : 'transparent' }}><Play size={18} /> Example</button><button onClick={() => setCurrentView('cipher')} className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${currentView === 'cipher' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: currentView === 'cipher' ? colors.primary : 'transparent' }}><Code size={20} /> Cipher Tool</button></div></div>
        {currentView === 'theory' && (
           <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Introduction</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  SPECK is a family of lightweight block ciphers developed by the U.S. National Security Agency (NSA) in 2013.32 It was designed with a specific focus on achieving high performance in software implementations, making it an attractive choice for resource-constrained devices like microcontrollers and IoT sensors that lack specialized hardware for encryption.24
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  The NSA publicly released SPECK and its sister algorithm, SIMON, in 2013 as part of an effort to standardize lightweight ciphers for modern applications.37 This was a unique move for an organization with a history of secrecy surrounding its cryptographic research. The design was published with a formal rationale, unlike previous NSA-designed standards, which was a point of both intrigue and controversy within the cryptographic community.32
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  The core idea behind SPECK is an Add-Rotate-XOR (ARX) design.24 This structure, which relies solely on simple bitwise operations, modular addition, and rotation, avoids the use of lookup tables (S-boxes) and other complex operations.32 The absence of S-boxes and table lookups makes SPECK inherently resistant to timing side-channel attacks and allows for a remarkably compact and fast implementation in software.24
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Technical Blueprint</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  SPECK operates on words of varying sizes, with its design based on a simple two-word structure.39 The encryption process consists of a fixed number of rounds, with each round applying the ARX operations to a pair of words.38 For example, the SPECK128/256 variant operates on two 64-bit words, where one word is rotated, added to the second, and then XORed with a round key.39 A notable feature is that the key schedule is directly based on the cipher's round function, which simplifies the design and implementation.39
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  The transparent and simple design of SPECK has been a subject of intense scrutiny, but it is considered a mainstream design that is unlikely to harbor backdoors.32 Its security has been validated through extensive cryptanalysis, and it has proven resilient against various attacks.24 The absence of large-leakage non-linear operations like S-boxes makes it particularly difficult to break using deep learning-based side-channel attacks.38
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
              <div className="space-y-4 text-gray-800">
                <p>
                  SPECK is a prime candidate for IoT and other embedded systems where computational resources are extremely limited.24 For these devices, which often have underpowered CPUs and minimal memory, standard algorithms like AES are too resource-intensive. SPECK fills this void, offering a secure alternative to the practice of using no encryption at all, which is a common vulnerability in these environments.24 The controversy surrounding its NSA origin highlights a larger debate about trust and open standards in modern cryptography. The community's response was to scrutinize the cipher's design, demonstrating a shift towards relying on peer-reviewed transparency rather than blind trust in any single entity.32
                </p>
              </div>
            </div>
            </div>
        )}
        {currentView === 'example' && (
           <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Solved Example: SPECK</h2>
              <div className="space-y-4 text-gray-800">
                <p className="mb-4">
                  A full numerical walkthrough of SPECK is complex and not provided in the source material. However, a conceptual example can illustrate the core operations of a single round.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold text-gray-800 mb-3">Example: A single round of SPECK128/256 encryption.</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <p><strong>Plaintext Block:</strong> A 128-bit block, split into two 64-bit words: x and y.</p>
                    <p><strong>Round Key:</strong> A 64-bit round key, ki​.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: The ARX Operations</h3>
                    <div className="ml-4 space-y-2">
                      <p>
                        A single round of SPECK applies the ARX operations to the two data words, x and y.24 The source material provides a pseudo-C code to describe the round function 39:
                      </p>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="font-mono text-sm space-y-1">
                          <p>x=(ROTR64(x,8)+y)⊕ki​</p>
                          <p>y=(ROTL64(y,3))⊕x</p>
                        </div>
                      </div>
                      <p>Let's trace the flow conceptually:</p>
                      <ul className="ml-4 space-y-1">
                        <li>The value of x is bitwise rotated to the right by 8 positions.</li>
                        <li>The rotated x is then added to the value of y.</li>
                        <li>The result of the addition is XORed with the round key ki​. This final value becomes the new x.</li>
                        <li>The old value of y is bitwise rotated to the left by 3 positions.</li>
                        <li>The rotated y is then XORed with the newly computed value of x. This final value becomes the new y.</li>
                      </ul>
                      <p>
                        These two simple equations complete a single round. This process is repeated for all 34 rounds of SPECK128/256, with a new round key applied in each iteration.39 The key schedule for SPECK also uses a similar ARX process, which simplifies its implementation.39
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
           </div>
        )}
        {currentView === 'cipher' && (
          <div className="max-w-4xl mx-auto"><div className="rounded-xl shadow-lg p-8 bg-white"><h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.textDark }}>Cipher Processor (Speck 32/64)</h2><div className="flex justify-center mb-6"><div className="rounded-lg p-1 flex" style={{ backgroundColor: colors.background }}><button onClick={() => setActiveMode('encrypt')} className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${activeMode === 'encrypt' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: activeMode === 'encrypt' ? colors.accentGreen : 'transparent' }}><Lock size={18} /> Encrypt</button><button onClick={() => setActiveMode('decrypt')} className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${activeMode === 'decrypt' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: activeMode === 'decrypt' ? colors.accentRed : 'transparent' }}><Unlock size={18} /> Decrypt</button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div><label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>{activeMode === 'encrypt' ? 'Plaintext (32-bit Hex)' : 'Ciphertext (32-bit Hex)'}</label><input value={plaintext} onChange={(e) => setPlaintext(e.target.value)} className="w-full font-mono px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{borderColor: colors.primary, backgroundColor: colors.secondary}} placeholder="e.g., 6574694C" /></div><div><label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>Key (64-bit Hex)</label><input type="text" value={key} onChange={(e) => setKey(e.target.value)} className="w-full font-mono px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{borderColor: colors.primary, backgroundColor: colors.secondary}} placeholder="e.g., 0F0E0D0C0B0A0908" /></div></div>{ciphertext && (<div className="mb-6"><label className="block text-sm font-medium mb-2 text-center" style={{ color: colors.textLight }}>Result</label><div className="border border-gray-300 rounded-lg p-4" style={{ backgroundColor: colors.secondary }}><p className="font-mono text-xl break-words text-center" style={{ color: colors.textDark }}>{ciphertext}</p></div></div>)}</div><VizPanel /></div>
        )}
      </div>
    </div>
  );
};


export default SpeckCipherVisualizer;