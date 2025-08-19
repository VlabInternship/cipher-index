import React, { useState, useEffect } from 'react';
// Main application component
const App = () => {
    // State variables for the app
    const [activeTab, setActiveTab] = useState('simulation');
    const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
    const [text, setText] = useState('');
    const [key, setKey] = useState('');
    const [result, setResult] = useState('');
    const [visualizationSteps, setVisualizationSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [keySquare, setKeySquare] = useState([]);
    const [copied, setCopied] = useState(false);
    // Reset the form and results
    const handleReset = () => {
        setText('');
        setKey('');
        setResult('');
        setVisualizationSteps([]);
        setCurrentStep(0);
        setIsAnimating(false);
        setCopied(false);
    };
    // Copy result to clipboard
    const copyToClipboard = () => {
        if (result) {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
        setText(encryptedText); // Populate the input for decryption
        setMode('decrypt'); // Switch to decrypt mode
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
    // Handle form submission and start visualization
    const handleSubmit = (e) => {
        e.preventDefault();
        setResult('');
        setVisualizationSteps([]);
        setCurrentStep(0);
        setIsAnimating(false);
        setCopied(false);
        if (text.trim() !== '' && key.trim() !== '') {
            if (mode === 'encrypt') {
                playfairEncrypt(text, key);
            } else {
                playfairDecrypt(text, key);
            }
            setIsAnimating(true);
        }
    };
    // UI components for each section
    const renderTheory = () => (
        <div className="p-6 bg-[#f9f9f9] rounded-2xl shadow-inner">
            <h3 className="text-xl font-semibold mb-4 text-[#0056b3]">Theory of the Playfair Cipher</h3>
            <p className="text-gray-700 leading-relaxed">
                The Playfair cipher is a manual symmetric encryption technique invented by Charles Wheatstone in 1854. Unlike modern ciphers that encrypt single letters, Playfair encrypts pairs of letters (digraphs), making it significantly more difficult to break than simple substitution ciphers.
            </p>
            <h4 className="text-lg font-medium mt-4 text-[#0056b3]">Key Square Creation</h4>
            <ul className="list-disc list-inside text-gray-700 mt-2">
                <li>A 5x5 matrix is created using a keyword.</li>
                <li>The keyword is placed in the matrix, with duplicate letters removed.</li>
                <li>The remaining squares are filled with the rest of the alphabet, in order. (Note: 'J' is typically omitted and treated as 'I').</li>
            </ul>
            <h4 className="text-lg font-medium mt-4 text-[#0056b3]">Encryption Rules</h4>
            <p className="text-gray-700 mt-2">
                The plaintext is broken into digraphs. If a pair has two identical letters, an 'X' (or another filler letter) is inserted. The following rules are applied to each digraph:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mt-2">
                <li>If the letters are in the same row, each letter is replaced by the letter to its immediate right (wrapping around).</li>
                <li>If the letters are in the same column, each letter is replaced by the one immediately below it (wrapping around).</li>
                <li>If the letters form a rectangle, each letter is replaced by the letter on the same row but at the other corner of the rectangle.</li>
            </ol>
            <h4 className="text-lg font-medium mt-4 text-[#0056b3]">Decryption Rules</h4>
            <p className="text-gray-700 mt-2">
                The decryption process is the reverse of encryption, but the digraphs are processed in the same way. The rules for converting a ciphertext digraph back to a plaintext digraph are:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mt-2">
                <li>If the letters are in the same row, each letter is replaced by the one to its immediate left (wrapping around).</li>
                <li>If the letters are in the same column, each letter is replaced by the one immediately above it (wrapping around).</li>
                <li>If the letters form a rectangle, each letter is replaced by the one on the same row but at the other corner of the rectangle.</li>
            </ol>
        </div>
    );
    const renderExample = () => (
        <div className="p-6 bg-[#f9f9f9] rounded-2xl shadow-inner">
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
    );
    const renderSimulation = () => (
        <div className="p-6 bg-[#f9f9f9] rounded-2xl shadow-inner">
            <h3 className="text-xl font-semibold mb-4 text-[#0056b3]">Interactive Simulation</h3>
            {/* Mode Toggle */}
            <div className="flex justify-center mb-4 space-x-2">
                <button
                    onClick={() => setMode('encrypt')}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        mode === 'encrypt' ? 'bg-[#007bff] text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Encrypt
                </button>
                <button
                    onClick={() => setMode('decrypt')}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        mode === 'decrypt' ? 'bg-[#007bff] text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Decrypt
                </button>
            </div>
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
                        {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
                    </label>
                    <input
                        type="text"
                        id="text-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                        placeholder={mode === 'encrypt' ? 'e.g., Hello World' : 'e.g., NAZBQCYV'}
                        disabled={isAnimating}
                    />
                </div>
                <div>
                    <label htmlFor="key" className="block text-sm font-medium text-gray-700">Key</label>
                    <input
                        type="text"
                        id="key"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                        placeholder="e.g., keyword"
                        disabled={isAnimating}
                    />
                </div>
                <div className="flex space-x-2">
                    <button
                        type="submit"
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#007bff] hover:bg-[#0056b3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007bff] transition-colors"
                        disabled={isAnimating || text.trim() === '' || key.trim() === ''}
                    >
                        {isAnimating ? (mode === 'encrypt' ? 'Encrypting...' : 'Decrypting...') : (mode === 'encrypt' ? 'Encrypt' : 'Decrypt')}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007bff] transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </form>
            
            {/* Result Display */}
            {result && (
                <div className="mt-6 p-4 bg-white rounded-lg shadow">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-medium text-[#0056b3]">
                            {mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}:
                        </h4>
                        <button
                            onClick={copyToClipboard}
                            className="text-sm text-[#007bff] hover:text-[#0056b3] flex items-center"
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-gray-800 break-all">
                        {result}
                    </div>
                </div>
            )}
            
            {/* Visualization Log */}
            {visualizationSteps.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xl font-semibold text-[#0056b3]">Step-by-Step Visualization</h4>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">
                                {currentStep} / {visualizationSteps.length}
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className="bg-[#007bff] h-2.5 rounded-full transition-all duration-300" 
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
                    
                    <div className="bg-white p-4 rounded-xl shadow-inner h-64 overflow-y-auto font-mono">
                        {visualizationSteps.slice(0, currentStep).map((step, index) => (
                            <div key={index} className="mb-4">
                                {step.type === 'step' && <p className="font-bold text-[#0056b3]">{step.title}</p>}
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
                                    <p className="mt-2 text-lg font-bold">Encrypting Digraph: <span className="text-[#007bff]">{step.digraph}</span></p>
                                )}
                                {(step.type === 'digraph' && mode === 'decrypt') && (
                                    <p className="mt-2 text-lg font-bold">Decrypting Digraph: <span className="text-[#007bff]">{step.digraph}</span></p>
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
                                        <span className="text-[#007bff]">{step.digraph}</span> becomes <span className="text-green-600 font-bold">{step.encryptedDigraph}</span>. Current Ciphertext: <span className="text-gray-800 font-bold">{step.totalResult}</span>
                                    </p>
                                )}
                                {step.type === 'decryptionResult' && (
                                    <p className="mt-2">
                                        <span className="text-[#007bff]">{step.digraph}</span> becomes <span className="text-green-600 font-bold">{step.decryptedDigraph}</span>. Current Plaintext: <span className="text-gray-800 font-bold">{step.totalResult}</span>
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
                    <div className="flex justify-center space-x-2">
                        <button
                            onClick={() => setIsAnimating(!isAnimating)}
                            className="px-4 py-2 bg-[#007bff] text-white rounded-md hover:bg-[#0056b3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007bff] transition-colors"
                            disabled={currentStep >= visualizationSteps.length}
                        >
                            {isAnimating ? 'Pause' : currentStep > 0 ? 'Resume' : 'Start Animation'}
                        </button>
                        <button
                            onClick={() => {
                                setCurrentStep(0);
                                setIsAnimating(false);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                        >
                            Reset Steps
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
    return (
        <div className="bg-[#f5f5f5] text-gray-800 p-6">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto my-8">
                {/* Header Section */}
                <div className="p-8 bg-white border-b border-gray-200 text-center">
                    <h1 className="text-4xl font-bold text-[#0056b3] mb-2">Playfair Cipher</h1>
                    <p className="text-gray-600 text-lg">Learn, simulate, and understand the encryption and decryption process</p>
                </div>
                {/* Tab Navigation */}
                <div className="bg-gray-100 flex justify-center py-2 px-4 space-x-2">
                    <button
                        onClick={() => setActiveTab('theory')}
                        className={`py-2 px-6 rounded-full font-medium transition-colors ${
                            activeTab === 'theory' ? 'bg-[#007bff] text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Theory
                    </button>
                    <button
                        onClick={() => setActiveTab('example')}
                        className={`py-2 px-6 rounded-full font-medium transition-colors ${
                            activeTab === 'example' ? 'bg-[#007bff] text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Example
                    </button>
                    <button
                        onClick={() => setActiveTab('simulation')}
                        className={`py-2 px-6 rounded-full font-medium transition-colors ${
                            activeTab === 'simulation' ? 'bg-[#007bff] text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Simulation
                    </button>
                </div>
                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'theory' && renderTheory()}
                    {activeTab === 'example' && renderExample()}
                    {activeTab === 'simulation' && renderSimulation()}
                </div>
                {/* Footer */}
                <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-200">
                    Playfair Cipher Simulation Tool © {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
};
export default App;
