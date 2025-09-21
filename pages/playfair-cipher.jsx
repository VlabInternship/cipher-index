import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Lock, Unlock, ChevronDown, RotateCcw } from "lucide-react";
import { useRouter } from "next/router";

// Main application component
const PlayfairCipher = () => {
    const router = useRouter();
    // State variables for the app
    // FIX: Changed initial tab to 'theory' as requested
    const [activeTab, setActiveTab] = useState('theory');
    const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
    const [text, setText] = useState('');
    const [key, setKey] = useState('');
    const [result, setResult] = useState('');
    const [visualizationSteps, setVisualizationSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [keySquare, setKeySquare] = useState([]);
    const [copied, setCopied] = useState(false);
    const [showAdvancedVisualization, setShowAdvancedVisualization] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [animationInterval, setAnimationInterval] = useState(null);

    // Reset the form and results
    const handleReset = () => {
        setText('');
        setKey('');
        setResult('');
        setVisualizationSteps([]);
        setCurrentStep(0);
        setIsAnimating(false);
        setCopied(false);
        setShowAdvancedVisualization(false);
        setAutoPlay(false);
        if (animationInterval) {
            clearInterval(animationInterval);
            setAnimationInterval(null);
        }
    };

    // Copy result to clipboard
    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = result;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    // The core Playfair encryption logic
    const playfairEncrypt = (plaintext, key) => {
        const steps = [];
        
        // Validate inputs
        if (!plaintext.trim()) {
            steps.push({
                type: 'error',
                title: 'Invalid Input',
                description: 'Please enter text to encrypt.',
            });
            setResult('Error: No text provided');
            setVisualizationSteps(steps);
            return;
        }
        
        if (!key.trim()) {
            steps.push({
                type: 'error',
                title: 'Invalid Key',
                description: 'Please enter a key.',
            });
            setResult('Error: No key provided');
            setVisualizationSteps(steps);
            return;
        }
        // Step 1: Preprocess the key
        steps.push({
            type: 'step',
            title: '1. Preprocessing the Key',
            description: `Removing spaces and duplicate letters from the key: "${key}"`,
        });
        const processedKey = [...new Set(key.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I'))].join('');
        steps.push({
            type: 'info',
            description: `Processed Key: "${processedKey}"`,
        });
        // Step 2: Create the 5x5 Key Square
        steps.push({
            type: 'step',
            title: '2. Creating the 5x5 Key Square',
            description: 'Filling the 5x5 grid with the key and remaining alphabet letters.',
        });
        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        let keySquareString = processedKey;
        for (let char of alphabet) {
            if (!keySquareString.includes(char)) {
                keySquareString += char;
            }
        }
        const newKeySquare = [];
        for (let i = 0; i < 5; i++) {
            newKeySquare.push(keySquareString.slice(i * 5, i * 5 + 5).split(''));
        }
        setKeySquare(newKeySquare);
        steps.push({
            type: 'keySquare',
            keySquare: newKeySquare,
        });
        // Step 3: Preprocess the plaintext
        steps.push({
            type: 'step',
            title: '3. Preprocessing the Plaintext',
            description: `Removing non-alphabetic characters and adding 'X' for repeating letters.`,
        });
        let processedText = plaintext.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
        steps.push({
            type: 'info',
            description: `Initial Plaintext: "${processedText}"`,
        });
        for (let i = 0; i < processedText.length; i += 2) {
            if (i + 1 < processedText.length && processedText[i] === processedText[i + 1]) {
                processedText = processedText.slice(0, i + 1) + 'X' + processedText.slice(i + 1);
                steps.push({
                    type: 'info',
                    description: `Added 'X' between identical letters: "${processedText}"`,
                });
            }
        }
        if (processedText.length % 2 !== 0) {
            processedText += 'X';
            steps.push({
                type: 'info',
                description: `Added 'X' to pad the text: "${processedText}"`,
            });
        }
        
        // Step 4: Encrypt the plaintext in digraphs
        steps.push({
            type: 'step',
            title: '4. Encrypting the Digraphs',
            description: 'Processing the plaintext in pairs.',
        });
        
        let encryptedText = '';
        for (let i = 0; i < processedText.length; i += 2) {
            const digraph = processedText.slice(i, i + 2);
            steps.push({
                type: 'digraph',
                digraph,
            });
            
            const [char1, char2] = digraph.split('');
            let pos1, pos2;
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (newKeySquare[row][col] === char1) pos1 = { row, col };
                    if (newKeySquare[row][col] === char2) pos2 = { row, col };
                }
            }
            let encryptedDigraph;
            let ruleDescription;
            if (pos1.row === pos2.row) {
                // Rule 1: Same row
                ruleDescription = 'Rule: Same Row. Each letter is replaced by the one to its immediate right (wrapping around).';
                encryptedDigraph = newKeySquare[pos1.row][(pos1.col + 1) % 5] + newKeySquare[pos2.row][(pos2.col + 1) % 5];
            } else if (pos1.col === pos2.col) {
                // Rule 2: Same column
                ruleDescription = 'Rule: Same Column. Each letter is replaced by the one immediately below it (wrapping around).';
                encryptedDigraph = newKeySquare[(pos1.row + 1) % 5][pos1.col] + newKeySquare[(pos2.row + 1) % 5][pos2.col];
            } else {
                // Rule 3: Rectangle
                ruleDescription = 'Rule: Rectangle. Each letter is replaced by the one on the same row, but at the other corner of the rectangle.';
                encryptedDigraph = newKeySquare[pos1.row][pos2.col] + newKeySquare[pos2.row][pos1.col];
            }
            steps.push({
                type: 'rule',
                ruleDescription,
                digraph,
                pos1,
                pos2,
                keySquare: newKeySquare,
            });
            encryptedText += encryptedDigraph;
            steps.push({
                type: 'encryptionResult',
                digraph,
                encryptedDigraph,
                totalResult: encryptedText,
            });
        }
        setResult(encryptedText);
        steps.push({
            type: 'finalResult',
            result: encryptedText,
        });
        setVisualizationSteps(steps);
    };

    // The core Playfair decryption logic
    const playfairDecrypt = (ciphertext, key) => {
        const steps = [];
        
        // Validate inputs
        if (!ciphertext.trim()) {
            steps.push({
                type: 'error',
                title: 'Invalid Input',
                description: 'Please enter text to decrypt.',
            });
            setResult('Error: No text provided');
            setVisualizationSteps(steps);
            return;
        }
        
        if (!key.trim()) {
            steps.push({
                type: 'error',
                title: 'Invalid Key',
                description: 'Please enter a key.',
            });
            setResult('Error: No key provided');
            setVisualizationSteps(steps);
            return;
        }
        
        // Add a check for an odd-length ciphertext
        if (ciphertext.length % 2 !== 0) {
            steps.push({
                type: 'error',
                title: 'Invalid Ciphertext',
                description: 'The ciphertext must have an even number of characters. Please check your input.',
            });
            setResult('Error: Invalid Ciphertext Length');
            setVisualizationSteps(steps);
            return;
        }
        
        // Step 1: Preprocess the key (same as encryption)
        steps.push({
            type: 'step',
            title: '1. Preprocessing the Key',
            description: `Removing spaces and duplicate letters from the key: "${key}"`,
        });
        const processedKey = [...new Set(key.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I'))].join('');
        steps.push({
            type: 'info',
            description: `Processed Key: "${processedKey}"`,
        });
        // Step 2: Create the 5x5 Key Square (same as encryption)
        steps.push({
            type: 'step',
            title: '2. Creating the 5x5 Key Square',
            description: 'Filling the 5x5 grid with the key and remaining alphabet letters.',
        });
        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        let keySquareString = processedKey;
        for (let char of alphabet) {
            if (!keySquareString.includes(char)) {
                keySquareString += char;
            }
        }
        const newKeySquare = [];
        for (let i = 0; i < 5; i++) {
            newKeySquare.push(keySquareString.slice(i * 5, i * 5 + 5).split(''));
        }
        setKeySquare(newKeySquare);
        steps.push({
            type: 'keySquare',
            keySquare: newKeySquare,
        });
        // Step 3: Decrypt the ciphertext in digraphs
        steps.push({
            type: 'step',
            title: '3. Decrypting the Digraphs',
            description: 'Processing the ciphertext in pairs.',
        });
        let decryptedText = '';
        for (let i = 0; i < ciphertext.length; i += 2) {
            const digraph = ciphertext.slice(i, i + 2);
            steps.push({
                type: 'digraph',
                digraph,
            });
            
            const [char1, char2] = digraph.split('');
            let pos1, pos2;
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (newKeySquare[row][col] === char1) pos1 = { row, col };
                    if (newKeySquare[row][col] === char2) pos2 = { row, col };
                }
            }
            
            // FIX: Added a check to prevent crash if a character is not found
            if (!pos1 || !pos2) {
                steps.push({
                    type: 'error',
                    title: 'Invalid Character in Ciphertext',
                    description: `The character "${!pos1 ? char1 : char2}" was not found in the key square. Ciphertext can only contain valid characters from the key square.`,
                });
                setVisualizationSteps(steps);
                return;
            }
            
            let decryptedDigraph;
            let ruleDescription;
            if (pos1.row === pos2.row) {
                // Rule 1: Same row (reverse of encryption)
                ruleDescription = 'Rule: Same Row. Each letter is replaced by the one to its immediate left (wrapping around).';
                decryptedDigraph = newKeySquare[pos1.row][(pos1.col - 1 + 5) % 5] + newKeySquare[pos2.row][(pos2.col - 1 + 5) % 5];
            } else if (pos1.col === pos2.col) {
                // Rule 2: Same column (reverse of encryption)
                ruleDescription = 'Rule: Same Column. Each letter is replaced by the one immediately above it (wrapping around).';
                decryptedDigraph = newKeySquare[(pos1.row - 1 + 5) % 5][pos1.col] + newKeySquare[(pos2.row - 1 + 5) % 5][pos2.col];
            } else {
                // Rule 3: Rectangle (same as encryption, roles reversed)
                ruleDescription = 'Rule: Rectangle. Each letter is replaced by the one on the same row, but at the other corner of the rectangle.';
                decryptedDigraph = newKeySquare[pos1.row][pos2.col] + newKeySquare[pos2.row][pos1.col];
            }
            steps.push({
                type: 'rule',
                ruleDescription,
                digraph,
                pos1,
                pos2,
                keySquare: newKeySquare,
            });
            decryptedText += decryptedDigraph;
            steps.push({
                type: 'decryptionResult',
                digraph,
                decryptedDigraph,
                totalResult: decryptedText,
            });
        }
        
        // Step 4: Removing filler 'X's with more robust logic
        steps.push({
            type: 'step',
            title: '4. Removing Filler Characters',
            description: `Removing the 'X's that were added as fillers during encryption.`,
        });
        // This is a more direct way to build the final plaintext
        let finalPlaintext = '';
        for (let i = 0; i < decryptedText.length; i++) {
            // Check for filler 'X' between two identical letters
            if (i > 0 && i < decryptedText.length - 1 && decryptedText[i] === 'X' && decryptedText[i-1] === decryptedText[i+1]) {
                steps.push({
                    type: 'info',
                    description: `Removed filler 'X' between identical letters: "${decryptedText.slice(0, i+2)}"`,
                });
                continue;
            }
            // Check for padding 'X' at the very end
            if (i === decryptedText.length - 1 && decryptedText[i] === 'X') {
                steps.push({
                    type: 'info',
                    description: `Removed padding 'X' from the end.`,
                });
                continue;
            }
            finalPlaintext += decryptedText[i];
        }
        steps.push({
            type: 'finalResult',
            result: finalPlaintext,
        });
        setResult(finalPlaintext);
        setVisualizationSteps(steps);
    };

    // Controls the step-by-step animation
    useEffect(() => {
        if (isAnimating && currentStep < visualizationSteps.length) {
            const timer = setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, 1000); // 1-second delay between steps
            return () => clearTimeout(timer);
        } else if (currentStep >= visualizationSteps.length) {
            setIsAnimating(false);
        }
    }, [isAnimating, currentStep, visualizationSteps.length]);

    // Handle explain button - shows step-by-step visualization
    const handleExplain = () => {
        setResult('');
        setVisualizationSteps([]);
        setCurrentStep(0);
        setIsAnimating(false);
        setCopied(false);
        setAutoPlay(false);
        if (animationInterval) {
            clearInterval(animationInterval);
            setAnimationInterval(null);
        }
        if (text.trim() !== '' && key.trim() !== '') {
            if (mode === 'encrypt') {
                playfairEncrypt(text, key);
            } else {
                playfairDecrypt(text, key);
            }
            setShowAdvancedVisualization(true);
            setCurrentStep(0);
        }
    };

    // Handle quick process - just encrypt/decrypt without visualization
    const handleQuickProcess = () => {
        setVisualizationSteps([]);
        setCurrentStep(0);
        setIsAnimating(false);
        setCopied(false);
        if (text.trim() !== '' && key.trim() !== '') {
            if (mode === 'encrypt') {
                playfairEncryptQuick(text, key);
            } else {
                playfairDecryptQuick(text, key);
            }
        }
    };

    // Handle form submission (legacy support)
    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        handleExplain();
    };

    // Navigation functions for advanced visualization
    const handleStepChange = (newIndex) => {
        if (newIndex >= 0 && newIndex < visualizationSteps.length) {
            setCurrentStep(newIndex);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToNextStep = () => {
        if (currentStep < visualizationSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const toggleAutoPlay = () => {
        if (autoPlay) {
            // Stop auto play
            setAutoPlay(false);
            setIsAnimating(false);
            if (animationInterval) {
                clearInterval(animationInterval);
                setAnimationInterval(null);
            }
        } else {
            // Start auto play
            setAutoPlay(true);
            setIsAnimating(true);
            const interval = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= visualizationSteps.length - 1) {
                        // Reached end, stop auto play
                        setAutoPlay(false);
                        setIsAnimating(false);
                        clearInterval(interval);
                        setAnimationInterval(null);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 2000);
            setAnimationInterval(interval);
        }
    };

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (animationInterval) {
                clearInterval(animationInterval);
            }
        };
    }, [animationInterval]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (!showAdvancedVisualization || visualizationSteps.length === 0) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    goToPreviousStep();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    goToNextStep();
                    break;
                case ' ':
                    event.preventDefault();
                    toggleAutoPlay();
                    break;
                case 'Home':
                    event.preventDefault();
                    handleStepChange(0);
                    break;
                case 'End':
                    event.preventDefault();
                    handleStepChange(visualizationSteps.length - 1);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showAdvancedVisualization, visualizationSteps.length, currentStep, autoPlay]);

    // Quick encrypt without visualization
    const playfairEncryptQuick = (plaintext, key) => {
        // Validate inputs
        if (!plaintext.trim() || !key.trim()) {
            setResult('Error: Please provide both text and key');
            return;
        }
        
        // Process the key
        const processedKey = [...new Set(key.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I'))].join('');
        
        // Create the 5x5 Key Square
        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        let keySquareString = processedKey;
        for (let char of alphabet) {
            if (!keySquareString.includes(char)) {
                keySquareString += char;
            }
        }
        const keySquare = [];
        for (let i = 0; i < 5; i++) {
            keySquare.push(keySquareString.slice(i * 5, i * 5 + 5).split(''));
        }
        
        // Process the plaintext
        let processedText = plaintext.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I');
        for (let i = 0; i < processedText.length; i += 2) {
            if (i + 1 < processedText.length && processedText[i] === processedText[i + 1]) {
                processedText = processedText.slice(0, i + 1) + 'X' + processedText.slice(i + 1);
            }
        }
        if (processedText.length % 2 !== 0) {
            processedText += 'X';
        }
        
        // Encrypt the plaintext
        let encryptedText = '';
        for (let i = 0; i < processedText.length; i += 2) {
            const [char1, char2] = processedText.slice(i, i + 2).split('');
            let pos1, pos2;
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (keySquare[row][col] === char1) pos1 = { row, col };
                    if (keySquare[row][col] === char2) pos2 = { row, col };
                }
            }
            
            let encryptedDigraph;
            if (pos1.row === pos2.row) {
                encryptedDigraph = keySquare[pos1.row][(pos1.col + 1) % 5] + keySquare[pos2.row][(pos2.col + 1) % 5];
            } else if (pos1.col === pos2.col) {
                encryptedDigraph = keySquare[(pos1.row + 1) % 5][pos1.col] + keySquare[(pos2.row + 1) % 5][pos2.col];
            } else {
                encryptedDigraph = keySquare[pos1.row][pos2.col] + keySquare[pos2.row][pos1.col];
            }
            encryptedText += encryptedDigraph;
        }
        setResult(encryptedText);
    };

    // Quick decrypt without visualization
    const playfairDecryptQuick = (ciphertext, key) => {
        // Validate inputs
        if (!ciphertext.trim() || !key.trim()) {
            setResult('Error: Please provide both text and key');
            return;
        }
        
        if (ciphertext.length % 2 !== 0) {
            setResult('Error: Invalid Ciphertext Length');
            return;
        }
        
        // Process the key
        const processedKey = [...new Set(key.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I'))].join('');
        
        // Create the 5x5 Key Square
        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        let keySquareString = processedKey;
        for (let char of alphabet) {
            if (!keySquareString.includes(char)) {
                keySquareString += char;
            }
        }
        const keySquare = [];
        for (let i = 0; i < 5; i++) {
            keySquare.push(keySquareString.slice(i * 5, i * 5 + 5).split(''));
        }
        
        // Decrypt the ciphertext
        let decryptedText = '';
        for (let i = 0; i < ciphertext.length; i += 2) {
            const [char1, char2] = ciphertext.slice(i, i + 2).split('');
            let pos1, pos2;
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (keySquare[row][col] === char1) pos1 = { row, col };
                    if (keySquare[row][col] === char2) pos2 = { row, col };
                }
            }
            
            // Check if characters are found
            if (!pos1 || !pos2) {
                setResult(`Error: Invalid character "${!pos1 ? char1 : char2}" in ciphertext`);
                return;
            }
            
            let decryptedDigraph;
            if (pos1.row === pos2.row) {
                decryptedDigraph = keySquare[pos1.row][(pos1.col - 1 + 5) % 5] + keySquare[pos2.row][(pos2.col - 1 + 5) % 5];
            } else if (pos1.col === pos2.col) {
                decryptedDigraph = keySquare[(pos1.row - 1 + 5) % 5][pos1.col] + keySquare[(pos2.row - 1 + 5) % 5][pos2.col];
            } else {
                decryptedDigraph = keySquare[pos1.row][pos2.col] + keySquare[pos2.row][pos1.col];
            }
            decryptedText += decryptedDigraph;
        }
        
        // Remove filler 'X's
        let finalPlaintext = '';
        for (let i = 0; i < decryptedText.length; i++) {
            if (i > 0 && i < decryptedText.length - 1 && decryptedText[i] === 'X' && decryptedText[i-1] === decryptedText[i+1]) {
                continue;
            }
            if (i === decryptedText.length - 1 && decryptedText[i] === 'X') {
                continue;
            }
            finalPlaintext += decryptedText[i];
        }
        setResult(finalPlaintext);
    };

    // Advanced Playfair Visualization Component
    const PlayfairVisualization = ({ 
        isAnimating, 
        visualizationSteps, 
        currentStepIndex, 
        mode,
        onStepChange,
        onToggleAnimation
    }) => {
        if (visualizationSteps.length === 0) return null;
        
        const currentStep = visualizationSteps[currentStepIndex] || {};
        const stepNames = {
            'step': 'Process Step',
            'info': 'Information',
            'keySquare': 'Key Square',
            'digraph': 'Digraph Processing',
            'rule': 'Cipher Rule',
            'encryptionResult': 'Encryption Result',
            'decryptionResult': 'Decryption Result',
            'finalResult': 'Final Result',
            'error': 'Error'
        };

        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200 p-6">
                <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    Playfair Cipher Visualization
                </h3>
                
                {/* Navigation Controls */}
                <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
                            disabled={currentStepIndex === 0}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            <ChevronDown className="rotate-90" size={16} />
                            Previous
                        </button>
                        
                        <button
                            onClick={onToggleAnimation}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                                isAnimating 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                                    : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                        >
                            {isAnimating ? (
                                <>
                                    <RotateCcw size={16} />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    Auto Play
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => onStepChange(Math.min(visualizationSteps.length - 1, currentStepIndex + 1))}
                            disabled={currentStepIndex === visualizationSteps.length - 1}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            Next
                            <ChevronDown className="-rotate-90" size={16} />
                        </button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                        Step {currentStepIndex + 1} of {visualizationSteps.length}
                    </div>
                </div>

                {/* Step Timeline */}
                <div className="mb-6 bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-medium text-gray-700 mb-3">Step Timeline</div>
                    <div className="flex gap-1 overflow-x-auto pb-2">
                        {visualizationSteps.map((step, index) => (
                            <button
                                key={index}
                                onClick={() => onStepChange(index)}
                                className={`min-w-[60px] h-8 rounded text-xs font-medium transition-all ${
                                    index === currentStepIndex
                                        ? 'bg-blue-500 text-white scale-105 shadow-md'
                                        : index < currentStepIndex
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                                title={stepNames[step.type] || 'Step'}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Current Step Display */}
                <div className="bg-white rounded-lg border border-blue-200 p-6 mb-6">
                    <div className="flex items-center gap-2 text-blue-700 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-lg">
                            {stepNames[currentStep.type] || 'Processing...'}
                        </span>
                        <span className="text-sm bg-blue-50 px-2 py-1 rounded-full">
                            Step {currentStepIndex + 1}/{visualizationSteps.length}
                        </span>
                    </div>
                    
                    {/* Step Content */}
                    <div className="space-y-4">
                        {currentStep.title && (
                            <h4 className="font-bold text-blue-700">{currentStep.title}</h4>
                        )}
                        {currentStep.description && (
                            <p className="text-gray-700">{currentStep.description}</p>
                        )}
                        
                        {/* Key Square Display */}
                        {currentStep.keySquare && (
                            <div className="flex justify-center my-4">
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <div className="text-sm font-medium text-gray-700 mb-2 text-center">
                                        5×5 Key Square
                                    </div>
                                    <table className="border-collapse">
                                        <tbody>
                                            {currentStep.keySquare.map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((cell, j) => {
                                                        const isHighlighted = currentStep.pos1 && currentStep.pos2 && 
                                                            ((i === currentStep.pos1.row && j === currentStep.pos1.col) ||
                                                             (i === currentStep.pos2.row && j === currentStep.pos2.col));
                                                        return (
                                                            <td 
                                                                key={j} 
                                                                className={`border border-gray-400 p-2 w-10 h-10 text-center font-mono text-sm transition-all ${
                                                                    isHighlighted ? 'bg-yellow-200 border-yellow-500 scale-110' : 'bg-white'
                                                                }`}
                                                            >
                                                                {cell}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {/* Digraph Processing */}
                        {currentStep.digraph && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="text-center">
                                    <span className="text-lg font-bold">Processing Digraph: </span>
                                    <span className="text-2xl font-mono bg-blue-100 px-3 py-1 rounded text-blue-800">
                                        {currentStep.digraph}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* Results */}
                        {(currentStep.encryptedDigraph || currentStep.decryptedDigraph) && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="text-center">
                                    <span className="text-blue-600 font-mono text-lg">{currentStep.digraph}</span>
                                    <span className="mx-3 text-gray-500">→</span>
                                    <span className="text-green-600 font-mono text-lg font-bold">
                                        {currentStep.encryptedDigraph || currentStep.decryptedDigraph}
                                    </span>
                                </div>
                                {currentStep.totalResult && (
                                    <div className="text-center mt-2 text-sm text-gray-600">
                                        Total Result: <span className="font-mono font-bold">{currentStep.totalResult}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Step Progress Indicator */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{Math.round((currentStepIndex + 1) / visualizationSteps.length * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStepIndex + 1) / visualizationSteps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* Keyboard Hints */}
                <div className="text-xs text-gray-500 text-center">
                    💡 Keyboard shortcuts: ← → navigate steps • Space pause/play • Home/End jump to start/end
                </div>
            </div>
        );
    };

    // UI components for each section
    const renderTheory = () => (
        <div className="p-8 space-y-6 text-gray-800">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Introduction</h3>
                <p className="text-gray-700 leading-relaxed">
                    The <span className="font-semibold text-[#007bff]">Playfair cipher</span>, also known as the Wheatstone-Playfair cipher, 
                    is a manual symmetric encryption technique distinguished as the first literal digram substitution cipher. Unlike simpler 
                    substitution ciphers that encrypt single letters, Playfair operates on pairs of letters, known as bigrams or digrams. 
                    This innovation makes it significantly harder to break using simple frequency analysis, which was the primary attack 
                    vector against monoalphabetic ciphers of the time.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Origin Story</h3>
                <p className="text-gray-700 leading-relaxed">
                    The cipher's history is often confused, as it was invented by <span className="font-semibold text-[#007bff]">Charles Wheatstone</span> in 1854. 
                    However, it became famous and was widely promoted by <span className="font-semibold text-[#007bff]">Lord Playfair</span>, after whom it was named. 
                    This cipher marked a major step forward from the simple Caesar cipher and more complex Vigenère systems then in use, 
                    as it provided a greater level of security with a simple, easy-to-implement method.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Core Idea</h3>
                <p className="text-gray-700 leading-relaxed">
                    The core idea behind the Playfair cipher is <span className="font-semibold text-[#007bff]">polygraphic substitution</span>. 
                    By encrypting pairs of letters, it hides the frequency of individual letters in the plaintext. For example, the common 
                    letter "E" might be paired with different letters to form various digrams, which would then be encrypted into completely 
                    different ciphertext digrams. While bigram frequency analysis is still possible, it is considerably more difficult than 
                    single-letter analysis.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Technical Blueprint</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    The Playfair cipher uses a 5x5 grid of letters as its key. This grid is constructed from a secret keyword or phrase 
                    with all duplicate letters removed, followed by the remaining letters of the alphabet. The letter 'J' is typically 
                    omitted and combined with 'I' to fit the 25-letter grid.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                    To encrypt a message, the plaintext is first prepared by breaking it into digrams. If a digram contains two identical 
                    letters (e.g., 'LL'), an 'X' is inserted between them. If the message has an odd number of letters, an 'X' is appended 
                    to the end to complete the final digram. Each prepared digram is then encrypted using one of three rules based on the 
                    positions of its two letters in the 5x5 grid:
                </p>
                <div className="bg-[#f9f9f9] rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                        <span className="bg-[#007bff] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                        <div>
                            <span className="font-semibold text-[#0056b3]">Same Row:</span>
                            <span className="text-gray-700"> If the letters are on the same row, each is replaced by the letter to its immediate right, wrapping around if necessary.</span>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="bg-[#007bff] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                        <div>
                            <span className="font-semibold text-[#0056b3]">Same Column:</span>
                            <span className="text-gray-700"> If the letters are in the same column, each is replaced by the letter immediately below it, also wrapping around.</span>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="bg-[#007bff] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                        <div>
                            <span className="font-semibold text-[#0056b3]">Different Row and Column:</span>
                            <span className="text-gray-700"> If the letters form a rectangle, each is replaced by the letter in its own row but in the column of the other letter of the digram.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Security Scorecard</h3>
                <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                    <div className="flex items-center">
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mr-3">
                            INSECURE - OBSOLETE
                        </div>
                    </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                    The Playfair cipher provided a significant security enhancement over its predecessors, but it is now regarded as insecure. 
                    Its vulnerability to bigram frequency analysis and other sophisticated cryptanalytic techniques, which were developed before 
                    World War I, led to its military deprecation. A notable vulnerability is that a digram and its reverse (e.g., 'AB' and 'BA') 
                    will decrypt to a plaintext pattern that is also reversed (e.g., 'RE' and 'ER'). This is particularly problematic in English, 
                    which contains many words with reversed digrams (e.g., 'receiver').
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Real-World Usage</h3>
                <p className="text-gray-700 leading-relaxed">
                    The Playfair cipher was employed by military forces for tactical field communications during combat. A typical use case 
                    was to protect important but non-critical information, such as an order for an artillery barrage to cover an advance. 
                    Its simplicity and the ability to perform the encryption manually in the field made it an attractive option until the 
                    advent of automated encryption devices rendered it obsolete.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-[#0056b3] border-b-2 border-[#007bff] pb-2">Solved Example</h3>
                <div className="bg-[#f9f9f9] rounded-lg p-6">
                    <p className="text-gray-700 mb-4">
                        <strong>Plaintext:</strong> <span className="font-mono text-[#007bff] bg-white px-2 py-1 rounded">HELLO WORLD</span>
                    </p>
                    <p className="text-gray-700 mb-4">
                        <strong>Keyword:</strong> <span className="font-mono text-[#007bff] bg-white px-2 py-1 rounded">KEYWORD</span>
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-[#0056b3] mb-2">Step 1: Construct the Key Matrix</h4>
                            <div className="bg-white p-4 rounded-lg">
                                <table className="mx-auto border-collapse">
                                    <tbody>
                                        {['KEYWO', 'RDABC', 'FGHIL', 'MNPQS', 'TUVXZ'].map((row, i) => (
                                            <tr key={i}>
                                                {row.split('').map((cell, j) => (
                                                    <td key={j} className="border border-gray-400 p-3 text-center font-mono text-gray-700 w-12 h-12">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-[#0056b3] mb-2">Step 2: Prepare the Plaintext</h4>
                            <p className="text-gray-700 mb-2">The plaintext is broken into digrams, and an 'X' is inserted to handle repeated letters or an odd-length message.</p>
                            <p className="font-mono bg-white p-2 rounded">
                                <span className="text-gray-600">HELLO WORLD</span> becomes <span className="text-[#007bff]">HE LX LO WO RL DX</span>
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-[#0056b3] mb-2">Step 3: Encrypt Each Digram</h4>
                            <p className="text-gray-700 mb-2">The encryption rules are applied to each digram using the key matrix.</p>
                            <div className="bg-white p-4 rounded-lg font-mono text-sm space-y-1">
                                <div>HE → EH</div>
                                <div>LX → VS</div>
                                <div>LO → SC</div>
                                <div>WO → NY</div>
                                <div>RL → GC</div>
                                <div>DX → BT</div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-gray-700 mt-4">
                        <strong>Ciphertext:</strong> <span className="font-mono text-green-600 bg-white px-2 py-1 rounded font-bold">EHVSSCNYGCBT</span>
                    </p>
                </div>
            </div>
        </div>
    );
    
    const renderExample = () => (
        <div className="p-8 space-y-6 text-gray-800">
            <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-[#0056b3]">Example of Playfair Encryption</h3>
            <p className="text-gray-700 leading-relaxed">
                Let's encrypt the plaintext <code className="font-mono text-[#007bff]">"HIDE THE GOLD"</code> using the key <code className="font-mono text-[#007bff]">"MONARCHY"</code>.
            </p>
            <h4 className="text-lg font-medium mt-4 text-[#0056b3]">Step 1: Create Key Square</h4>
            <p className="text-gray-700 mt-2">
                The key "MONARCHY" gives us the key square:
            </p>
            <div className="flex justify-center my-4">
                <table className="border-collapse table-auto text-center">
                    <tbody>
                        {[...new Array(5)].map((_, i) => (
                            <tr key={i}>
                                {[...new Array(5)].map((_, j) => {
                                    const alphabet = 'MONARCHY';
                                    const keySquareChars = [...new Set(alphabet.toUpperCase().replace(/[^A-Z]/g, '').replace('J', 'I'))];
                                    const allChars = [...keySquareChars];
                                    for (let char of 'ABCDEFGHIKLMNOPQRSTUVWXYZ') {
                                        if (!allChars.includes(char)) {
                                            allChars.push(char);
                                        }
                                    }
                                    const char = allChars[i * 5 + j];
                                    return <td key={j} className="border border-gray-400 p-2 text-gray-700 font-mono w-10 h-10">{char}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h4 className="text-lg font-medium mt-4 text-[#0056b3]">Step 2: Process Plaintext</h4>
            <p className="text-gray-700 mt-2">
                Plaintext "HIDETHEGOLD" becomes "HI DE TH EG OL DX" (note 'DX' is padded).
            </p>
            <h4 className="text-lg font-medium mt-4 text-[#0056b3]">Step 3: Encrypt Digraphs</h4>
            <ul className="list-disc list-inside text-gray-700 mt-2">
                <li><code className="font-mono">HI</code>: Same row. Becomes <code className="font-mono">NA</code>.</li>
                <li><code className="font-mono">DE</code>: Rectangle. Becomes <code className="font-mono">KL</code>.</li>
                <li>...and so on.</li>
            </ul>
            </div>
        </div>
    );
    const renderSimulation = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive Playfair Tool</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                        <select
                            value={mode}
                            onChange={(e) => {
                                const newMode = e.target.value;
                                const oldMode = mode;
                                
                                // If we have a result, use it as input for the opposite operation
                                if (result && !result.startsWith('Error:')) {
                                    if (newMode === 'decrypt' && oldMode === 'encrypt') {
                                        // Switching from encrypt to decrypt: use ciphertext as input
                                        setText(result);
                                    } else if (newMode === 'encrypt' && oldMode === 'decrypt') {
                                        // Switching from decrypt to encrypt: use plaintext as input
                                        setText(result);
                                    }
                                }
                                
                                setMode(newMode);
                                // Clear output when switching modes
                                setResult("");
                                setVisualizationSteps([]);
                                setCurrentStep(0);
                                setIsAnimating(false);
                                setCopied(false);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="encrypt">🔒 Encrypt (Plaintext → Ciphertext)</option>
                            <option value="decrypt">🔓 Decrypt (Ciphertext → Plaintext)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Key</label>
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter keyword..."
                            title="Enter Playfair key (any alphabetic text)"
                            disabled={isAnimating}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Key will be processed to remove duplicates and non-alphabetic characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
                        </label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={mode === 'encrypt' ? 'Enter text to encrypt...' : 'Enter text to decrypt...'}
                            title={mode === 'encrypt' 
                                ? "Enter plaintext (alphabetic characters)"
                                : "Enter ciphertext (alphabetic characters)"
                            }
                            disabled={isAnimating}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {mode === 'encrypt' 
                                ? 'Non-alphabetic characters will be removed, J→I substitution applied'
                                : 'Enter the ciphertext exactly as received • Switch modes to auto-populate with previous result'
                            }
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {mode === 'encrypt' ? 'Ciphertext' : 'Decrypted Text'}
                        </label>
                        <input
                            type="text"
                            value={result}
                            readOnly
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                            placeholder="Result will appear here..."
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handleExplain}
                        disabled={isAnimating || text.trim() === '' || key.trim() === ''}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Play size={18} />
                        {isAnimating ? "Visualizing..." : "Explain"}
                    </button>

                    <button
                        onClick={handleQuickProcess}
                        disabled={text.trim() === '' || key.trim() === ''}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {mode === "encrypt" ? <Lock size={18} /> : <Unlock size={18} />}
                        {mode === "encrypt" ? "Encrypt" : "Decrypt"}
                    </button>

                    {/* Quick Fill Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setKey("MONARCHY");
                                setText("HIDE THE GOLD");
                                setMode("encrypt");
                                setResult("");
                                setVisualizationSteps([]);
                                setCurrentStep(0);
                                setIsAnimating(false);
                                setCopied(false);
                            }}
                            className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                        >
                            📝 Sample Data
                        </button>
                        
                        <button
                            onClick={() => {
                                setKey("");
                                setText("");
                                setResult("");
                                setVisualizationSteps([]);
                                setCurrentStep(0);
                                setIsAnimating(false);
                                setCopied(false);
                            }}
                            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                            🗑️ Clear All
                        </button>
                    </div>
                </div>
            
            {/* Result Display */}
            {result && !result.startsWith('Error:') && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">
                            {mode === 'encrypt' ? 'Ciphertext' : 'Decrypted Text'}
                        </h3>
                        <button
                            onClick={copyToClipboard}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                        >
                            {copied ? (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-gray-800 break-all text-lg">
                        {result}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {result && result.startsWith('Error:') && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    {result.replace('Error: ', '')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Validation Status */}
            {(key || text) && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="font-medium mb-2 text-blue-700">📋 Input Status:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center gap-1 ${!key.trim() ? 'text-red-600' : 'text-green-600'}`}>
                                {!key.trim() ? '❌' : '✅'} Key: {key.length} chars
                                {!key.trim() && ' (Required)'}
                            </div>
                            <div className={`flex items-center gap-1 ${!text.trim() ? 'text-red-600' : 'text-green-600'}`}>
                                {!text.trim() ? '❌' : '✅'} {mode === "encrypt" ? "Plaintext" : "Ciphertext"}: {text.length} chars
                                {!text.trim() && ' (Required)'}
                            </div>
                        </div>
                        {key && text && (
                            <div className="mt-2 text-xs text-blue-600">
                                ✅ Ready to {mode}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Visualization */}
            {showAdvancedVisualization && (
                <PlayfairVisualization
                    isAnimating={autoPlay}
                    visualizationSteps={visualizationSteps}
                    currentStepIndex={currentStep}
                    mode={mode}
                    onStepChange={handleStepChange}
                    onToggleAnimation={toggleAutoPlay}
                />
            )}
            
            {/* Static Visualization Log - only show when not using advanced visualization */}
            {!showAdvancedVisualization && visualizationSteps.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Step-by-Step Visualization</h3>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">
                                {currentStep} / {visualizationSteps.length}
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${(currentStep / visualizationSteps.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    
                    {visualizationSteps.some(step => step.type === 'error') && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{visualizationSteps.find(step => step.type === 'error').description}</p>
                        </div>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto font-mono border border-gray-200">
                        {visualizationSteps.slice(0, currentStep).map((step, index) => (
                            <div key={index} className="mb-4">
                                {step.type === 'step' && <p className="font-bold text-blue-700">{step.title}</p>}
                                <p className="text-gray-600">{step.description}</p>
                                {step.type === 'info' && <p className="bg-gray-100 p-2 rounded-lg my-1 text-gray-800">{step.description}</p>}
                                {step.type === 'keySquare' && (
                                    <div className="flex justify-center my-4">
                                        <table className="border-collapse table-auto text-center text-xs">
                                            <tbody>
                                                {step.keySquare.map((row, i) => (
                                                    <tr key={i}>
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="border border-gray-400 p-1 w-8 h-8 font-mono text-gray-700">{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {(step.type === 'digraph' && mode === 'encrypt') && (
                                    <p className="mt-2 text-lg font-bold">Encrypting Digraph: <span className="text-blue-600">{step.digraph}</span></p>
                                )}
                                {(step.type === 'digraph' && mode === 'decrypt') && (
                                    <p className="mt-2 text-lg font-bold">Decrypting Digraph: <span className="text-blue-600">{step.digraph}</span></p>
                                )}
                                {step.type === 'rule' && (
                                    <>
                                        <p className="text-gray-700 mt-2">{step.ruleDescription}</p>
                                        <div className="flex justify-center my-4">
                                            <table className="border-collapse table-auto text-center text-xs">
                                                <tbody>
                                                    {step.keySquare.map((row, i) => (
                                                        <tr key={i}>
                                                            {row.map((cell, j) => {
                                                                const isChar1 = i === step.pos1.row && j === step.pos1.col;
                                                                const isChar2 = i === step.pos2.row && j === step.pos2.col;
                                                                const bgColor = isChar1 || isChar2 ? 'bg-yellow-200' : 'bg-white';
                                                                return (
                                                                    <td key={j} className={`border border-gray-400 p-1 w-8 h-8 font-mono text-gray-700 transition-all ${bgColor}`}>{cell}</td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                                {step.type === 'encryptionResult' && (
                                    <p className="mt-2">
                                        <span className="text-blue-600">{step.digraph}</span> becomes <span className="text-green-600 font-bold">{step.encryptedDigraph}</span>. Current Ciphertext: <span className="text-gray-800 font-bold">{step.totalResult}</span>
                                    </p>
                                )}
                                {step.type === 'decryptionResult' && (
                                    <p className="mt-2">
                                        <span className="text-blue-600">{step.digraph}</span> becomes <span className="text-green-600 font-bold">{step.decryptedDigraph}</span>. Current Plaintext: <span className="text-gray-800 font-bold">{step.totalResult}</span>
                                    </p>
                                )}
                                {step.type === 'finalResult' && (
                                    <p className="mt-4 text-lg font-bold">
                                        {mode === 'encrypt' ? 'Final Ciphertext' : 'Final Plaintext'}: <span className="text-green-600">{step.result}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Animation Controls */}
                    <div className="flex justify-center space-x-2 mt-4">
                        <button
                            onClick={() => setIsAnimating(!isAnimating)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            disabled={currentStep >= visualizationSteps.length}
                        >
                            {isAnimating ? 'Pause' : currentStep > 0 ? 'Resume' : 'Start Animation'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentStep(0);
                                setIsAnimating(false);
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Reset Steps
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </button>
                </div>
                
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Playfair Cipher</h1>
                    <p className="text-gray-600">Encrypt, decrypt, and visualize the Playfair cipher step by step</p>
                </header>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg shadow-md p-1">
                        <button
                            onClick={() => setActiveTab('theory')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                activeTab === 'theory' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Theory
                        </button>
                        <button
                            onClick={() => setActiveTab('example')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                activeTab === 'example' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Example
                        </button>
                        <button
                            onClick={() => setActiveTab('simulation')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                activeTab === 'simulation' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Cipher
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'theory' && renderTheory()}
                {activeTab === 'example' && renderExample()}
                {activeTab === 'simulation' && renderSimulation()}
            </div>
        </div>
    );
};

export default PlayfairCipher;
