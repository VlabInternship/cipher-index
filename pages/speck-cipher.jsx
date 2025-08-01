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
        <div className="flex justify-center mb-8"><div className="rounded-lg shadow-lg p-1 flex bg-white"><button onClick={() => setCurrentView('theory')} className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${currentView === 'theory' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: currentView === 'theory' ? colors.primary : 'transparent' }}><BookOpen size={20} /> Theory</button><button onClick={() => setCurrentView('cipher')} className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${currentView === 'cipher' ? 'text-white shadow-md' : 'text-gray-600'}`} style={{ backgroundColor: currentView === 'cipher' ? colors.primary : 'transparent' }}><Code size={20} /> Cipher Tool</button></div></div>
        {currentView === 'theory' && (
           <div className="max-w-4xl mx-auto">
            <div className="rounded-xl shadow-lg p-8 mb-8 bg-white"><h2 className="text-2xl font-bold mb-6" style={{ color: colors.textDark }}>Understanding the Speck Cipher</h2><div className="prose prose-lg max-w-none text-justify"><p className="mb-4" style={{ color: colors.textDark }}>Speck is a family of lightweight block ciphers notable for its high performance in software. It was designed by the U.S. National Security Agency (NSA). Its design philosophy is based on an Add-Rotate-XOR (ARX) structure, which uses operations that are fast on modern CPUs.</p></div></div>
            <div className="rounded-xl shadow-lg p-8 mb-8 bg-white"><h3 className="text-2xl font-bold mb-6" style={{ color: colors.textDark }}>The Math Behind Speck</h3><div className="prose prose-lg max-w-none space-y-4">
                <div>
                    <h4 className="text-xl font-semibold">Encryption Round Function</h4>
                    <p>The plaintext is split into two words, x and y. For each round, they are updated using the round key k<sub>i</sub> as follows:</p>
                    <div className='p-2 bg-gray-100 rounded my-2 font-mono'>x<sub>new</sub> = (ROTR<sup>α</sup>(x<sub>old</sub>) + y<sub>old</sub>) ⊕ k<sub>i</sub></div>
                    <div className='p-2 bg-gray-100 rounded my-2 font-mono'>y<sub>new</sub> = ROTL<sup>β</sup>(y<sub>old</sub>) ⊕ x<sub>new</sub></div>
                    <ul className="text-base">
                        <li><b>ROTR<sup>α</sup>(x)</b>: Rotates the bits of x to the right by α positions. For Speck 32/64, α=7.</li>
                        <li><b>ROTL<sup>β</sup>(y)</b>: Rotates the bits of y to the left by β positions. For Speck 32/64, β=2.</li>
                        <li><b>+</b>: Is addition modulo 2<sup>n</sup>, where n is the word size (16 bits here).</li>
                        <li><b>⊕</b>: Is the bitwise XOR operation.</li>
                    </ul>
                </div>
                 <div>
                    <h4 className="text-xl font-semibold">Decryption Round Function</h4>
                    <p>Decryption reverses the encryption steps in the opposite order:</p>
                    <div className='p-2 bg-gray-100 rounded my-2 font-mono'>y<sub>old</sub> = ROTR<sup>β</sup>(y<sub>new</sub> ⊕ x<sub>new</sub>)</div>
                    <div className='p-2 bg-gray-100 rounded my-2 font-mono'>x<sub>old</sub> = ROTL<sup>α</sup>((x<sub>new</sub> ⊕ k<sub>i</sub>) - y<sub>old</sub>)</div>
                </div>
                <div>
                    <h4 className="text-xl font-semibold">Key Schedule</h4>
                    <p>The key schedule expands the master key into the series of round keys (k<sub>0</sub>, k<sub>1</sub>, ...). For Speck 32/64, the master key has 4 words (m=4). Let the key be (l<sub>2</sub>, l<sub>1</sub>, l<sub>0</sub>, k<sub>0</sub>). The schedule is:</p>
                    <div className='p-2 bg-gray-100 rounded my-2 font-mono'>l<sub>i+m-1</sub> = (k<sub>i</sub> + ROTR<sup>α</sup>(l<sub>i</sub>)) ⊕ i</div>
                    <div className='p-2 bg-gray-100 rounded my-2 font-mono'>k<sub>i+1</sub> = ROTL<sup>β</sup>(k<sub>i</sub>) ⊕ l<sub>i+m-1</sub></div>
                    <p className="text-base">This process is repeated for i = 0, 1, ..., T-2 to generate all 22 round keys (k<sub>0</sub> to k<sub>21</sub>).</p>
                </div>
            </div></div>
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