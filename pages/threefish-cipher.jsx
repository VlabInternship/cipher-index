import React, { useState, useEffect } from 'react';
import { ChevronRight, Lock, Unlock, Key, FileText, Play, Pause, RotateCcw } from 'lucide-react';

// Use BigInt for 64-bit operations as Threefish operates on 64-bit words.
const U64 = (n) => BigInt.asUintN(64, BigInt(n));

// Helper functions for data conversion
const stringToBytes = (str) => {
    const padded = str.slice(0, 32).padEnd(32, '\0');
    return new TextEncoder().encode(padded);
};
const bytesToString = (bytes) => {
    return new TextDecoder().decode(bytes).replace(/\0+$/, '');
};
const ab2hex = (buffer) => {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};
const hex2ab = (hex) => {
    if (hex.length % 2 !== 0) throw new Error('Hex string must have an even length');
    const buffer = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        buffer[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return buffer;
};

// Core cryptographic functions
/**
 * Corrected Mix operation for Threefish-256.
 * x = x + y
 * y = (y <<< R) ^ x
 */
const mix = (x, y, rotation) => {
    const rotationBigInt = BigInt(rotation);
    const newX = U64(x + y);
    const rotatedY = U64((y << rotationBigInt) | (y >> (BigInt(64) - rotationBigInt)));
    const newY = U64(rotatedY ^ newX);
    return [newX, newY];
};

/**
 * Corrected inverse Mix operation for Threefish-256.
 * y = (y ^ x) >>> R
 * x = x - y
 */
const invMix = (newX, newY, rotation) => {
    const rotationBigInt = BigInt(rotation);
    const rotatedY = U64(newY ^ newX);
    const oldY = U64((rotatedY >> rotationBigInt) | (rotatedY << (BigInt(64) - rotationBigInt)));
    const oldX = U64(newX - oldY);
    return [oldX, oldY];
};

/**
 * Permute operation for Threefish-256.
 * words[0, 1, 2, 3] -> words[0, 3, 2, 1]
 */
const permute = (words) => {
    const [w0, w1, w2, w3] = words;
    return [w0, w3, w2, w1];
};

/**
 * Inverse Permute operation for Threefish-256.
 * The permutation is its own inverse.
 */
const invPermute = (words) => {
    return permute(words);
};

// Word visualization component with enhanced styling
const WordBlock = ({ word, index, highlight = false, label = '' }) => {
    const displayWord = word ? word.toString(16).padStart(16, '0') : '0'.repeat(16);
    
    return (
        <div className={`p-3 rounded-lg border-2 transition-all duration-300 transform ${
            highlight ? 'border-amber-400 bg-amber-50 shadow-lg scale-105' : 'border-gray-300 bg-white'
        } ${highlight ? 'animate-pulse' : ''}`}>
            <div className="text-xs text-gray-500 mb-1">{label || `Word ${index}`}</div>
            <div className="font-mono text-sm break-all">
                {displayWord}
            </div>
        </div>
    );
};

// Main application component
const App = () => {
    const [activeTab, setActiveTab] = useState('theory');
    const [plaintext, setPlaintext] = useState('hello world');
    const [key, setKey] = useState('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    const [encryptedOutput, setEncryptedOutput] = useState('');
    const [decryptedOutput, setDecryptedOutput] = useState('');
    const [visualizationSteps, setVisualizationSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [operation, setOperation] = useState('encrypt');
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const [error, setError] = useState('');

    // Threefish-256 constants
    const KEY_WORDS = 4;
    const ROUNDS = 72;
    const rotationConstants = [
        [14, 16], [52, 57], [23, 40], [5, 37],
        [25, 33], [46, 12], [58, 22], [32, 32]
    ];
    
    const threefishEncrypt = () => {
        const steps = [];
        setOperation('encrypt');
        setError('');

        try {
            if (!plaintext || !key) {
                setError('Please enter both a message and a password.');
                return;
            }
            if (key.length !== 64) {
                 setError('Password must be exactly 64 hex characters (256-bit key).');
                return;
            }
            steps.push({
                type: 'header',
                title: 'Threefish-256 Encryption Process',
                description: 'Starting encryption with 72 rounds of operations',
            });

            steps.push({
                type: 'step',
                title: '1. Input Preprocessing',
                description: 'Converting plaintext to 32-byte block and validating 256-bit key',
            });

            const plaintextBytes = stringToBytes(plaintext);
            const keyBytes = hex2ab(key);
            
            const plaintextWords = [];
            for (let i = 0; i < 4; i++) {
                let word = BigInt(0);
                for (let j = 0; j < 8; j++) {
                    word |= BigInt(plaintextBytes[i * 8 + j]) << BigInt(j * 8);
                }
                plaintextWords.push(U64(word));
            }

            const keyWords = [];
            for (let i = 0; i < 4; i++) {
                let word = BigInt(0);
                for (let j = 0; j < 8; j++) {
                    word |= BigInt(keyBytes[i * 8 + j]) << BigInt(j * 8);
                }
                keyWords.push(U64(word));
            }

            const tweakWords = [U64(0), U64(0)];
            const C = U64(BigInt('0x1BD11BDAA9FC1A22'));
            const keyWordsExtended = [...keyWords, U64(keyWords[0] ^ keyWords[1] ^ keyWords[2] ^ keyWords[3] ^ C)];
            const tweakWordsExtended = [...tweakWords, U64(tweakWords[0] ^ tweakWords[1])];

            steps.push({
                type: 'state',
                title: 'Initial State',
                dataWords: [...plaintextWords],
                keyWords: [...keyWords],
                tweakWords: [...tweakWords],
                description: 'Data converted to four 64-bit words'
            });

            let currentWords = [...plaintextWords];

            for (let d = 0; d < ROUNDS / 4; d++) {
                steps.push({
                    type: 'round_header',
                    title: `Round Group ${d + 1}`,
                    description: `Processing rounds ${d * 4 + 1} to ${d * 4 + 4}`,
                    roundGroup: d
                });

                const subkeys = [];
                for (let j = 0; j < KEY_WORDS + 1; j++) {
                    subkeys.push(keyWordsExtended[(d + j) % (KEY_WORDS + 1)]);
                }
                subkeys[KEY_WORDS - 2] = U64(subkeys[KEY_WORDS - 2] + tweakWordsExtended[d % 3]);
                subkeys[KEY_WORDS - 1] = U64(subkeys[KEY_WORDS - 1] + tweakWordsExtended[(d + 1) % 3]);
                subkeys[KEY_WORDS] = U64(subkeys[KEY_WORDS] + U64(BigInt(d)));
                
                for (let j = 0; j < KEY_WORDS; j++) {
                    currentWords[j] = U64(currentWords[j] + subkeys[j]);
                }
                
                steps.push({
                    type: 'state',
                    title: 'After Subkey Addition',
                    dataWords: [...currentWords],
                    description: `Added round subkeys for group ${d + 1}`,
                    operation: 'subkey',
                    highlightPairs: [[0], [1], [2], [3]]
                });

                for (let r = 0; r < 4; r++) {
                    const currentRound = d * 4 + r;
                    steps.push({
                        type: 'round_start',
                        round: currentRound + 1,
                        description: `Round ${currentRound + 1} of 72`
                    });

                    const rotIndex = r % rotationConstants.length;
                    const rotation1 = rotationConstants[rotIndex][0];
                    const rotation2 = rotationConstants[rotIndex][1];
                    let [w0, w1] = mix(currentWords[0], currentWords[1], rotation1);
                    let [w2, w3] = mix(currentWords[2], currentWords[3], rotation2);
                    currentWords = [w0, w1, w2, w3];
                    
                    steps.push({
                        type: 'state',
                        title: 'After Mix Operation',
                        dataWords: [...currentWords],
                        description: `Applied Mix (Addition, Rotation, XOR) with rotations ${rotation1}, ${rotation2}`,
                        operation: 'mix',
                        highlightPairs: [[0,1], [2,3]]
                    });

                    if (currentRound < ROUNDS - 1) {
                        currentWords = permute(currentWords);
                        steps.push({
                            type: 'state',
                            title: 'After Permutation',
                            dataWords: [...currentWords],
                            description: 'Reordered words according to permutation pattern: [w0, w1, w2, w3] -> [w0, w3, w2, w1]',
                            operation: 'permute',
                            highlightPairs: [[1,3]]
                        });
                    }
                }
            }
            
            // Final subkey addition
            const finalD = ROUNDS / 4;
            const finalSubkeys = [];
            for (let j = 0; j < KEY_WORDS + 1; j++) {
                finalSubkeys.push(keyWordsExtended[(finalD + j) % (KEY_WORDS + 1)]);
            }
            finalSubkeys[KEY_WORDS - 2] = U64(finalSubkeys[KEY_WORDS - 2] + tweakWordsExtended[finalD % 3]);
            finalSubkeys[KEY_WORDS - 1] = U64(finalSubkeys[KEY_WORDS - 1] + tweakWordsExtended[(finalD + 1) % 3]);
            finalSubkeys[KEY_WORDS] = U64(finalSubkeys[KEY_WORDS] + U64(BigInt(finalD)));

            for (let j = 0; j < KEY_WORDS; j++) {
                currentWords[j] = U64(currentWords[j] + finalSubkeys[j]);
            }

            const encryptedBytes = new Uint8Array(32);
            for (let i = 0; i < 4; i++) {
                const word = currentWords[i];
                for (let j = 0; j < 8; j++) {
                    encryptedBytes[i * 8 + j] = Number((word >> BigInt(j * 8)) & BigInt(0xFF));
                }
            }
            
            const finalOutput = ab2hex(encryptedBytes);
            setEncryptedOutput(finalOutput);
            
            steps.push({
                type: 'final_result',
                title: 'Encryption Complete',
                dataWords: [...currentWords],
                output: finalOutput,
                description: 'Final encrypted ciphertext generated'
            });

        } catch (e) {
            setError(`Encryption error: ${e.message}`);
        }
        setVisualizationSteps(steps);
    };

    const threefishDecrypt = (hexCiphertext, hexKey) => {
        const steps = [];
        setOperation('decrypt');
        setError('');

        try {
            if (!hexCiphertext || !hexKey) {
                setError('Please provide both ciphertext and key.');
                return;
            }
            if (hexKey.length !== 64 || hexCiphertext.length !== 64) {
                 setError('Ciphertext and Key must be exactly 64 hex characters (32 bytes).');
                return;
            }

            steps.push({
                type: 'header',
                title: 'Threefish-256 Decryption Process',
                description: 'Reversing 72 rounds of operations',
            });
            
            const ciphertextBytes = hex2ab(hexCiphertext);
            const keyBytes = hex2ab(hexKey);
    
            let currentWords = [];
            for (let i = 0; i < 4; i++) {
                let word = BigInt(0);
                for (let j = 0; j < 8; j++) {
                    word |= BigInt(ciphertextBytes[i * 8 + j]) << BigInt(j * 8);
                }
                currentWords.push(U64(word));
            }
    
            const keyWords = [];
            for (let i = 0; i < 4; i++) {
                let word = BigInt(0);
                for (let j = 0; j < 8; j++) {
                    word |= BigInt(keyBytes[i * 8 + j]) << BigInt(j * 8);
                }
                keyWords.push(U64(word));
            }
            const tweakWords = [U64(0), U64(0)];
            const C = U64(BigInt('0x1BD11BDAA9FC1A22'));
            const keyWordsExtended = [...keyWords, U64(keyWords[0] ^ keyWords[1] ^ keyWords[2] ^ keyWords[3] ^ C)];
            const tweakWordsExtended = [...tweakWords, U64(tweakWords[0] ^ tweakWords[1])];

            const finalD = ROUNDS / 4;
            const finalSubkeys = [];
            for (let j = 0; j < KEY_WORDS + 1; j++) {
                finalSubkeys.push(keyWordsExtended[(finalD + j) % (KEY_WORDS + 1)]);
            }
            finalSubkeys[KEY_WORDS - 2] = U64(finalSubkeys[KEY_WORDS - 2] + tweakWordsExtended[finalD % 3]);
            finalSubkeys[KEY_WORDS - 1] = U64(finalSubkeys[KEY_WORDS - 1] + tweakWordsExtended[(finalD + 1) % 3]);
            finalSubkeys[KEY_WORDS] = U64(finalSubkeys[KEY_WORDS] + U64(BigInt(finalD)));

            for (let j = 0; j < KEY_WORDS; j++) {
                currentWords[j] = U64(currentWords[j] - finalSubkeys[j]);
            }
            
            steps.push({
                type: 'state',
                title: 'After Inverse Final Subkey Addition',
                dataWords: [...currentWords],
                description: 'Subtracted final subkeys to begin decryption',
                operation: 'subkey',
                highlightPairs: [[0], [1], [2], [3]]
            });

            for (let d = (ROUNDS / 4) - 1; d >= 0; d--) {
                steps.push({
                    type: 'round_header',
                    title: `Round Group ${d + 1} (Inverse)`,
                    description: `Processing rounds ${d * 4 + 4} to ${d * 4 + 1}`,
                    roundGroup: d
                });

                for (let r = 3; r >= 0; r--) {
                    const currentRound = d * 4 + r;

                    if (currentRound < ROUNDS - 1) {
                        currentWords = invPermute(currentWords);
                        steps.push({
                            type: 'state',
                            title: 'After Inverse Permutation',
                            dataWords: [...currentWords],
                            description: 'Reordered words back to original positions',
                            operation: 'permute',
                            highlightPairs: [[1,3]]
                        });
                    }
                    
                    const rotIndex = r % rotationConstants.length;
                    const rotation1 = rotationConstants[rotIndex][0];
                    const rotation2 = rotationConstants[rotIndex][1];
                    let [w0, w1] = invMix(currentWords[0], currentWords[1], rotation1);
                    let [w2, w3] = invMix(currentWords[2], currentWords[3], rotation2);
                    currentWords = [w0, w1, w2, w3];
    
                    steps.push({
                        type: 'state',
                        title: 'After Inverse Mix Operation',
                        dataWords: [...currentWords],
                        description: `Applied inverse Mix operation with rotations ${rotation1}, ${rotation2}`,
                        operation: 'mix',
                        highlightPairs: [[0,1], [2,3]]
                    });
                }
                
                const subkeys = [];
                for (let j = 0; j < KEY_WORDS + 1; j++) {
                    subkeys.push(keyWordsExtended[(d + j) % (KEY_WORDS + 1)]);
                }
                subkeys[KEY_WORDS - 2] = U64(subkeys[KEY_WORDS - 2] + tweakWordsExtended[d % 3]);
                subkeys[KEY_WORDS - 1] = U64(subkeys[KEY_WORDS - 1] + tweakWordsExtended[(d + 1) % 3]);
                subkeys[KEY_WORDS] = U64(subkeys[KEY_WORDS] + U64(BigInt(d)));

                for (let j = 0; j < KEY_WORDS; j++) {
                    currentWords[j] = U64(currentWords[j] - subkeys[j]);
                }
                
                steps.push({
                    type: 'state',
                    title: 'After Subkey Subtraction',
                    dataWords: [...currentWords],
                    description: `Subtracted subkeys for group ${d + 1}`,
                    operation: 'subkey',
                    highlightPairs: [[0], [1], [2], [3]]
                });
            }
            
            const decryptedBytes = new Uint8Array(32);
            for (let i = 0; i < 4; i++) {
                const word = currentWords[i];
                for (let j = 0; j < 8; j++) {
                    decryptedBytes[i * 8 + j] = Number((word >> BigInt(j * 8)) & BigInt(0xFF));
                }
            }
            
            const finalOutput = bytesToString(decryptedBytes);
            setDecryptedOutput(finalOutput);
    
            steps.push({
                type: 'final_result',
                title: 'Decryption Complete',
                dataWords: [...currentWords],
                output: finalOutput,
                description: 'Final decrypted plaintext restored!'
            });
    
        } catch (e) {
            setError(`Decryption error: ${e.message}`);
        }
    
        setVisualizationSteps(steps);
    };

    // Animation control to run encryption, then decryption
    useEffect(() => {
        if (isAnimating && currentStep < visualizationSteps.length) {
            const timer = setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, animationSpeed);
            return () => clearTimeout(timer);
        } else if (currentStep >= visualizationSteps.length && isAnimating) {
            setIsAnimating(false);
            if (operation === 'encrypt' && encryptedOutput.length > 0) {
                threefishDecrypt(encryptedOutput, key);
                setCurrentStep(0);
                setIsAnimating(true);
            }
        }
    }, [isAnimating, currentStep, visualizationSteps.length, animationSpeed, operation, encryptedOutput, key]);

    const handleRunSimulation = (e) => {
        e.preventDefault();
        setEncryptedOutput('');
        setDecryptedOutput('');
        setVisualizationSteps([]);
        setCurrentStep(0);
        setIsAnimating(false);
        setError('');
        
        setTimeout(() => {
            threefishEncrypt();
            setIsAnimating(true);
        }, 100);
    };

    const handleStepControl = (action) => {
        switch (action) {
            case 'play':
                setIsAnimating(true);
                break;
            case 'pause':
                setIsAnimating(false);
                break;
            case 'reset':
                setEncryptedOutput('');
                setDecryptedOutput('');
                setVisualizationSteps([]);
                setCurrentStep(0);
                setIsAnimating(false);
                setError('');
                break;
            case 'next':
                if (currentStep < visualizationSteps.length) {
                    setCurrentStep(currentStep + 1);
                }
                break;
            case 'prev':
                if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                }
                break;
        }
    };

    const renderTheory = () => (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#f9f9f9] p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] flex items-center">
                    <Lock className="mr-2" size={24} />
                    Threefish: A Tweakable and S-Box-Free Design
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Threefish is a symmetric-key tweakable block cipher that was designed as a component of the Skein hash function, which was a finalist in the NIST hash function competition. Its design is notable for its avoidance of S-boxes and its use of a public "tweak" value to alter the encryption process.
                </p>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Origin Story
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                        Threefish was created by a team of prominent cryptographers, including Bruce Schneier, as part of the Skein hash function. The team's goal was to create a modern, high-performance cipher that was also resistant to side-channel attacks. The design was made unpatented and license-free to encourage its adoption and public scrutiny.
                    </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Core Idea
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                        The core idea of Threefish is to provide robust security without the use of lookup tables or S-boxes, which are common sources of timing side-channel attacks in software implementations. Its non-linearity is achieved through a simple and elegant **Add-Rotate-XOR (ARX)** design. The "tweakable" property allows a public value (the tweak) to modify the encryption of a message. This means that two identical plaintext-key pairs will produce different ciphertexts if their tweaks are different.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Technical Blueprint
                    </h4>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Threefish operates on 64-bit words and supports block and key sizes of 256, 512, or 1024 bits. The cipher works over a series of rounds (72 for 256/512-bit versions, 80 for the 1024-bit version). The encryption process involves three main steps:
                    </p>
                    <ul className="space-y-4 text-gray-700 text-sm">
                        <li className="bg-[#f9f9f9] p-4 rounded-lg shadow-sm border border-gray-100 flex items-start">
                            <ChevronRight size={16} className="mr-2 mt-0.5 text-[#0056b3]" />
                            <div>
                                <strong className="text-base text-gray-800">Key Addition:</strong> The data words are combined with a set of round key words and tweak words. This is done before the first round and after every four rounds. A fixed constant, **C<sub>240</sub>**, is used in the key schedule to thwart certain attacks.
                            </div>
                        </li>
                        <li className="bg-[#f9f9f9] p-4 rounded-lg shadow-sm border border-gray-100 flex items-start">
                            <ChevronRight size={16} className="mr-2 mt-0.5 text-[#0056b3]" />
                            <div>
                                <strong className="text-base text-gray-800">Mix Function:</strong> The Mix function is the heart of the ARX design. It takes a pair of words and returns a new pair of words using modular addition, bitwise rotation, and XOR operations. These operations are chosen for their speed and resistance to timing attacks.
                            </div>
                        </li>
                        <li className="bg-[#f9f9f9] p-4 rounded-lg shadow-sm border border-gray-100 flex items-start">
                            <ChevronRight size={16} className="mr-2 mt-0.5 text-[#0056b3]" />
                            <div>
                                <strong className="text-base text-gray-800">Permute Step:</strong> This step rearranges the positions of the words according to a fixed pattern. The permutation is designed to be independent of the key or plaintext to ensure a consistent computation time, further protecting against side-channel attacks.
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Security Scorecard
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                        Threefish was designed to be highly secure and resistant to timing attacks. However, as is common with new cryptographic designs, cryptanalytic attacks against reduced-round versions have been published. A known-key distinguisher attack was published in 2010 that affected 53 of 72 rounds of Threefish-256 and 57 of 72 rounds of Threefish-512. In response, the designers updated the cipher's rotation constants to strengthen it.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Real-World Usage
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                        While not as widely adopted as AES, Threefish is a notable and respected cipher. Its primary use is within the Skein hash function. Its design, which avoids S-boxes and is resistant to timing attacks, makes it a good candidate for secure software and hardware applications, particularly for financial transactions and other sensitive data.
                    </p>
                </div>
            </div>
            
            <div className="bg-[#f9f9f9] p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-xl font-semibold text-[#0056b3] mb-4">Solved Example: Threefish</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                    The provided sources do not include a full numerical example for Threefish. However, a conceptual walkthrough can illustrate the process and its core components.
                </p>
                <div className="space-y-4 text-sm text-gray-700">
                    <p><strong>Example:</strong> A single round of Threefish-256 encryption.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Plaintext Block:</strong> A 256-bit block, represented as four 64-bit words: w<sub>0</sub>, w<sub>1</sub>, w<sub>2</sub>, w<sub>3</sub>.</li>
                        <li><strong>Key:</strong> A 256-bit key, represented as four 64-bit words: k<sub>0</sub>, k<sub>1</sub>, k<sub>2</sub>, k<sub>3</sub>.</li>
                        <li><strong>Tweak:</strong> A 128-bit tweak, represented as two 64-bit words: t<sub>0</sub>, t<sub>1</sub>.</li>
                    </ul>
                    <p><strong>Step 1: Key and Tweak Addition</strong></p>
                    <p className="pl-4">
                        Before the first round, and after every four rounds, the data words are combined with the round key words. The first round key words are the original key words plus a special tweak word that is derived from the original two tweak words. The addition is done modulo **2<sup>64</sup>**.
                    </p>
                    <p className="font-mono bg-gray-100 p-2 rounded-lg text-xs break-all">
                        w<sub>0</sub> = w<sub>0</sub> + k<sub>0</sub> + t<sub>0</sub> (mod 2<sup>64</sup>)<br/>
                        w<sub>1</sub> = w<sub>1</sub> + k<sub>1</sub> + t<sub>1</sub> (mod 2<sup>64</sup>)<br/>
                        w<sub>2</sub> = w<sub>2</sub> + k<sub>2</sub> + t<sub>2</sub> (mod 2<sup>64</sup>)<br/>
                        w<sub>3</sub> = w<sub>3</sub> + k<sub>3</sub> (mod 2<sup>64</sup>)<br/>
                        (Note: the tweak word t<sub>2</sub> is t<sub>0</sub> ⊕ t<sub>1</sub>)
                    </p>
                    <p><strong>Step 2: Apply the Mix Function</strong></p>
                    <p className="pl-4">
                        The heart of the cipher's non-linearity is the Mix function, which is applied to pairs of words. It takes two words, adds them, rotates one, and XORs the result. For example, for the first pair of words (w<sub>0</sub>, w<sub>1</sub>):
                    </p>
                    <p className="font-mono bg-gray-100 p-2 rounded-lg text-xs break-all">
                        y<sub>0</sub> = w<sub>0</sub> + w<sub>1</sub> (mod 2<sup>64</sup>)<br/>
                        y<sub>1</sub> = (w<sub>1</sub> ⋘ R<sub>d</sub>) ⊕ y<sub>0</sub>
                    </p>
                    <p className="pl-4">
                        Where R<sub>d</sub> is a fixed rotation constant dependent on the round number. This produces a new pair of words (y<sub>0</sub>, y<sub>1</sub>).
                    </p>
                    <p><strong>Step 3: Permute the Words</strong></p>
                    <p className="pl-4">
                        The words are then rearranged according to a fixed, constant permutation pattern. This step ensures rapid diffusion of information across the entire block without using key- or data-dependent operations that could reveal information through timing.
                    </p>
                    <p className="mt-4">
                        This process of key addition, mixing, and permutation is repeated for 72 rounds for a 256-bit key. Decryption reverses this process by applying the inverse operations in the opposite order, using the keys in reverse.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderAlgorithm = () => (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#f9f9f9] p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] flex items-center">
                    <FileText className="mr-2" size={24} />
                    Threefish-256 Algorithm Overview
                </h3>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Input Processing
                    </h4>
                    <p className="text-gray-600 text-sm">
                        The 256-bit plaintext is divided into four 64-bit words. The 256-bit key is also 
                        divided into four 64-bit words, with an additional parity word computed.
                    </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Round Function (72 rounds total)
                    </h4>
                    <div className="space-y-3">
                        <div className="border-l-4 border-[#0056b3] pl-3">
                            <strong className="text-sm">Mix Operation:</strong>
                            <p className="text-xs text-gray-600 mt-1">
                                For each pair of words (w0,w1) and (w2,w3): Add first word to second, 
                                rotate second word by a round-specific amount, then XOR with first word.
                            </p>
                        </div>
                        <div className="border-l-4 border-[#0056b3] pl-3">
                            <strong className="text-sm">Permutation:</strong>
                            <p className="text-xs text-gray-600 mt-1">
                                Reorder the four words according to a specific permutation pattern 
                                to ensure good diffusion across all words.
                            </p>
                        </div>
                        <div className="border-l-4 border-[#0056b3] pl-3">
                            <strong className="text-sm">Subkey Addition:</strong>
                            <p className="text-xs text-gray-600 mt-1">
                                Every 4 rounds, add round-specific subkeys derived from the main key 
                                and tweak values to the data words.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-6 bg-[#0056b3] rounded-full mr-2"></span>| Final Output
                    </h4>
                    <p className="text-gray-600 text-sm">
                        After 72 rounds, perform final subkey addition to produce the 256-bit ciphertext.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderSimulation = () => (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-[#f9f9f9] p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] flex items-center">
                    <Play className="mr-2" size={24} />
                    Interactive Threefish Simulation
                </h3>
                
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Plaintext
                                </label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#007bff] focus:border-[#007bff] transition-colors bg-[#f9f9f9]"
                                    rows="3"
                                    value={plaintext}
                                    onChange={(e) => setPlaintext(e.target.value)}
                                    placeholder="Enter the message to encrypt..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    256-bit Key
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#007bff] focus:border-[#007bff] transition-colors font-mono bg-[#f9f9f9]"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="Enter a 256-bit key in hex format"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Encrypted Ciphertext
                                </label>
                                <textarea
                                    value={encryptedOutput}
                                    readOnly
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white font-mono text-sm break-all"
                                    rows="3"
                                    placeholder="Encrypted output will appear here..."
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Decrypted Plaintext
                                </label>
                                <textarea
                                    value={decryptedOutput}
                                    readOnly
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white font-mono text-sm break-all"
                                    rows="3"
                                    placeholder="Decrypted output will appear here..."
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Error message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Run Simulation Button */}
                    <div className="flex justify-center pt-6 border-t border-gray-200">
                        <button
                            onClick={handleRunSimulation}
                            disabled={isAnimating}
                            className="w-full max-w-md bg-gradient-to-r from-[#0056b3] to-[#007bff] text-white py-4 px-6 rounded-lg hover:from-[#007bff] hover:to-[#0056b3] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors duration-300 ease-in-out flex items-center justify-center text-lg font-semibold shadow-lg transform hover:scale-105"
                        >
                            {isAnimating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Running Simulation...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-3" size={20} />
                                    Run Simulation
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Visualization Controls */}
            {visualizationSteps.length > 0 && (
                <div className="bg-[#f9f9f9] p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xl font-semibold text-[#0056b3]">Step-by-Step Visualization</h4>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Speed:</label>
                            <select 
                                value={animationSpeed}
                                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-[#007bff] transition-colors"
                            >
                                <option value={1000}>Slow</option>
                                <option value={500}>Normal</option>
                                <option value={250}>Fast</option>
                                <option value={50}>Instant</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => handleStepControl('reset')}
                            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-200 shadow-sm"
                            title="Reset"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStepControl('prev')}
                            disabled={currentStep === 0}
                            className="p-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-full transition-colors duration-200 shadow-sm"
                            title="Previous Step"
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStepControl(isAnimating ? 'pause' : 'play')}
                            className="p-2 bg-[#0056b3] text-white hover:bg-[#007bff] rounded-full transition-colors duration-200 shadow-lg"
                            title={isAnimating ? 'Pause' : 'Play'}
                        >
                            {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStepControl('next')}
                            disabled={currentStep >= visualizationSteps.length}
                            className="p-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-full transition-colors duration-200 shadow-sm"
                            title="Next Step"
                        >
                            →
                        </button>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="mb-4">
                            <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-[#007bff] h-2 rounded-full transition-all duration-300"
                                    style={{width: `${(currentStep / Math.max(visualizationSteps.length, 1)) * 100}%`}}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Step {currentStep} of {visualizationSteps.length}
                            </p>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-4">
                            {visualizationSteps.slice(0, currentStep).map((step, index) => (
                                <div key={index} className="mb-4 last:mb-0">
                                    {step.type === 'header' && (
                                        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                                            <h3 className="font-bold text-[#0056b3]">{step.title}</h3>
                                            <p className="text-[#0056b3] text-sm">{step.description}</p>
                                        </div>
                                    )}
                                    
                                    {step.type === 'step' && (
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-gray-800">{step.title}</h4>
                                            <p className="text-gray-700 text-sm">{step.description}</p>
                                        </div>
                                    )}

                                    {step.type === 'round_header' && (
                                        <div className="bg-green-100 p-3 rounded-lg border border-green-300">
                                            <h4 className="font-semibold text-green-800">{step.title}</h4>
                                            <p className="text-green-700 text-sm">{step.description}</p>
                                        </div>
                                    )}

                                    {step.type === 'round_start' && (
                                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                            <p className="text-yellow-800 text-sm font-medium">
                                                {step.description}
                                            </p>
                                        </div>
                                    )}

                                    {step.type === 'state' && step.dataWords && (
                                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-medium text-gray-800">{step.title}</h5>
                                                {step.operation && (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            step.operation === 'mix' ? 'bg-[#007bff] text-white' :
                                                            step.operation === 'permute' ? 'bg-[#007bff] text-white' :
                                                            step.operation === 'subkey' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {step.operation.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {step.dataWords.map((word, i) => (
                                                    <WordBlock 
                                                        key={i}
                                                        word={word} 
                                                        index={i}
                                                        highlight={step.highlightPairs && step.highlightPairs.some(pair => pair.includes(i))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step.type === 'final_result' && step.dataWords && (
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                                            <h4 className="font-semibold text-green-800 mb-2">{step.title}</h4>
                                            <p className="text-green-700 text-sm mb-3">{step.description}</p>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {step.dataWords.map((word, i) => (
                                                    <WordBlock key={i} word={word} index={i} />
                                                ))}
                                            </div>
                                            {step.output && (
                                                <div className="bg-white p-3 rounded border">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {operation === 'encrypt' ? 'Final Ciphertext (Hex):' : 'Final Plaintext:'}
                                                    </label>
                                                    <div className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
                                                        {step.output}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f5f5f5] font-sans text-gray-900">
            {/* Header */}
            <div className="bg-[#f5f5f5] py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-center text-center">
                        <div>
                            <h1 className="text-3xl font-bold text-[#0056b3]">
                                Threefish Cipher Visualizer
                            </h1>
                            <p className="text-gray-600 mt-1">Interactive cryptographic learning platform</p>
                        </div>
                        
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-transparent flex justify-center mb-8">
                <div className="bg-white rounded-full shadow-md p-2 flex items-center space-x-2 border border-gray-200">
                    {[
                        { id: 'theory', label: 'Theory', icon: FileText },
                        { id: 'algorithm', label: 'Algorithm', icon: Key },
                        { id: 'simulation', label: 'Simulation', icon: Play }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                                activeTab === id
                                    ? 'bg-[#007bff] text-white shadow-md'
                                    : 'bg-white text-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'theory' && renderTheory()}
                {activeTab === 'algorithm' && renderAlgorithm()}
                {activeTab === 'simulation' && renderSimulation()}
            </div>

            {/* Footer */}
            <footer className="bg-white text-gray-500 py-4 mt-8 text-center border-t border-gray-200">
                <p>This app is for educational purposes only. Do not use for any sensitive data.</p>
            </footer>
        </div>
    );
};

export default App;
