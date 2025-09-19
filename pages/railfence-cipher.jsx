import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw } from 'lucide-react';

// Component for a single theory block
const TheoryBlock = ({ title, children }) => (
    <div className="bg-[#f9f9f9] rounded-lg border border-gray-200 shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold text-[#0056b3] mb-4">{title}</h3>
        <div className="prose max-w-none">
            {children}
        </div>
    </div>
);

const TheoryTab = () => (
    <div className="space-y-6">
        <TheoryBlock title="Introduction to Rail Fence Cipher">
            <p className="text-gray-700">
                The Rail Fence cipher is a classic example of a **transposition cipher** that rearranges the order of the characters in the plaintext. The process is simple, yet the resulting ciphertext can be unintelligible at a glance.
            </p>
        </TheoryBlock>

        <TheoryBlock title="Origin Story">
            <p className="text-gray-700">
                The Rail Fence cipher is an old and simple method used for quick, manual encryption. It has no single inventor attributed to it, as similar ciphers likely emerged independently in various contexts due to the simplicity of the underlying concept.
            </p>
        </TheoryBlock>

        <TheoryBlock title="Core Idea">
            <p className="text-gray-700">
                The core idea is to scramble the plaintext by writing it in a zig-zag pattern across a number of imaginary "rails". The ciphertext is then formed by reading the characters off each rail sequentially, from top to bottom. The key to the cipher is the number of rails used in the zig-zag pattern.
            </p>
        </TheoryBlock>

        <TheoryBlock title="Technical Blueprint">
            <p className="text-gray-700">
                To encrypt a message, the sender first chooses a number of "rails." The plaintext is then written on these rails in a descending and then ascending zig-zag pattern. For example, with three rails, the letters would be placed on rails 1, 2, 3, 2, 1, 2, 3, etc. The ciphertext is then formed by concatenating the contents of each rail, starting with the top rail and working down. Decryption reverses this process: the ciphertext is first divided into segments that correspond to the length of each rail, and then the letters are placed back onto the rails in the correct order to reconstruct the original zig-zag pattern. The plaintext is then read by following the zig-zag path.
            </p>
        </TheoryBlock>

        <TheoryBlock title="Security Scorecard">
            <p className="text-gray-700">
                The security of the Rail Fence cipher is entirely dependent on the secrecy of the number of rails used. However, with modern computational power, an attacker can easily break the cipher by trying a small number of possible rail counts through brute force. As such, it is not a secure method for protecting sensitive information.
            </p>
        </TheoryBlock>

        <TheoryBlock title="Real-World Usage">
            <p className="text-gray-700">
                Due to its simplicity and known vulnerabilities, the Rail Fence cipher is not used for any serious security purposes today. It is primarily a pedagogical tool used to introduce the concept of transposition ciphers and to contrast them with substitution ciphers.
            </p>
        </TheoryBlock>
    </div>
);

