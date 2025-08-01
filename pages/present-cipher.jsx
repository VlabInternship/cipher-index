import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, Cpu, StepBack, StepForward } from 'lucide-react';

const App = () => {
    // Configuration
    const S_BOX = [0xC, 0x5, 0x6, 0xB, 0x9, 0x0, 0xA, 0xD, 0x3, 0xE, 0xF, 0x8, 0x4, 0x7, 0x1, 0x2];
    const INVERSE_S_BOX = [0x5, 0xE, 0xF, 0x8, 0xC, 0x1, 0x2, 0xD, 0xB, 0x4, 0x6, 0x3, 0x0, 0x7, 0x9, 0xA];

    // State Hooks
    const [formData, setFormData] = useState({
        plaintext: '0123456789ABCDEF',
        key: '00112233445566778899',
        keySize: '80'
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mode, setMode] = useState('encrypt');
    const [result, setResult] = useState(null);
    const intervalRef = useRef(null);
    const animationStepsRef = useRef([]);

    // --- Core Cipher Logic ---

    const sBoxLayer = (state, inverse = false) => {
        const box = inverse ? INVERSE_S_BOX : S_BOX;
        let res = '';
        for (let i = 0; i < 16; i++) {
            res += box[parseInt(state[i], 16)].toString(16).toUpperCase();
        }
        return res;
    };

    const pLayer = (state) => {
        const stateBits = [];
        for (let i = 0; i < 16; i++) {
            const nibble = parseInt(state[i], 16);
            for (let j = 0; j < 4; j++) stateBits.push((nibble >> (3 - j)) & 1);
        }
        const permutedBits = new Array(64);
        for (let i = 0; i < 64; i++) {
            permutedBits[(i === 63) ? 63 : (i * 16) % 63] = stateBits[i];
        }
        let res = '';
        for (let i = 0; i < 16; i++) {
            let nibble = 0;
            for (let j = 0; j < 4; j++) nibble = (nibble << 1) | permutedBits[i * 4 + j];
            res += nibble.toString(16).toUpperCase();
        }
        return res;
    };
    
    const inversePLayer = (state) => {
        const stateBits = [];
        for (let i = 0; i < 16; i++) {
            const nibble = parseInt(state[i], 16);
            for (let j = 0; j < 4; j++) stateBits.push((nibble >> (3 - j)) & 1);
        }
        const permutedBits = new Array(64);
        for (let i = 0; i < 64; i++) {
            permutedBits[i] = stateBits[(i === 63) ? 63 : (i * 4) % 63];
        }
        let res = '';
        for (let i = 0; i < 16; i++) {
            let nibble = 0;
            for (let j = 0; j < 4; j++) nibble = (nibble << 1) | permutedBits[i * 4 + j];
            res += nibble.toString(16).toUpperCase();
        }
        return res;
    };

    const generateRoundKeys = (initialKey, keySize) => {
        let key = initialKey.padEnd(keySize === 80 ? 20 : 32, '0').slice(0, keySize === 80 ? 20 : 32);
        const rounds = keySize === 80 ? 31 : 32;
        const roundKeys = [];
        for (let i = 0; i < rounds + 1; i++) {
            roundKeys.push(key.slice(0, 16));
            if (keySize === 80) {
                const keyBits = [];
                for (let k = 0; k < 20; k++) {
                    const nibble = parseInt(key[k], 16);
                    for (let j = 0; j < 4; j++) keyBits.push((nibble >> (3 - j)) & 1);
                }
                const rotated = [...keyBits.slice(61), ...keyBits.slice(0, 61)];
                const sBoxed = S_BOX[rotated.slice(0, 4).reduce((acc, bit, idx) => acc | (bit << (3 - idx)), 0)];
                for (let k = 0; k < 4; k++) rotated[k] = (sBoxed >> (3 - k)) & 1;
                const roundCounter = i + 1;
                for (let k = 0; k < 5; k++) rotated[15 + k] ^= (roundCounter >> (4 - k)) & 1;
                let nextKey = '';
                for (let k = 0; k < 20; k++) {
                    let nibble = 0;
                    for (let j = 0; j < 4; j++) nibble = (nibble << 1) | rotated[k * 4 + j];
                    nextKey += nibble.toString(16).toUpperCase();
                }
                key = nextKey;
            } else {
                const keyBits = [];
                for (let k = 0; k < 32; k++) {
                    const nibble = parseInt(key[k], 16);
                    for (let j = 0; j < 4; j++) keyBits.push((nibble >> (3 - j)) & 1);
                }
                const rotated = [...keyBits.slice(67), ...keyBits.slice(0, 67)];
                const sBoxed1 = S_BOX[rotated.slice(0, 4).reduce((acc, bit, idx) => acc | (bit << (3 - idx)), 0)];
                for (let k = 0; k < 4; k++) rotated[k] = (sBoxed1 >> (3 - k)) & 1;
                const sBoxed2 = S_BOX[rotated.slice(4, 8).reduce((acc, bit, idx) => acc | (bit << (3 - idx)), 0)];
                for (let k = 0; k < 4; k++) rotated[k+4] = (sBoxed2 >> (3 - k)) & 1;
                const roundCounter = i + 1;
                for (let k = 0; k < 5; k++) rotated[15 + k] ^= (roundCounter >> (4 - k)) & 1;
                let nextKey = '';
                for (let k = 0; k < 32; k++) {
                    let nibble = 0;
                    for (let j = 0; j < 4; j++) nibble = (nibble << 1) | rotated[k * 4 + j];
                    nextKey += nibble.toString(16).toUpperCase();
                }
                key = nextKey;
            }
        }
        return roundKeys;
    };

    const xorHex = (a, b) => {
        let res = '';
        for (let i = 0; i < 16; i++) {
            res += (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(16).toUpperCase();
        }
        return res;
    };

    const processPRESENT = () => {
        const { plaintext, key, keySize } = formData;
        const rounds = parseInt(keySize) === 80 ? 31 : 32;
        let state = plaintext.padEnd(16, '0').slice(0, 16);
        const roundKeys = generateRoundKeys(key, parseInt(keySize));
        const steps = [];
        
        steps.push({ type: 'initial', state, key, round: 0, description: `Initial ${mode === 'encrypt' ? 'plaintext' : 'ciphertext'}`, visual: 'initial' });

        if (mode === 'encrypt') {
            for (let round = 0; round < rounds; round++) {
                let prevState;
                const roundKey = roundKeys[round];
                prevState = state;
                state = xorHex(state, roundKey);
                steps.push({ type: 'addRoundKey', state, roundKey, prevState, round: round + 1, description: `Add round key ${round + 1}`, visual: 'xor' });
                prevState = state;
                state = sBoxLayer(state, false);
                steps.push({ type: 'sBox', state, prevState, round: round + 1, description: `S-box substitution`, visual: 'sbox' });
                prevState = state;
                state = pLayer(state);
                steps.push({ type: 'pLayer', state, prevState, round: round + 1, description: `P-layer permutation`, visual: 'player' });
            }
            const finalKey = roundKeys[rounds];
            let prevState = state;
            state = xorHex(state, finalKey);
            steps.push({ type: 'addRoundKey', state, roundKey: finalKey, prevState, round: rounds + 1, description: `Final AddRoundKey`, visual: 'xor' });
        } else {
            let prevState = state;
            state = xorHex(state, roundKeys[rounds]);
            steps.push({ type: 'addRoundKey', state, roundKey: roundKeys[rounds], prevState, round: 1, description: `Add final round key`, visual: 'xor' });
            for (let round = rounds - 1; round >= 0; round--) {
                prevState = state;
                state = inversePLayer(state);
                steps.push({ type: 'pLayer', state, prevState, round: rounds - round, description: `Inverse P-layer`, visual: 'player' });
                prevState = state;
                state = sBoxLayer(state, true);
                steps.push({ type: 'sBox', state, prevState, round: rounds - round, description: `Inverse S-box substitution`, visual: 'sbox' });
                prevState = state;
                state = xorHex(state, roundKeys[round]);
                steps.push({ type: 'addRoundKey', state, roundKey: roundKeys[round], prevState, round: rounds - round + 1, description: `Add round key ${round + 1}`, visual: 'xor' });
            }
        }

        steps.push({ type: 'final', state, round: rounds + 1, description: `Final ${mode === 'encrypt' ? 'ciphertext' : 'plaintext'}`, visual: 'final' });
        animationStepsRef.current = steps;
        setResult({ input: plaintext, output: state, steps, rounds, keySize: `${keySize}-bit` });
    };

    // --- Animation and UI Control ---
    const startAnimation = (fromBeginning = false) => {
        if (isAnimating) return;
        
        // If we need to start from beginning or if there are no steps yet
        if (fromBeginning || animationStepsRef.current.length === 0) {
            resetAnimation(false);
            processPRESENT();
        }

        setIsAnimating(true);
        intervalRef.current = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= (animationStepsRef.current?.length || 0) - 1) {
                    setIsAnimating(false);
                    clearInterval(intervalRef.current);
                    return prev;
                }
                return prev + 1;
            });
        }, 1000); // Fixed animation speed at 1000ms
    };

    const stopAnimation = () => {
        setIsAnimating(false);
        clearInterval(intervalRef.current);
    };

    const toggleAnimation = () => {
        if (isAnimating) {
            stopAnimation();
        } else {
            // Resume from current step instead of starting over
            startAnimation(false);
        }
    };

    const resetAnimation = (fullReset = true) => {
        setIsAnimating(false);
        setCurrentStep(0);
        clearInterval(intervalRef.current);
        if (fullReset) {
            animationStepsRef.current = [];
            setResult(null);
        }
    };

    const goToStep = (step) => {
        stopAnimation();
        setCurrentStep(Math.max(0, Math.min(step, (animationStepsRef.current?.length || 0) - 1)));
    };

    const nextStep = () => goToStep(currentStep + 1);
    const prevStep = () => goToStep(currentStep - 1);
    
    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    // --- Sub-Components for Rendering Visualizations ---
    const renderVisualization = (step) => {
        if (!step) return null;
        switch (step.visual) {
            case 'initial': return (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-center text-[#0056b3] font-medium mb-2">Initial State</div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {step.state.split('').map((char, i) => (
                            <div key={i} className="bg-white p-2 rounded border border-gray-200 text-center font-mono">{char}</div>
                        ))}
                    </div>
                </div>
            );
            case 'xor': return (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="bg-white p-2 rounded-lg border border-gray-200 font-mono text-sm break-all">{step.prevState}</div>
                        <div className="text-xl text-amber-600">⊕</div>
                        <div className="bg-amber-100 p-2 rounded-lg border border-amber-200 font-mono text-sm break-all">{step.roundKey}</div>
                        <div className="text-xl">=</div>
                        <div className="bg-green-100 p-2 rounded-lg border border-green-200 font-mono text-sm break-all">{step.state}</div>
                    </div>
                    <div className="text-center text-sm text-gray-600">XOR operation with round key</div>
                </div>
            );
            case 'sbox': return (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="bg-white p-2 rounded-lg border border-gray-200 font-mono text-sm break-all">{step.prevState}</div>
                        <div className="text-xl text-purple-600">→</div>
                        <div className="bg-purple-100 p-2 rounded-lg border border-purple-200 font-mono text-sm break-all">{step.state}</div>
                    </div>
                    <div className="text-center text-sm text-gray-600">{mode === 'encrypt' ? 'S-box substitution' : 'Inverse S-box substitution'}</div>
                </div>
            );
            case 'player': return (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="bg-white p-2 rounded-lg border border-gray-200 font-mono text-sm break-all">{step.prevState}</div>
                        <div className="text-xl text-[#0056b3]">⇄</div>
                        <div className="bg-blue-100 p-2 rounded-lg border border-blue-200 font-mono text-sm break-all">{step.state}</div>
                    </div>
                    <div className="text-center text-sm text-gray-600">Bit permutation (P-layer)</div>
                </div>
            );
            case 'final': return (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-center text-green-700 font-medium mb-2">Final {mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}</div>
                    <div className="text-center font-mono text-xl font-bold break-all">{step.state}</div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] font-sans text-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 text-[#0056b3]">PRESENT Cipher</h1>
                <p className="text-gray-600 text-lg">Ultra-lightweight block cipher visualization</p>
            </header>

            <main className="space-y-8">
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold mb-5 flex items-center gap-3 text-[#0056b3]"><Cpu size={24} /> About PRESENT</h2>
                    <div className="space-y-4">
                        <div className="bg-[#f9f9f9] rounded-lg p-4 border border-gray-200">
                            <h3 className="font-semibold text-[#0056b3] mb-2">Encryption Rounds</h3>
                            <div className="text-sm text-gray-700 space-y-3">
                                <p>PRESENT performs 31 rounds of transformation. Each round consists of:</p>
                                <div className="flex items-start gap-3">
                                    <div className="bg-[#007bff] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">1</div>
                                    <div><strong>AddRoundKey:</strong> The 64-bit state is XORed with a 64-bit round key.</div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-[#007bff] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">2</div>
                                    <div><strong>sBoxLayer:</strong> A non-linear substitution using a fixed 4x4 S-box.</div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-[#007bff] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">3</div>
                                    <div><strong>pLayer:</strong> A linear bit permutation layer for diffusion.</div>
                                </div>
                                <p>After 31 rounds, a final AddRoundKey step is performed to produce the ciphertext.</p>
                            </div>
                        </div>
                        <div className="bg-[#f9f9f9] rounded-lg p-4 border border-gray-200">
                            <h3 className="font-semibold text-[#0056b3] mb-2">Key Features</h3>
                            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                                <li><strong>Block Size:</strong> 64 bits</li>
                                <li><strong>Key Size:</strong> 80 or 128 bits</li>
                                <li><strong>Rounds:</strong> 31 (plus a final key whitening step)</li>
                                <li><strong>Purpose:</strong> Designed for constrained environments (RFID, IoT).</li>
                                <li><strong>Standardization:</strong> ISO/IEC 29192-2:2019</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold mb-5 flex items-center gap-3 text-[#0056b3]"><Play size={24} /> Interactive Demo</h2>
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">{mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'} (16 hex)</label>
                                <input type="text" value={formData.plaintext} onChange={(e) => setFormData({...formData, plaintext: e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '')})} className="w-full p-3 bg-[#f9f9f9] border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#007bff] focus:border-[#007bff] transition" maxLength={16} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Key Size</label>
                                <select value={formData.keySize} onChange={(e) => setFormData({...formData, keySize: e.target.value})} className="w-full p-3 bg-[#f9f9f9] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-[#007bff] transition">
                                    <option value="80">PRESENT-80 (20 hex)</option>
                                    <option value="128">PRESENT-128 (32 hex)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Key ({formData.keySize === '80' ? '20' : '32'} hex)</label>
                            <input type="text" value={formData.key} onChange={(e) => setFormData({...formData, key: e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '')})} className="w-full p-3 bg-[#f9f9f9] border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#007bff] focus:border-[#007bff] transition" maxLength={formData.keySize === '80' ? 20 : 32} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Mode</label>
                                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                    <button onClick={() => setMode('encrypt')} className={`flex-1 px-3 py-2 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${mode === 'encrypt' ? 'bg-[#007bff] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><Lock size={14} /> Encrypt</button>
                                    <button onClick={() => setMode('decrypt')} className={`flex-1 px-3 py-2 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${mode === 'decrypt' ? 'bg-[#007bff] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><Unlock size={14} /> Decrypt</button>
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <button onClick={() => startAnimation(true)} disabled={isAnimating} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#007bff] text-white rounded-lg font-semibold hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">
                                    <Play size={16} />
                                    Start
                                </button>
                                <button onClick={() => resetAnimation(true)} className="p-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"><RotateCcw size={16} /></button>
                            </div>
                        </div>
                    </div>
                    {result && (
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                            <div className="bg-[#f9f9f9] rounded-xl p-4 sm:p-6 border border-gray-200">
                                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                                    <h3 className="font-bold text-[#0056b3] text-lg">{mode === 'encrypt' ? 'Encryption' : 'Decryption'} Process</h3>
                                    {result.steps[currentStep] && <div className="text-sm font-medium text-[#0056b3] bg-white px-3 py-1 rounded-full border border-gray-200">Step {currentStep + 1} / {result.steps.length}</div>}
                                </div>
                                {result.steps[currentStep] && (
                                    <div className="space-y-4">
                                        <div className="bg-white rounded-lg p-4 border border-gray-200 min-h-[120px] flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`w-2 h-2 bg-[#007bff] rounded-full ${isAnimating ? 'animate-pulse' : ''}`}></div>
                                                <span className="text-sm font-semibold text-[#0056b3]">{result.steps[currentStep].description}</span>
                                            </div>
                                            {renderVisualization(result.steps[currentStep])}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-[#007bff] h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / result.steps.length) * 100}%` }}></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <button onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                                <StepBack size={16} /> Previous
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={toggleAnimation} className="flex items-center gap-2 px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] transition">
                                                    {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                                                    {isAnimating ? 'Pause' : 'Play'}
                                                </button>
                                            </div>
                                            <button onClick={nextStep} disabled={currentStep >= result.steps.length - 1} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                                Next <StepForward size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                                    <h3 className="font-semibold mb-2 text-gray-700">{mode === 'encrypt' ? 'Plaintext Input' : 'Ciphertext Input'}</h3>
                                    <div className="font-mono bg-white p-3 rounded border border-gray-300 text-sm break-all">
                                        <div className="font-bold text-gray-800">0x{result.input}</div>
                                    </div>
                                </div>
                                <div className="bg-green-100 rounded-lg p-4 border border-green-200">
                                    <h3 className="font-semibold mb-2 text-green-800">{mode === 'encrypt' ? 'Ciphertext Output' : 'Plaintext Output'}</h3>
                                    <div className="font-mono bg-white p-3 rounded border border-gray-300 text-sm break-all">
                                        <div className="font-bold text-green-900">0x{result.output}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
          </div>
        </div>
    );
};

export default App;