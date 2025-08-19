import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Play, RotateCcw } from 'lucide-react';

const TheoryTab = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">What is Rail Fence Cipher?</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4">
          The Rail Fence Cipher is a form of transposition cipher that gets its name from the way it's encoded. 
          The plaintext is written in a zigzag pattern across multiple "rails" (rows), then read off in rows to create the ciphertext.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">How it works:</h3>
        <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-2">
          <li>Choose the number of rails (rows)</li>
          <li>Write the message in a zigzag pattern across the rails</li>
          <li>Read the characters from each rail sequentially to form the cipher</li>
        </ol>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">Example:</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="font-mono text-sm mb-2">Plaintext: "HELLO WORLD" with 3 rails</p>
          <div className="font-mono text-sm space-y-1">
            <div>Rail 1: H . . . O . . . R . .</div>
            <div>Rail 2: . E . L . W . . L .</div>
            <div>Rail 3: . . L . . . . O . . D</div>
          </div>
          <p className="font-mono text-sm mt-2">Reading the rails yields the ciphertext: "HORELWLLOD"</p>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">Properties:</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Easy to implement and understand</li>
          <li>Relatively weak security (can be broken with frequency analysis)</li>
          <li>Preserves character frequency distribution</li>
          <li>Historically used for simple message concealment</li>
        </ul>
      </div>
    </div>
);

const ExampleTab = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Standard Test Vector Example</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4">
          This section demonstrates a concrete example of encryption and decryption using a standard test case.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-semibold text-blue-700 mb-3">Encryption Example</h3>
          <p className="font-mono text-sm mb-2"><b>Plaintext:</b> "WE ARE DISCOVERED FLEE AT ONCE"</p>
          <p className="font-mono text-sm mb-2"><b>Number of Rails:</b> 3</p>
          <p className="font-mono text-sm"><b>Expected Ciphertext:</b> "WECRLTEERDSOEEFEAOCAIVDEN"</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3">Decryption Example</h3>
          <p className="font-mono text-sm mb-2"><b>Ciphertext:</b> "WECRLTEERDSOEEFEAOCAIVDEN"</p>
          <p className="font-mono text-sm mb-2"><b>Number of Rails:</b> 3</p>
          <p className="font-mono text-sm"><b>Expected Plaintext:</b> "WEAREDISCOVEREDFLEEATONCE"</p>
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive Rail Fence Tool</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="encrypt">Encrypt</option>
              <option value="decrypt">Decrypt</option>
            </select>
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
              className="w-full"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="Result will appear here..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={runAnimation}
            disabled={isAnimating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={18} />
            {isAnimating ? 'Visualizing...' : 'Explain'}
          </button>
          
          <button
            onClick={handleProcess}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />}
            {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </button>

          <button
            onClick={resetAnimation}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Visualization */}
      {(railPattern.length > 0 || animationStep > 0) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Rail Pattern Visualization</h3>
          
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
                              ? 'border-red-500 bg-red-100 text-red-700 transform scale-110'
                              : currentChar > cell.index || !isAnimating
                              ? 'border-blue-500 bg-blue-100 text-blue-700'
                              : 'border-gray-300 bg-gray-50 text-gray-400'
                            : 'border-gray-200 bg-gray-50'
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
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm">
                  {currentChar >= 0 && currentChar < (mode === 'encrypt' ? plaintext : ciphertext).length
                    ? mode === 'encrypt' 
                      ? `Placing character '${plaintext[currentChar]}' in zigzag pattern at position ${currentChar + 1}`
                      : `Filling character '${ciphertext[currentChar]}' from ciphertext into rail pattern`
                    : 'Processing...'}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Rail Fence Cipher</h1>
          <p className="text-gray-600">Learn and visualize the Rail Fence encryption technique</p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'theory' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Theory
            </button>
            <button
              onClick={() => setActiveTab('example')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'example' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Example
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'simulation' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
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
    </div>
  );
};

export default RailFenceCipher;