const ExampleTab = () => (
    <div className="bg-[#f9f9f9] rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-2xl font-bold text-[#0056b3] mb-4">Solved Example</h2>
      
      <div className="prose max-w-none">
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-[#0056b3] mb-3">Encryption</h3>
          <p className="font-mono text-sm mb-2"><b>Plaintext:</b> WE ARE DISCOVERED FLEE AT ONCE</p>
          <p className="font-mono text-sm mb-2"><b>Key:</b> 3 rails</p>
          <p className="font-mono text-sm mb-2"><b>Step 1:</b> Write the Plaintext in a Zig-Zag Pattern</p>
          <div className="font-mono text-sm space-y-1">
            <p>Rail 1: WECRLTE</p>
            <p>Rail 2: ERSODEFETN</p>
            <p>Rail 3: ADISCVERAOE</p>
          </div>
          <p className="font-mono text-sm mt-2">
            The ciphertext is formed by reading off the characters from each rail sequentially.
          </p>
          <p className="font-mono text-sm mt-2"><b>Ciphertext:</b> WECRLTEERSODEFETNADS CVERAOE</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-green-700 mb-3">Decryption</h3>
          <p className="font-mono text-sm mb-2"><b>Ciphertext:</b> WECRLTEERSODEFETNADS CVERAOE</p>
          <p className="font-mono text-sm mb-2"><b>Key:</b> 3 rails</p>
          <p className="font-mono text-sm mb-2"><b>Step 1:</b> Calculate the Length of Each Rail</p>
          <p className="text-sm">The plaintext has 26 characters. The rails will have 7, 10, and 9 letters respectively.</p>
          <p className="font-mono text-sm mb-2"><b>Step 2:</b> Reconstruct the Empty Rail Fence and Fill</p>
          <p className="text-sm">The ciphertext is filled into the grid sequentially, rail by rail, based on the lengths calculated above.</p>
          <p className="font-mono text-sm mb-2"><b>Step 3:</b> Read the Plaintext from the Zig-Zag Pattern</p>
          <p className="text-sm">By following the zig-zag path, the original plaintext is reconstructed.</p>
          <p className="font-mono text-sm mt-2"><b>Plaintext:</b> WEAREDISCOVEREDFLEEATONCE</p>
        </div>
      </div>
    </div>
);

const SimulationTab = ({
  plaintext,
  setPlaintext,
  ciphertext,
  setCiphertext,
  rails,
  setRails,
  mode,
  setMode,
  isAnimating,
  animationStep,
  railPattern,
  currentChar,
  runAnimation,
  handleProcess,
  resetAnimation
}) => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[#f9f9f9] rounded-lg shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-[#0056b3] mb-4">Interactive Rail Fence Tool</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setMode('encrypt')}
                className={`flex-1 px-3 py-2 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${mode === 'encrypt' ? 'bg-[#007bff] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <Lock size={14} /> Encrypt
              </button>
              <button
                onClick={() => setMode('decrypt')}
                className={`flex-1 px-3 py-2 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${mode === 'decrypt' ? 'bg-[#007bff] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <Unlock size={14} /> Decrypt
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rails: {rails}
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={rails}
              onChange={(e) => setRails(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'encrypt' ? 'Plaintext' : 'Input Text'}
            </label>
            <input
              type="text"
              value={mode === 'encrypt' ? plaintext : ciphertext}
              onChange={(e) => mode === 'encrypt' ? setPlaintext(e.target.value) : setCiphertext(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-[#f9f9f9] font-mono text-sm focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
              placeholder="Enter your message..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'encrypt' ? 'Ciphertext' : 'Decrypted Text'}
            </label>
            <input
              type="text"
              value={mode === 'encrypt' ? ciphertext : plaintext}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              placeholder="Result will appear here..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={runAnimation}
            disabled={isAnimating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#007bff] text-white rounded-lg font-semibold hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            <Play size={18} />
            {isAnimating ? 'Visualizing...' : 'Explain'}
          </button>
          
          <button
            onClick={handleProcess}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
          >
            {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />}
            {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </button>

          <button
            onClick={resetAnimation}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Visualization */}
      {(railPattern.length > 0 || animationStep > 0) && (
        <div className="bg-[#f9f9f9] rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-[#0056b3] mb-4">Rail Pattern Visualization</h3>
          
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {railPattern.map((rail, railIndex) => (
                <div key={railIndex} className="flex items-center mb-4">
                  <div className="w-16 text-sm font-medium text-gray-600 mr-4">
                    Rail {railIndex + 1}:
                  </div>
                  <div className="flex gap-2">
                    {rail.map((cell, cellIndex) => (
                      <div
                        key={cellIndex}
                        className={`w-8 h-8 border-2 rounded flex items-center justify-center text-sm font-mono transition-all duration-300 ${
                          cell 
                            ? currentChar === cell.index
                              ? 'border-amber-500 bg-amber-100 text-amber-700 transform scale-110'
                              : currentChar > cell.index || !isAnimating
                              ? 'border-blue-500 bg-blue-100 text-blue-700'
                              : 'border-gray-300 bg-gray-50 text-gray-400'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {cell && (currentChar >= cell.index || !isAnimating) ? cell.char : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAnimating && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-[#0056b3]">
                <div className="w-2 h-2 bg-[#007bff] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {currentChar >= 0 && currentChar < (mode === 'encrypt' ? plaintext : ciphertext).length
                    ? mode === 'encrypt' 
                      ? `Placing character '${plaintext[currentChar]}' in zigzag pattern at position ${currentChar + 1}`
                      : `Filling character '${ciphertext[currentChar]}' from ciphertext into rail pattern`
                    : 'Processing...'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {mode === 'encrypt' 
                  ? 'Encryption: Writing text in zigzag pattern across rails'
                  : 'Decryption: Filling ciphertext into rails row by row, then reading diagonally'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
);

const RailFenceCipher = () => {
  const [activeTab, setActiveTab] = useState('theory');
  const [plaintext, setPlaintext] = useState('HELLO WORLD');
  const [ciphertext, setCiphertext] = useState('');
  const [rails, setRails] = useState(3);
  const [mode, setMode] = useState('encrypt');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [railPattern, setRailPattern] = useState([]);
  const [currentChar, setCurrentChar] = useState(-1);

  // Rail Fence Encryption
  const encryptRailFence = (text, numRails) => {
    if (numRails === 1) return text;
    
    const rails = Array(numRails).fill().map(() => []);
    let rail = 0;
    let direction = 1;
    
    for (let i = 0; i < text.length; i++) {
      rails[rail].push({ char: text[i], index: i });
      
      if (rail === 0) direction = 1;
      else if (rail === numRails - 1) direction = -1;
      
      rail += direction;
    }
    
    return {
      result: rails.flat().map(item => item.char).join(''),
      rails: rails
    };
  };

  // Rail Fence Decryption
  const decryptRailFence = (cipher, numRails) => {
    if (numRails === 1) return cipher;
    
    // Step 1: Create the rail structure to determine positions
    const rails = Array(numRails).fill().map(() => []);
    let rail = 0;
    let direction = 1;
    
    // Map out the zigzag pattern to know which positions belong to which rail
    for (let i = 0; i < cipher.length; i++) {
      rails[rail].push(i);
      
      if (rail === 0) direction = 1;
      else if (rail === numRails - 1) direction = -1;
      
      rail += direction;
    }
    
    // Step 2: Fill rails with cipher characters row by row
    let cipherIndex = 0;
    const railsWithChars = Array(numRails).fill().map(() => []);
    
    for (let i = 0; i < numRails; i++) {
      for (let j = 0; j < rails[i].length; j++) {
        railsWithChars[i].push({
          char: cipher[cipherIndex],
          originalPos: rails[i][j]
        });
        cipherIndex++;
      }
    }
    
    // Step 3: Create result array and place characters back in zigzag order
    const result = Array(cipher.length);
    rail = 0;
    direction = 1;
    const railCounters = Array(numRails).fill(0);
    
    for (let i = 0; i < cipher.length; i++) {
      result[i] = railsWithChars[rail][railCounters[rail]].char;
      railCounters[rail]++;
      
      if (rail === 0) direction = 1;
      else if (rail === numRails - 1) direction = -1;
      
      rail += direction;
    }
    
    return result.join('');
  };

  // Generate rail pattern for visualization
  const generateRailPattern = (text, numRails, isDecryption = false) => {
    if (isDecryption) {
      // For decryption: First create the structure to know positions
      const structure = Array(numRails).fill().map(() => []);
      let rail = 0;
      let direction = 1;
      
      // Map zigzag positions
      for (let i = 0; i < text.length; i++) {
        structure[rail].push(i);
        
        if (rail === 0) direction = 1;
        else if (rail === numRails - 1) direction = -1;
        
        rail += direction;
      }
      
      // Create visual pattern for decryption (filling row by row)
      const pattern = Array(numRails).fill().map(() => Array(text.length).fill(null));
      let cipherIndex = 0;
      
      for (let r = 0; r < numRails; r++) {
        for (let pos of structure[r]) {
          pattern[r][pos] = { char: text[cipherIndex], index: cipherIndex };
          cipherIndex++;
        }
      }
      
      return pattern;
    } else {
      // For encryption: zigzag pattern
      const pattern = Array(numRails).fill().map(() => Array(text.length).fill(null));
      let rail = 0;
      let direction = 1;
      
      for (let i = 0; i < text.length; i++) {
        pattern[rail][i] = { char: text[i], index: i };
        
        if (rail === 0) direction = 1;
        else if (rail === numRails - 1) direction = -1;
        
        rail += direction;
      }
      
      return pattern;
    }
  };

  // Animation function
  const runAnimation = async () => {
    setIsAnimating(true);
    setAnimationStep(0);
    setCurrentChar(-1);
    
    const text = mode === 'encrypt' ? plaintext : ciphertext;
    const pattern = generateRailPattern(text, rails, mode === 'decrypt');
    setRailPattern(pattern);
    
    if (mode === 'encrypt') {
      // For encryption: animate zigzag placement
      for (let i = 0; i < text.length; i++) {
        setCurrentChar(i);
        setAnimationStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, 1500)); // slower animation
      }
    } else {
      // For decryption: animate row-by-row filling
      let charIndex = 0;
      for (let rail = 0; rail < rails; rail++) {
        for (let pos = 0; pos < text.length; pos++) {
          if (pattern[rail][pos]) {
            setCurrentChar(charIndex);
            setAnimationStep(charIndex + 1);
            await new Promise(resolve => setTimeout(resolve, 1500)); // slower animation
            charIndex++;
          }
        }
      }
    }
    
    // Show final result
    await new Promise(resolve => setTimeout(resolve, 1000)); // slower final pause
    
    if (mode === 'encrypt') {
      const encrypted = encryptRailFence(plaintext, rails);
      setCiphertext(encrypted.result);
    } else {
      const decrypted = decryptRailFence(ciphertext, rails);
      setPlaintext(decrypted);
    }
    
    setIsAnimating(false);
    setCurrentChar(-1);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setAnimationStep(0);
    setCurrentChar(-1);
    setRailPattern([]);
  };

  const handleProcess = () => {
    if (mode === 'encrypt') {
      const encrypted = encryptRailFence(plaintext, rails);
      setCiphertext(encrypted.result);
    } else {
      const decrypted = decryptRailFence(ciphertext, rails);
      setPlaintext(decrypted);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-[#0056b3]">Rail Fence Cipher</h1>
          <p className="text-gray-600 text-lg">Learn and visualize the Rail Fence encryption technique</p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded-xl bg-white p-1 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'theory' 
                  ? 'bg-[#007bff] text-white shadow' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Theory
            </button>
            <button
              onClick={() => setActiveTab('example')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'example' 
                  ? 'bg-[#007bff] text-white shadow' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Example
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'simulation' 
                  ? 'bg-[#007bff] text-white shadow' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Simulation
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'theory' && <TheoryTab />}
        {activeTab === 'example' && <ExampleTab />}
        {activeTab === 'simulation' && (
          <SimulationTab
            plaintext={plaintext}
            setPlaintext={setPlaintext}
            ciphertext={ciphertext}
            setCiphertext={setCiphertext}
            rails={rails}
            setRails={setRails}
            mode={mode}
            setMode={setMode}
            isAnimating={isAnimating}
            animationStep={animationStep}
            railPattern={railPattern}
            currentChar={currentChar}
            runAnimation={runAnimation}
            handleProcess={handleProcess}
            resetAnimation={resetAnimation}
          />
        )}
      </div>
      
      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-gray-600 text-sm">
          Rail Fence Cipher Simulation Tool © 2025
        </p>
      </footer>
    </div>
  );
};

export default RailFenceCipher;
