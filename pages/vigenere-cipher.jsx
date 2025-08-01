import React, { useState, useEffect } from 'react';
import { Lock, Unlock, BookOpen, Code, Play, Pause, RotateCcw } from 'lucide-react';

const CryptoVisualizer = () => {
  // Color scheme constants
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
  const [userInput, setUserInput] = useState('HELLO');
  const [cipherKey, setCipherKey] = useState('KEY');
  const [processedOutput, setProcessedOutput] = useState('');
  const [activeMode, setActiveMode] = useState('encrypt');
  const [currentView, setCurrentView] = useState('theory');
  const [showViz, setShowViz] = useState(false);
  const [vizStep, setVizStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [stepData, setStepData] = useState([]);

  const buildCipherSteps = (text, keyValue, shouldEncrypt = true) => {
    if (!text || !keyValue) return [];
    
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanKey = keyValue.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (cleanKey.length === 0) return [];
    
    const stepsLog = [];
    let resultText = '';
    
    stepsLog.push({
      action: 'init',
      note: `Starting ${shouldEncrypt ? 'encryption' : 'decryption'}`,
      input: cleanText,
      key: cleanKey,
      fullKey: '',
      currentChar: '',
      currentKey: '',
      calculation: '',
      result: '',
      position: -1
    });
    
    const fullKey = cleanKey.repeat(Math.ceil(cleanText.length / cleanKey.length)).substring(0, cleanText.length);
    stepsLog.push({
      action: 'extend_key',
      note: 'Matching key length to text',
      input: cleanText,
      key: cleanKey,
      fullKey: fullKey,
      currentChar: '',
      currentKey: '',
      calculation: '',
      result: '',
      position: -1
    });
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const keyChar = fullKey[i];
      const charValue = char.charCodeAt(0) - 65;
      const keyValue = keyChar.charCodeAt(0) - 65;
      
      let newValue;
      let mathExplanation;
      
      if (shouldEncrypt) {
        newValue = (charValue + keyValue) % 26;
        mathExplanation = `(${char}=${charValue}) + (${keyChar}=${keyValue}) = ${charValue + keyValue} mod 26 → ${newValue}`;
      } else {
        newValue = (charValue - keyValue + 26) % 26;
        mathExplanation = `(${char}=${charValue}) - (${keyChar}=${keyValue}) = ${charValue - keyValue} + 26 → ${(charValue - keyValue + 26)} mod 26 → ${newValue}`;
      }
      
      const resultChar = String.fromCharCode(newValue + 65);
      resultText += resultChar;
      
      stepsLog.push({
        action: 'process_char',
        note: `Processing position ${i + 1}`,
        input: cleanText,
        key: cleanKey,
        fullKey: fullKey,
        currentChar: char,
        currentKey: keyChar,
        calculation: mathExplanation,
        result: resultText,
        position: i
      });
    }
    
    stepsLog.push({
      action: 'complete',
      note: `Finished ${shouldEncrypt ? 'encryption' : 'decryption'}`,
      input: cleanText,
      key: cleanKey,
      fullKey: fullKey,
      currentChar: '',
      currentKey: '',
      calculation: '',
      result: resultText,
      position: -1
    });
    
    return stepsLog;
  };

  const processCipher = (text, key, shouldEncrypt = true) => {
    if (!text || !key) return '';
    
    const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanKey.length === 0) return text;
    
    let output = '';
    let keyPosition = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      
      if (char >= 'A' && char <= 'Z') {
        const charCode = char.charCodeAt(0) - 65;
        const keyCode = cleanKey[keyPosition % cleanKey.length].charCodeAt(0) - 65;
        
        let resultCode;
        if (shouldEncrypt) {
          resultCode = (charCode + keyCode) % 26;
        } else {
          resultCode = (charCode - keyCode + 26) % 26;
        }
        
        const resultChar = String.fromCharCode(resultCode + 65);
        output += text[i] === text[i].toLowerCase() ? resultChar.toLowerCase() : resultChar;
        keyPosition++;
      } else {
        output += text[i];
      }
    }
    
    return output;
  };

  const handleCipherAction = () => {
    const result = processCipher(userInput, cipherKey, activeMode === 'encrypt');
    setProcessedOutput(result);
  };

  const startViz = () => {
    const vizSteps = buildCipherSteps(userInput, cipherKey, activeMode === 'encrypt');
    setStepData(vizSteps);
    setVizStep(0);
    setShowViz(true);
    setAutoPlay(false);
  };

  const resetViz = () => {
    setShowViz(false);
    setVizStep(0);
    setAutoPlay(false);
    setStepData([]);
  };

  const playViz = () => {
    setAutoPlay(true);
  };

  const pauseViz = () => {
    setAutoPlay(false);
  };

  const jumpToStep = (stepIndex) => {
    setVizStep(stepIndex);
  };

  useEffect(() => {
    if (autoPlay && vizStep < stepData.length - 1) {
      const timer = setTimeout(() => {
        setVizStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (vizStep >= stepData.length - 1) {
      setAutoPlay(false);
    }
  }, [autoPlay, vizStep, stepData.length]);

  const currentStepInfo = stepData[vizStep] || {};

  const demoSteps = [
    { step: 1, desc: "Original message", value: "HELLO" },
    { step: 2, desc: "Secret key", value: "KEY" },
    { step: 3, desc: "Extended key pattern", value: "KEYKE" },
    { step: 4, desc: "Letter to number conversion", 
      input: "H=7, E=4, L=11, L=11, O=14", key: "K=10, E=4, Y=24, K=10, E=4" },
    { step: 5, desc: "Math operations", 
      calc: "(7+10)%26=17→R, (4+4)%26=8→I, (11+24)%26=9→J, (11+10)%26=21→V, (14+4)%26=18→S" },
    { step: 6, desc: "Final output", value: "RIJVS" }
  ];

  const VizPanel = () => (
    <div className="rounded-xl shadow-lg p-6 mt-6" style={{ backgroundColor: colors.secondary }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ color: colors.textDark }}>Step-by-Step Walkthrough</h3>
        <div className="flex gap-2">
          {!showViz ? (
            <button
              onClick={startViz}
              disabled={!userInput || !cipherKey}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                !userInput || !cipherKey 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : `bg-[${colors.primary}] hover:bg-[${colors.primaryLight}] text-white`
              }`}
              style={{ backgroundColor: !userInput || !cipherKey ? undefined : colors.primary }}
            >
              <Play size={18} />
              Start Visualization
            </button>
          ) : (
            <>
              {!autoPlay ? (
                <button
                  onClick={playViz}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                  style={{ backgroundColor: colors.accentGreen, color: 'white' }}
                >
                  <Play size={18} />
                  Play
                </button>
              ) : (
                <button
                  onClick={pauseViz}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                  style={{ backgroundColor: colors.accentYellow, color: colors.textDark }}
                >
                  <Pause size={18} />
                  Pause
                </button>
              )}
              <button
                onClick={resetViz}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                style={{ backgroundColor: colors.accentRed, color: 'white' }}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>
      
      {showViz && stepData.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.textLight }}>
              Step {vizStep + 1} of {stepData.length}
            </span>
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((vizStep + 1) / stepData.length) * 100}%`,
                    backgroundColor: colors.primary 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {stepData.map((_, index) => (
              <button
                key={index}
                onClick={() => jumpToStep(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                  index === vizStep
                    ? 'text-white'
                    : index < vizStep
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-300'
                }`}
                style={{
                  backgroundColor: index === vizStep 
                    ? colors.primary 
                    : index < vizStep
                    ? colors.accentGreen
                    : colors.secondary
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className="rounded-lg p-6" style={{ backgroundColor: colors.background }}>
            <h4 className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
              {currentStepInfo.note}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>Input Text</label>
                  <div className="font-mono text-lg p-3 rounded border" style={{ backgroundColor: 'white' }}>
                    {currentStepInfo.input?.split('').map((char, index) => (
                      <span 
                        key={index}
                        className={`px-1 py-0.5 rounded ${
                          currentStepInfo.position === index 
                            ? 'text-yellow-800' 
                            : 'text-gray-800'
                        }`}
                        style={{
                          backgroundColor: currentStepInfo.position === index 
                            ? '#fff3cd' 
                            : 'transparent'
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>Cipher Key</label>
                  <div className="font-mono text-lg p-3 rounded border" style={{ backgroundColor: 'white' }}>
                    {currentStepInfo.key}
                  </div>
                </div>
                
                {currentStepInfo.fullKey && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>Full Key</label>
                    <div className="font-mono text-lg p-3 rounded border" style={{ backgroundColor: 'white' }}>
                      {currentStepInfo.fullKey?.split('').map((char, index) => (
                        <span 
                          key={index}
                          className={`px-1 py-0.5 rounded ${
                            currentStepInfo.position === index 
                              ? 'text-blue-800' 
                              : 'text-gray-800'
                          }`}
                          style={{
                            backgroundColor: currentStepInfo.position === index 
                              ? '#cfe2ff' 
                              : 'transparent'
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {currentStepInfo.currentChar && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#e7f1ff' }}>
                    <h5 className="font-semibold mb-2" style={{ color: colors.primary }}>Current Operation</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Text character:</span>
                        <span className="font-mono font-bold" style={{ color: '#996500' }}>{currentStepInfo.currentChar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key character:</span>
                        <span className="font-mono font-bold" style={{ color: colors.primary }}>{currentStepInfo.currentKey}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStepInfo.calculation && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#e8f7ee' }}>
                    <h5 className="font-semibold mb-2" style={{ color: colors.accentGreen }}>Math Steps</h5>
                    <div className="font-mono text-sm break-words" style={{ color: '#0f5132' }}>
                      {currentStepInfo.calculation}
                    </div>
                  </div>
                )}
                
                {currentStepInfo.result && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>Current Result</label>
                    <div className="font-mono text-lg p-3 rounded border" style={{ backgroundColor: 'white' }}>
                      {currentStepInfo.result?.split('').map((char, index) => (
                        <span 
                          key={index}
                          className={`px-1 py-0.5 rounded ${
                            index === currentStepInfo.result.length - 1 && currentStepInfo.action === 'process_char'
                              ? 'text-green-800' 
                              : 'text-gray-800'
                          }`}
                          style={{
                            backgroundColor: index === currentStepInfo.result.length - 1 && currentStepInfo.action === 'process_char'
                              ? '#d1e7dd' 
                              : 'transparent'
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: colors.textDark }}>Vigenère Cipher Explorer</h1>
          <p style={{ color: colors.textLight }}>Interactive tool for learning polyalphabetic substitution</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="rounded-lg shadow-lg p-1" style={{ backgroundColor: 'white' }}>
            <button
              onClick={() => setCurrentView('theory')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                currentView === 'theory' 
                  ? 'text-white shadow-md' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              style={{
                backgroundColor: currentView === 'theory' ? colors.primary : 'transparent'
              }}
            >
              <BookOpen size={20} />
              Theory
            </button>
            <button
              onClick={() => setCurrentView('cipher')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                currentView === 'cipher' 
                  ? 'text-white shadow-md' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              style={{
                backgroundColor: currentView === 'cipher' ? colors.primary : 'transparent'
              }}
            >
              <Code size={20} />
              Cipher Tool
            </button>
          </div>
        </div>

        {currentView === 'theory' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl shadow-lg p-8 mb-8" style={{ backgroundColor: 'white' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.textDark }}>Understanding the Vigenère Cipher</h2>
              
              <div className="prose prose-lg max-w-none">
                <p className="mb-4" style={{ color: colors.textDark }}>
                  This cipher uses multiple Caesar shifts based on a keyword, making it much stronger than simple substitution. 
                  Developed in the 16th century, it remained unbroken for centuries until methods like frequency analysis 
                  were developed against it.
                </p>
                
                <h3 className="text-xl font-semibold mb-3" style={{ color: colors.textDark }}>Key Concepts:</h3>
                <ul className="list-disc list-inside mb-6 space-y-2" style={{ color: colors.textDark }}>
                  <li>Uses a keyword to determine shift amounts</li>
                  <li>Each letter in the key shifts corresponding text letter</li>
                  <li>The key repeats to cover the entire message</li>
                  <li>Modular arithmetic wraps around the alphabet</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: 'white' }}>
              <h3 className="text-2xl font-bold mb-6" style={{ color: colors.textDark }}>Example Walkthrough</h3>
              
              <div className="space-y-4">
                {demoSteps.map((step, index) => (
                  <div key={index} className="border-l-4 pl-4 py-2" style={{ borderColor: colors.primary }}>
                    <div className="flex items-start gap-3">
                      <span className="rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: colors.primary, color: 'white' }}>
                        {step.step}
                      </span>
                      <div>
                        <p className="font-medium" style={{ color: colors.textDark }}>{step.desc}</p>
                        {step.value && (
                          <p className="font-mono text-lg" style={{ color: colors.primary }}>{step.value}</p>
                        )}
                        {step.input && (
                          <div className="mt-2">
                            <p className="text-sm" style={{ color: colors.textLight }}>Input: <span className="font-mono">{step.input}</span></p>
                            <p className="text-sm" style={{ color: colors.textLight }}>Key: <span className="font-mono">{step.key}</span></p>
                          </div>
                        )}
                        {step.calc && (
                          <p className="text-sm font-mono mt-2" style={{ color: colors.textLight }}>{step.calc}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'cipher' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: 'white' }}>
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.textDark }}>Cipher Processor</h2>
              
              <div className="flex justify-center mb-6">
                <div className="rounded-lg p-1" style={{ backgroundColor: colors.background }}>
                  <button
                    onClick={() => setActiveMode('encrypt')}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeMode === 'encrypt' 
                        ? 'text-white shadow-md' 
                        : 'text-gray-600 hover:text-green-500'
                    }`}
                    style={{
                      backgroundColor: activeMode === 'encrypt' ? colors.accentGreen : 'transparent'
                    }}
                  >
                    <Lock size={18} />
                    Encrypt
                  </button>
                  <button
                    onClick={() => setActiveMode('decrypt')}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeMode === 'decrypt' 
                        ? 'text-white shadow-md' 
                        : 'text-gray-600 hover:text-red-500'
                    }`}
                    style={{
                      backgroundColor: activeMode === 'decrypt' ? colors.accentRed : 'transparent'
                    }}
                  >
                    <Unlock size={18} />
                    Decrypt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                    {activeMode === 'encrypt' ? 'Original Text' : 'Encrypted Text'}
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder={activeMode === 'encrypt' ? 'Type message to encrypt...' : 'Paste ciphertext to decrypt...'}
                    style={{ backgroundColor: colors.secondary }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                    Secret Key
                  </label>
                  <input
                    type="text"
                    value={cipherKey}
                    onChange={(e) => setCipherKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your secret key..."
                    style={{ backgroundColor: colors.secondary }}
                  />
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={handleCipherAction}
                  disabled={!userInput || !cipherKey}
                  className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                    !userInput || !cipherKey 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : activeMode === 'encrypt'
                      ? 'hover:shadow-xl text-white shadow-lg'
                      : 'hover:shadow-xl text-white shadow-lg'
                  }`}
                  style={{
                    backgroundColor: !userInput || !cipherKey 
                      ? undefined 
                      : activeMode === 'encrypt'
                      ? colors.accentGreen
                      : colors.accentRed
                  }}
                >
                  {activeMode === 'encrypt' ? 'Encrypt Message' : 'Decrypt Message'}
                </button>
              </div>

              {processedOutput && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                    {activeMode === 'encrypt' ? 'Encrypted Result' : 'Decrypted Message'}
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4" style={{ backgroundColor: colors.secondary }}>
                    <p className="font-mono text-lg break-words" style={{ color: colors.textDark }}>{processedOutput}</p>
                  </div>
                </div>
              )}
            </div>

            <VizPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoVisualizer;