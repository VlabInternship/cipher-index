import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, ChevronDown } from 'lucide-react';

const A51CipherApp = () => {
  // User inputs and state management
  const [inputText, setInputText] = useState('HELLO');
  const [key, setKey] = useState('1010101010101010101010101010101010101010101010101010101010101010');
  const [isEncrypting, setIsEncrypting] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSteps, setAnimationSteps] = useState([]);
  const [result, setResult] = useState('');
  const [binaryInput, setBinaryInput] = useState('');
  const [register1, setRegister1] = useState([]);
  const [register2, setRegister2] = useState([]);
  const [register3, setRegister3] = useState([]);
  const [keystream, setKeystream] = useState([]);
  const [highlightedBit, setHighlightedBit] = useState(null);

  const animationRef = useRef(null);

  // Theory content
  const theorySections = [
    {
      title: "What is A5/1?",
      content: "A5/1 is a stream cipher used in GSM cellular networks for voice privacy. It uses three linear feedback shift registers (LFSRs) with irregular clocking controlled by a majority function."
    },
    {
      title: "How it works",
      content: "The cipher generates a keystream by combining bits from three registers. The registers are clocked irregularly based on a majority function of their middle bits."
    },
    {
      title: "Security",
      content: "While A5/1 was initially considered secure, modern cryptanalysis has revealed vulnerabilities. It's no longer recommended for high-security applications."
    }
  ];

  // Register configuration data
  const registerDetails = [
    {
      name: "Register 1 (R1)",
      bits: 19,
      clockingPos: 8,
      taps: [13, 16, 17, 18],
      color: "border-blue-500"
    },
    {
      name: "Register 2 (R2)",
      bits: 22,
      clockingPos: 10,
      taps: [20, 21],
      color: "border-green-500"
    },
    {
      name: "Register 3 (R3)",
      bits: 23,
      clockingPos: 10,
      taps: [7, 20, 21, 22],
      color: "border-purple-500"
    }
  ];

  // Helper functions for text/binary conversion
  const textToBinary = (text) => {
    return text.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
  };

  const binaryToText = (binary) => {
    const chars = [];
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.slice(i, i + 8);
      if (byte.length === 8) {
        chars.push(String.fromCharCode(parseInt(byte, 2)));
      }
    }
    return chars.join('');
  };

  // Memoized register update function
  const updateRegisters = useCallback((stepIndex) => {
    const step = animationSteps[stepIndex];
    if (!step) return;
    
    setRegister1(step.r1After || step.r1);
    setRegister2(step.r2After || step.r2);
    setRegister3(step.r3After || step.r3);
    setHighlightedBit(step.outputBit);
  }, [animationSteps]);

  // A5/1 Cipher implementation class
  class A51Cipher {
    constructor(key) {
      this.r1 = key.slice(0, 19).split('').map(Number);
      this.r2 = key.slice(19, 41).split('').map(Number);
      this.r3 = key.slice(41, 64).split('').map(Number);
      this.steps = [];
    }

    majority(a, b, c) {
      return (a + b + c) >= 2 ? 1 : 0;
    }

    shiftRegister(register, feedbackBit, taps) {
      const outputBit = register[register.length - 1];
      let feedback = feedbackBit;
      
      for (const tap of taps) {
        feedback ^= register[tap];
      }
      
      for (let i = register.length - 1; i > 0; i--) {
        register[i] = register[i - 1];
      }
      register[0] = feedback;
      
      return outputBit;
    }

    generateKeystreamBit() {
      const c1 = this.r1[8];
      const c2 = this.r2[10];
      const c3 = this.r3[10];
      
      const maj = this.majority(c1, c2, c3);
      
      const step = {
        r1: [...this.r1],
        r2: [...this.r2],
        r3: [...this.r3],
        clockingBits: [c1, c2, c3],
        majority: maj,
        clockedRegisters: []
      };

      if (c1 === maj) {
        this.shiftRegister(this.r1, 0, [13, 16, 17, 18]);
        step.clockedRegisters.push('R1');
      }
      if (c2 === maj) {
        this.shiftRegister(this.r2, 0, [20, 21]);
        step.clockedRegisters.push('R2');
      }
      if (c3 === maj) {
        this.shiftRegister(this.r3, 0, [7, 20, 21, 22]);
        step.clockedRegisters.push('R3');
      }

      const outputBit = this.r1[18] ^ this.r2[21] ^ this.r3[22];
      step.outputBit = outputBit;
      step.r1After = [...this.r1];
      step.r2After = [...this.r2];
      step.r3After = [...this.r3];
      
      this.steps.push(step);
      return outputBit;
    }

    process(plaintext) {
      const binaryInput = textToBinary(plaintext);
      const keystream = [];
      const result = [];

      for (let i = 0; i < binaryInput.length; i++) {
        const keystreamBit = this.generateKeystreamBit();
        keystream.push(keystreamBit);
        result.push(parseInt(binaryInput[i]) ^ keystreamBit);
      }

      return {
        binaryInput,
        keystream,
        binaryOutput: result.join(''),
        textOutput: binaryToText(result.join(''))
      };
    }
  }

  // Process encryption/decryption
  const processCipher = () => {
    const cipher = new A51Cipher(key);
    const processResult = cipher.process(inputText);
    
    setBinaryInput(processResult.binaryInput);
    setResult(processResult.textOutput);
    setKeystream(processResult.keystream);
    setShowResult(true);
    setAnimationSteps([]);
    resetAnimation();
  };

  // Start the animation
  const startAnimation = () => {
    if (!showResult) {
      processCipher();
    }

    const cipher = new A51Cipher(key);
    const processResult = cipher.process(inputText);
    
    setBinaryInput(processResult.binaryInput);
    setAnimationSteps(cipher.steps);
    setResult(processResult.textOutput);
    setKeystream(processResult.keystream);
    setCurrentStep(0);
    setIsAnimating(true);
    
    // Initialize registers
    setRegister1(cipher.steps[0]?.r1 || []);
    setRegister2(cipher.steps[0]?.r2 || []);
    setRegister3(cipher.steps[0]?.r3 || []);
  };

  // Animation controls
  const nextStep = () => {
    if (currentStep < animationSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateRegisters(nextStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateRegisters(prevStep);
    }
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsAnimating(false);
    setAnimationSteps([]);
    setRegister1([]);
    setRegister2([]);
    setRegister3([]);
    setHighlightedBit(null);
  };

  // Animation effect with proper dependencies
  useEffect(() => {
    if (isAnimating && animationSteps.length > 0) {
      animationRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < animationSteps.length - 1) {
            const nextStep = prev + 1;
            updateRegisters(nextStep);
            return nextStep;
          }
          setIsAnimating(false);
          return prev;
        });
      }, 1000);
    }

    return () => clearInterval(animationRef.current);
  }, [isAnimating, animationSteps, updateRegisters]);

  // Register display component
  const RegisterDisplay = ({ register, name, clockingPos, isClocked, color }) => (
    <div className={`border-2 ${color} rounded-lg p-4 mb-4`}>
      <h3 className="font-bold text-lg mb-2">{name}</h3>
      <div className="flex flex-wrap gap-1 mb-2">
        {register.map((bit, index) => (
          <div
            key={index}
            className={`w-8 h-8 flex items-center justify-center text-sm font-mono border rounded relative
              ${index === clockingPos ? 'bg-yellow-300 border-yellow-500' : 'bg-gray-100 border-gray-300'}
              ${index === register.length - 1 ? 'bg-green-200 border-green-500' : ''}
            `}
          >
            {bit}
            {isClocked && index === 0 && (
              <ChevronDown className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-red-500 w-5 h-5" />
            )}
          </div>
        ))}
      </div>
      <div className="text-sm">
        <span className={`px-2 py-1 rounded ${isClocked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isClocked ? 'Clocked' : 'Not Clocked'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">A5/1 Stream Cipher</h1>
        
        {/* Theory Section - Always Visible */}
        <div className="mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {theorySections.map((section, index) => (
              <div 
                key={index}
                className={`p-6 rounded-lg shadow-md transition-all hover:shadow-lg
                  ${index === 0 ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  ${index === 1 ? 'bg-green-50 border-l-4 border-green-500' : ''}
                  ${index === 2 ? 'bg-purple-50 border-l-4 border-purple-500' : ''}
                `}
              >
                <h3 className="text-xl font-bold mb-3">
                  {index === 0 && <span className="text-blue-600">🔒 {section.title}</span>}
                  {index === 1 && <span className="text-green-600">⚙️ {section.title}</span>}
                  {index === 2 && <span className="text-purple-600">🛡️ {section.title}</span>}
                </h3>
                <p className="text-gray-700">{section.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Input Text:</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text to encrypt/decrypt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">64-bit Key:</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.replace(/[^01]/g, '').slice(0, 64))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Enter 64-bit binary key"
              maxLength={64}
            />
            <div className="text-xs text-gray-500 mt-1">{key.length}/64 bits</div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setIsEncrypting(true)}
            className={`px-6 py-3 rounded-lg ${isEncrypting ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Encrypt
          </button>
          <button
            onClick={() => setIsEncrypting(false)}
            className={`px-6 py-3 rounded-lg ${!isEncrypting ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Decrypt
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={processCipher}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEncrypting ? <Lock className="mr-2 w-4 h-4" /> : <Unlock className="mr-2 w-4 h-4" />}
            {isEncrypting ? 'Encrypt Text' : 'Decrypt Text'}
          </button>
          <button
            onClick={startAnimation}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Play className="mr-2 w-4 h-4" />
            Visualize Cipher
          </button>
          <button
            onClick={resetAnimation}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className="mb-8 bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              {isEncrypting ? <Lock className="mr-2" /> : <Unlock className="mr-2" />}
              {isEncrypting ? 'Encryption Result' : 'Decryption Result'}
            </h3>
            
            <div className="grid gap-4">
              <div>
                <strong>Input Text:</strong> {inputText}
              </div>
              <div>
                <strong>Binary Input:</strong>
                <div className="font-mono bg-white p-2 rounded border mt-1 overflow-x-auto">
                  {binaryInput}
                </div>
              </div>
              <div>
                <strong>Output:</strong> {result}
              </div>
            </div>
          </div>
        )}

        {/* Animation Controls */}
        {animationSteps.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                disabled={animationSteps.length === 0}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {isAnimating ? <Pause className="mr-2 w-4 h-4" /> : <Play className="mr-2 w-4 h-4" />}
                {isAnimating ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400"
              >
                ← Previous Step
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep >= animationSteps.length - 1}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400"
              >
                Next Step →
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4">
              Step {currentStep + 1} of {animationSteps.length}
              {highlightedBit !== null && (
                <span className="ml-4 text-sm font-normal">
                  Output Bit: <span className="font-bold">{highlightedBit}</span>
                </span>
              )}
            </h3>
            
            {/* Current Step Info */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Clocking Bits:</strong> [{animationSteps[currentStep]?.clockingBits?.join(', ')}]
                </div>
                <div>
                  <strong>Majority:</strong> {animationSteps[currentStep]?.majority}
                </div>
                <div>
                  <strong>Clocked Registers:</strong> {animationSteps[currentStep]?.clockedRegisters?.join(', ') || 'None'}
                </div>
              </div>
            </div>

            {/* Register Displays */}
            <div className="grid lg:grid-cols-1 gap-4">
              {registerDetails.map((reg, index) => {
                const regName = reg.name.split(' ')[1];
                return (
                  <RegisterDisplay
                    key={index}
                    register={index === 0 ? register1 : index === 1 ? register2 : register3}
                    name={regName}
                    clockingPos={reg.clockingPos}
                    isClocked={animationSteps[currentStep]?.clockedRegisters?.includes(regName)}
                    color={reg.color}
                  />
                );
              })}
            </div>

            {/* Keystream Visualization */}
            <div className="mt-8">
              <h4 className="font-bold mb-3">Keystream Generation</h4>
              <div className="font-mono bg-white p-4 rounded border overflow-x-auto">
                <div className="flex gap-1 mb-2">
                  {keystream.slice(0, 20).map((bit, i) => (
                    <div 
                      key={i} 
                      className={`w-8 h-8 flex items-center justify-center border rounded 
                        ${i === currentStep ? 'bg-blue-200 border-blue-500' : 'bg-gray-100 border-gray-300'}`}
                    >
                      {bit}
                    </div>
                  ))}
                  {keystream.length > 20 && <span className="self-center">...</span>}
                </div>
                <div className="text-sm text-gray-600">
                  Generated {keystream.length} bits (showing first 20)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default A51CipherApp;