import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Lock, Unlock, ChevronDown } from 'lucide-react';

const A51CipherApp = () => {
  const [activeTab, setActiveTab] = useState('theory');
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

    shiftRegister(register, taps) {
      const outputBit = register[register.length - 1];
      const feedback = taps.reduce((acc, tap) => acc ^ register[tap], 0);
      
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
        this.shiftRegister(this.r1, [13, 16, 17, 18]);
        step.clockedRegisters.push('R1');
      }
      if (c2 === maj) {
        this.shiftRegister(this.r2, [20, 21]);
        step.clockedRegisters.push('R2');
      }
      if (c3 === maj) {
        this.shiftRegister(this.r3, [7, 20, 21, 22]);
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
    
    setRegister1(cipher.steps[0]?.r1 || []);
    setRegister2(cipher.steps[0]?.r2 || []);
    setRegister3(cipher.steps[0]?.r3 || []);
  };

  const nextStep = () => {
    if (currentStep < animationSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateRegisters(nextStep);
    } else {
      setIsAnimating(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateRegisters(prevStep);
      setIsAnimating(false);
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

  useEffect(() => {
    if (isAnimating && animationSteps.length > 0) {
      animationRef.current = setInterval(() => {
        nextStep();
      }, 1000);
    }
    return () => clearInterval(animationRef.current);
  }, [isAnimating, animationSteps, nextStep]);

  const renderTheory = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
      <h2 className="text-xl font-semibold text-[#0056b3] mb-4">A5/1 Algorithm Theory</h2>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">Introduction</h3>
        <p>
          A5/1 is a stream cipher used to provide air interface communication privacy in the GSM cellular system. It is a symmetric key algorithm, meaning the same key is used for both encryption and decryption.
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">Core Idea</h3>
        <p>
          The cipher's core is composed of three **Linear Feedback Shift Registers (LFSRs)** of different lengths: 19, 22, and 23 bits. The security comes from the irregular way these registers are clocked. The clocking of each register is controlled by a majority function, which looks at a specific bit in each register. Only registers whose clocking bit matches the majority vote are advanced. This irregular clocking makes the keystream output highly unpredictable.
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">Keystream Generation</h3>
        <p>
          The output keystream is a single bit generated at each clock cycle by XORing the output bits from the three registers. This keystream is then XORed with the plaintext to produce the ciphertext. Decryption is the same process in reverse.
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">Security</h3>
        <p>
          A5/1 was considered a strong cipher for its time, but with advances in computing power and cryptanalysis techniques, it is now considered **vulnerable**. Several attacks, including a time-memory trade-off attack, can break the cipher in a matter of minutes.
        </p>
      </div>
    </div>
  );

  const renderExample = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
      <h2 className="text-xl font-semibold text-[#0056b3] mb-4">A5/1 Example</h2>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">Registers and Key</h3>
        <p>
          Let's assume a simplified key `1010...` which is split into the three registers.
        </p>
        <ul className="list-disc list-inside pl-5 space-y-2">
          <li>R1 (19 bits): `1010101010101010101`</li>
          <li>R2 (22 bits): `0101010101010101010101`</li>
          <li>R3 (23 bits): `01010101010101010101010`</li>
        </ul>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">First Clock Cycle</h3>
        <p>
          1. The clocking bits are R1[8], R2[10], R3[10].
        </p>
        <p>
          2. The majority function determines which registers to clock. If the majority of `(R1[8], R2[10], R3[10])` is `1`, then all registers with a `1` at that position are clocked.
        </p>
        <p>
          3. For example, if R1's clocking bit is `1` and R2 and R3's are `0`, then only R1 is clocked.
        </p>
        <p>
          4. The keystream bit is the XOR of the last bit of each register: `R1[18] ^ R2[21] ^ R3[22]`.
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-[#007bff] mb-3">Result</h3>
        <p>
          This process is repeated for each bit of the plaintext to generate a unique keystream for encryption.
        </p>
      </div>
    </div>
  );

  const renderSimulation = () => (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
        <h2 className="text-xl font-semibold text-[#0056b3] mb-4">Simulation Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Input Text</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.toUpperCase())}
              className="p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter text to encrypt/decrypt"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">64-bit Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.replace(/[^01]/g, '').slice(0, 64))}
              className="p-2 border border-gray-300 rounded-md text-sm font-mono"
              placeholder="Enter 64-bit binary key"
              maxLength={64}
            />
            <div className="text-xs text-gray-500 mt-1">{key.length}/64 bits</div>
          </div>
        </div>
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setIsEncrypting(true)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isEncrypting ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Encrypt
          </button>
          <button
            onClick={() => setIsEncrypting(false)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${!isEncrypting ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Decrypt
          </button>
        </div>
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
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="mr-2 w-4 h-4" />
            Visualize Cipher
          </button>
          <button
            onClick={resetAnimation}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
      
      {showResult && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
          <h2 className="text-xl font-semibold text-[#0056b3] mb-4">Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Input Text</h3>
              <p className="font-mono">{inputText}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Binary Input</h3>
              <p className="font-mono break-all">{binaryInput}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Keystream</h3>
              <p className="font-mono break-all">{keystream.join('')}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-[#007bff] mb-3">Output Text</h3>
              <p className="font-mono">{result}</p>
            </div>
          </div>
        </div>
      )}

      {animationSteps.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
          <h2 className="text-xl font-semibold text-[#0056b3] mb-4">Animated Simulation</h2>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              disabled={currentStep >= animationSteps.length}
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
              disabled={currentStep >= animationSteps.length}
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
          <RegisterDisplay
            register={register1}
            name="R1"
            isClocked={animationSteps[currentStep]?.clockedRegisters?.includes('R1')}
            color="border-blue-500"
            clockingPos={8}
          />
          <RegisterDisplay
            register={register2}
            name="R2"
            isClocked={animationSteps[currentStep]?.clockedRegisters?.includes('R2')}
            color="border-green-500"
            clockingPos={10}
          />
          <RegisterDisplay
            register={register3}
            name="R3"
            isClocked={animationSteps[currentStep]?.clockedRegisters?.includes('R3')}
            color="border-purple-500"
            clockingPos={10}
          />
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
  );

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

  const renderTab = (id, label) => (
    <button
      key={id}
      onClick={() => {
        setActiveTab(id);
        resetAnimation();
        setShowResult(false);
      }}
      className={`py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${activeTab === id ? 'bg-[#0056b3] text-white shadow-md' : 'bg-gray-100 text-[#0056b3] border border-[#0056b3] hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="bg-white p-5 shadow-md text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#0056b3] mb-5">A5/1</h1>
        <div className="flex justify-center gap-2">
          {renderTab('theory', 'Theory')}
          {renderTab('example', 'Example')}
          {renderTab('simulation', 'Simulation')}
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-5">
        {activeTab === 'theory' && renderTheory()}
        {activeTab === 'example' && renderExample()}
        {activeTab === 'simulation' && renderSimulation()}
      </div>
    </div>
  );
};

export default A51CipherApp;
