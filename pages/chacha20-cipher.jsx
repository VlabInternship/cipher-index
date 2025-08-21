import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Lock,
  Unlock,
  ArrowRight,
  Plus,
  Equal,
  BookOpen,
  Code,
} from "lucide-react";

// --- Helper Components for Detailed Visualizations ---
const CoreMixingVisualizer = ({ currentStep, roundType, currentRoundNum, highlightedIndices }) => {
  if (currentStep !== 1) return null;
  const roundName = roundType.charAt(0).toUpperCase() + roundType.slice(1);
  return (
    <div>
      <h3 className="text-lg font-semibold text-chacha-accent mb-4">Core Mixing Pattern</h3>
      <div className="bg-chacha-accent/5 p-4 rounded-lg">
        <p className="text-center font-mono mb-3 text-chacha-primary">Round {currentRoundNum}/10: {roundName} Round</p>
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs mx-auto">
          {Array.from({ length: 16 }).map((_, i) => {
            const isHighlighted = highlightedIndices.includes(i);
            return <div key={i} className={`aspect-square rounded-md transition-all duration-100 ease-in-out ${isHighlighted ? 'bg-chacha-primary/80 animate-pulse' : 'bg-chacha-accent/10'}`}></div>;
          })}
        </div>
      </div>
    </div>
  );
};

const MatrixDisplay = ({ matrix, title }) => (
  <div className="text-center">
    <p className="font-mono text-sm text-chacha-accent mb-2">{title}</p>
    <div className="grid grid-cols-4 gap-1 bg-chacha-accent/5 p-2 rounded-md">
      {(matrix.length > 0 ? matrix : Array(16).fill(0)).map((val, i) => (
        <div key={i} className="bg-chacha-accent/10 rounded p-1 text-xs break-all text-chacha-accent">
          {val.toString(16).padStart(8, '0')}
        </div>
      ))}
    </div>
  </div>
);

const AdditionVisualizer = ({ currentStep, mixedState, initialState, resultState }) => {
  if (currentStep !== 2) return null;
  return (
    <div>
      <h3 className="text-lg font-semibold text-chacha-accent mb-4">State Addition</h3>
      <div className="bg-chacha-accent/5 p-4 rounded-lg flex items-center justify-around gap-2 animate-fade-in">
        <MatrixDisplay matrix={mixedState} title="Mixed State" />
        <Plus className="text-chacha-primary w-6 h-6 flex-shrink-0" />
        <MatrixDisplay matrix={initialState} title="Initial State" />
        <Equal className="text-chacha-accent w-6 h-6 flex-shrink-0" />
        <MatrixDisplay matrix={resultState} title="Result State" />
      </div>
    </div>
  );
};

const KeystreamVisualizer = ({ currentStep, keystreamBytes }) => {
  if (currentStep < 3) return null;
  return (
  <div className={`transition-opacity duration-500 ${currentStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
      <h3 className="text-lg font-semibold text-chacha-accent mb-4">Serialization to Keystream</h3>
      <div className="bg-chacha-accent/5 p-3 rounded-lg font-mono text-xs text-chacha-accent">
        <div className="grid grid-cols-16 gap-1">
          {(keystreamBytes.length > 0 ? keystreamBytes : Array(64).fill(0)).map((byte, i) => (
            <span key={i} className={`p-1 rounded transition-colors duration-300 ${currentStep === 3 ? 'bg-chacha-primary/80 animate-pulse' : 'bg-chacha-primary/80'}`}>
              {byte.toString(16).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const XorVisualizer = ({ currentStep, keystreamBytes, plaintextBytes, ciphertextBytes, isDecrypting }) => {
  if (currentStep !== 4) return null;
  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold text-chacha-accent mb-4">XOR Operation</h3>
      <div className="space-y-4 font-mono text-xs">
        <div>
          <p className="text-chacha-accent mb-2">{isDecrypting ? "Ciphertext Bytes" : "Plaintext Bytes"}</p>
          <div className="bg-chacha-accent/5 p-2 rounded-lg grid grid-cols-16 gap-1">
            {plaintextBytes.map((b, i) => <span key={i} className="p-1 rounded bg-chacha-accent/10 text-chacha-accent">{b.toString(16).padStart(2, '0')}</span>)}
          </div>
        </div>
        <div className="flex justify-center text-chacha-primary font-bold text-2xl">⊕</div>
        <div>
          <p className="text-chacha-accent mb-2">Keystream Bytes</p>
          <div className="bg-chacha-accent/5 p-2 rounded-lg grid grid-cols-16 gap-1">
            {keystreamBytes.map((b, i) => <span key={i} className="p-1 rounded bg-chacha-primary/80 text-chacha-alt">{b.toString(16).padStart(2, '0')}</span>)}
          </div>
        </div>
        <div className="flex justify-center text-chacha-primary font-bold text-2xl">=</div>
        <div>
          <p className="text-chacha-primary mb-2">{isDecrypting ? "Plaintext Bytes" : "Ciphertext Bytes"}</p>
          <div className="bg-chacha-accent/5 p-2 rounded-lg grid grid-cols-16 gap-1">
            {ciphertextBytes.map((b, i) => <span key={i} className="p-1 rounded bg-chacha-accent/10 animate-pulse text-chacha-accent">{b.toString(16).padStart(2, '0')}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Theory Components ---
const TheoryTab = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
        <BookOpen className="w-6 h-6 mr-3 text-gray-800" /> Introduction
      </h2>
      <div className="space-y-4 text-gray-800">
        <p>
          ChaCha20 is a modern, symmetric stream cipher that was developed as a modification of the Salsa20 algorithm. 
          Designed by Daniel J. Bernstein, its purpose was to improve upon Salsa20's diffusion and performance on certain 
          architectures, making it a powerful and efficient choice for a variety of modern applications.
        </p>
      </div>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Origin Story</h2>
      <div className="space-y-4 text-gray-800">
        <p>
          ChaCha20 was introduced in 2008 by Daniel J. Bernstein, three years after his original Salsa20 design. 
          The modifications were a response to the practicalities of software implementation on modern CPUs, particularly 
          the desire to make the algorithm more parallelizable and to achieve faster diffusion per round.
        </p>
      </div>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Core Idea</h2>
      <div className="space-y-4 text-gray-800">
        <p>
          Like its predecessor, ChaCha20 is a stream cipher that generates a keystream by using an Add-Rotate-XOR (ARX) design. 
          It operates on a 512-bit state, which is initialized with a 256-bit key, a 96-bit nonce, and a counter. The core idea 
          is to apply a new quarter-round function to the state, with a different round structure than Salsa20. This new design 
          leads to faster diffusion and greater parallelizability, making it highly efficient on multi-core processors.
        </p>
      </div>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
        <Code className="w-6 h-6 mr-3 text-gray-800" /> Technical Blueprint
      </h2>
      <div className="space-y-4 text-gray-800">
        <p>
          ChaCha20 operates on a 4x4 matrix of sixteen 32-bit words. It uses a modified quarter-round function that, 
          unlike Salsa20, updates each word twice. This provides better diffusion per round, with each word having a 
          chance to influence the three others. The round structure also differs; instead of alternating between columns 
          and rows, ChaCha20 applies its quarter-round function down columns and along diagonals. The full cipher typically 
          uses 20 rounds, but variants with 8 or 12 rounds also exist.
        </p>
        <p>
          The encryption process is similar to Salsa20: the plaintext is XORed with the keystream generated by the cipher's 
          internal function. Decryption is the same operation, as the XOR operation is its own inverse.
        </p>
      </div>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Scorecard</h2>
      <div className="space-y-4 text-gray-800">
        <p>
          ChaCha20 is considered highly secure and is designed to be resilient against known attacks, including differential 
          and linear cryptanalysis. The design, based on principles similar to Salsa20, has been extensively tested and is 
          considered very secure. Its parallelizability makes it a strong contender for high-performance computing systems.
        </p>
      </div>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Real-World Usage</h2>
      <div className="space-y-4 text-gray-800">
        <p>
          ChaCha20 has been widely adopted due to its combination of speed, security, and parallelizability. It is often 
          preferred over AES on systems that lack specialized hardware acceleration, such as mobile devices with ARM-based CPUs. 
          Its widespread use can be seen in secure messaging applications like Signal, Virtual Private Networks (VPNs), and 
          web security protocols (HTTPS).
        </p>
        <p>
          The evolution from Salsa20 to ChaCha20 perfectly illustrates the continuous refinement in cryptography, where an 
          already secure algorithm is improved not because of a fundamental flaw but to better suit the changing landscape 
          of computing architecture.
        </p>
      </div>
    </div>
  </div>
);// --- Example Tab ---
const ExampleTab = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">ChaCha20 Quarter-Round Example</h2>
      <div className="space-y-4 text-gray-800">
        <p>
          The provided source materials describe the ChaCha20 quarter-round function but do not offer a full numerical walkthrough. 
          This conceptual example illustrates the flow of a single quarter-round on a set of four words.
        </p>
        
        <div className="bg-gray-100 p-4 rounded-md">
          <h3 className="font-semibold text-gray-800 mb-2">Example: A conceptual quarter-round of ChaCha20</h3>
          <p className="mb-3"><strong>Input Words:</strong> a, b, c, d (each a 32-bit word).</p>
          <p className="mb-3">The quarter-round function transforms the four words using a specific order of ARX operations:</p>
          
          <div className="bg-white p-3 rounded-md font-mono text-sm space-y-1">
            <div>a = a + b</div>
            <div>d = d ⊕ a</div>
            <div>d = d ⋘ 16</div>
            <div>c = c + d</div>
            <div>b = b ⊕ c</div>
            <div>b = b ⋘ 12</div>
            <div>a = a + b</div>
            <div>d = d ⊕ a</div>
            <div>d = d ⋘ 8</div>
            <div>c = c + d</div>
            <div>b = b ⊕ c</div>
            <div>b = b ⋘ 7</div>
          </div>
          
          <p className="mt-3">
            This sequence of operations updates each input word twice, leading to faster diffusion and a more robust scrambling 
            of the data. This process is applied to the 4x4 state matrix in a structured way (down columns and along diagonals) 
            to produce a 64-byte keystream block.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Common Uses</h2>
      <div className="space-y-4 text-gray-800">
        <p>ChaCha20 is widely used in modern cryptographic protocols:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>TLS 1.2 and 1.3 (as part of the ChaCha20-Poly1305 cipher suite)</li>
          <li>SSH (as an alternative to AES)</li>
          <li>WireGuard VPN protocol</li>
          <li>QUIC protocol (used by HTTP/3)</li>
          <li>Signal Protocol for secure messaging</li>
        </ul>
        <p>It's particularly popular on mobile devices and systems without AES hardware acceleration, where it often outperforms AES.</p>
      </div>
    </div>
  </div>
);

// --- Main Component ---
const ChaCha20Interactive = () => {
  const [activeTab, setActiveTab] = useState("theory");
  const [input, setInput] = useState("This is a secret message.");
  const [key, setKey] = useState("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
  const [nonce, setNonce] = useState("000000000000004a00000000");
  const [output, setOutput] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [matrix, setMatrix] = useState([]);
  const [animationSpeed, setAnimationSpeed] = useState(800);
  const [isDecrypting, setIsDecrypting] = useState(false);
 
  // State for detailed visualizations
  const [roundType, setRoundType] = useState('');
  const [currentRoundNum, setCurrentRoundNum] = useState(0);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [initialStateForViz, setInitialStateForViz] = useState([]);
  const [mixedStateForViz, setMixedStateForViz] = useState([]);
  const [keystreamBytesForViz, setKeystreamBytesForViz] = useState([]);
  const [plaintextBytesForViz, setPlaintextBytesForViz] = useState([]);
  const [ciphertextBytesForViz, setCiphertextBytesForViz] = useState([]);
 
  // Ref to correctly handle animation interruption
  const isAnimatingRef = useRef(false);

  const CONSTANTS = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];

  // --- Core ChaCha20 Logic & Helpers ---
  const rotl = (a, b) => (a << b) | (a >>> (32 - b));
  const quarterRound = (a, b, c, d) => {
    a = (a + b) >>> 0; d = rotl(d ^ a, 16); c = (c + d) >>> 0; b = rotl(b ^ c, 12);
    a = (a + b) >>> 0; d = rotl(d ^ a, 8); c = (c + d) >>> 0; b = rotl(b ^ c, 7);
    return [a, b, c, d];
  };
  const hexToBytes = (hex) => { 
    const bytes = []; 
    for (let i = 0; i < hex.length; i += 2) { 
      bytes.push(parseInt(hex.substr(i, 2), 16)); 
    } 
    return bytes; 
  };
  const bytesToHex = (bytes) => bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  const stringToBytes = (str) => Array.from(new TextEncoder().encode(str));
  const bytesToString = (bytes) => new TextDecoder().decode(new Uint8Array(bytes));
  const formatMatrixForDisplay = (matrix) => {
    if (!matrix || !matrix.length) return Array(4).fill(Array(4).fill(0));
    const formatted = [];
    for (let i = 0; i < 4; i++) {
      formatted.push(matrix.slice(i * 4, (i + 1) * 4));
    }
    return formatted;
  };

  const initMatrix = (counter = 0) => {
    const keyBytes = hexToBytes(key.padEnd(64, "0").slice(0, 64));
    const nonceBytes = hexToBytes(nonce.padEnd(24, "0").slice(0, 24));
    const newMatrix = Array(16);
    newMatrix[0] = CONSTANTS[0]; newMatrix[1] = CONSTANTS[1]; newMatrix[2] = CONSTANTS[2]; newMatrix[3] = CONSTANTS[3];
    for (let i = 0; i < 8; i++) { newMatrix[4 + i] = (keyBytes[i * 4] | (keyBytes[i * 4 + 1] << 8) | (keyBytes[i * 4 + 2] << 16) | (keyBytes[i * 4 + 3] << 24)) >>> 0; }
    newMatrix[12] = counter;
    for (let i = 0; i < 3; i++) { newMatrix[13 + i] = (nonceBytes[i * 4] | (nonceBytes[i * 4 + 1] << 8) | (nonceBytes[i * 4 + 2] << 16) | (nonceBytes[i * 4 + 3] << 24)) >>> 0; }
    return newMatrix;
  };

  // --- Animation Logic ---
  const animateProcess = async (decrypt = false) => {
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setIsDecrypting(decrypt);
    resetVisualization(false); // Soft reset without stopping animation

    // Step 0: Initialize Matrix
    setCurrentStep(0);
    const initialMatrix = initMatrix(0);
    setInitialStateForViz(initialMatrix);
    let workingMatrix = [...initialMatrix];
    setMatrix(workingMatrix);
    if (!isAnimatingRef.current) return;
    await new Promise((resolve) => setTimeout(resolve, animationSpeed));

    // Step 1: Animate the mixing rounds
    setCurrentStep(1);
    const subRoundTime = Math.max(50, (animationSpeed * 1.5) / 80);
    const columnGroups = [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]];
    const diagonalGroups = [[0, 5, 10, 15], [1, 6, 11, 12], [2, 7, 8, 13], [3, 4, 9, 14]];

    for (let i = 0; i < 10; i++) {
      if (!isAnimatingRef.current) return;
      setCurrentRoundNum(i + 1);
     
      setRoundType('column');
      for (const group of columnGroups) {
        if (!isAnimatingRef.current) return;
        setHighlightedIndices(group);
        [workingMatrix[group[0]], workingMatrix[group[1]], workingMatrix[group[2]], workingMatrix[group[3]]] = 
          quarterRound(workingMatrix[group[0]], workingMatrix[group[1]], workingMatrix[group[2]], workingMatrix[group[3]]);
        setMatrix([...workingMatrix]);
        await new Promise(r => setTimeout(r, subRoundTime));
      }

      setRoundType('diagonal');
      for (const group of diagonalGroups) {
        if (!isAnimatingRef.current) return;
        setHighlightedIndices(group);
        [workingMatrix[group[0]], workingMatrix[group[1]], workingMatrix[group[2]], workingMatrix[group[3]]] = 
          quarterRound(workingMatrix[group[0]], workingMatrix[group[1]], workingMatrix[group[2]], workingMatrix[group[3]]);
        setMatrix([...workingMatrix]);
        await new Promise(r => setTimeout(r, subRoundTime));
      }
    }
    setMixedStateForViz([...workingMatrix]);
    setHighlightedIndices([]);

    // Step 2: Animate adding initial state
    if (!isAnimatingRef.current) return;
    setCurrentStep(2);
    for (let i = 0; i < 16; i++) { workingMatrix[i] = (workingMatrix[i] + initialMatrix[i]) >>> 0; }
    setMatrix([...workingMatrix]);
    await new Promise((resolve) => setTimeout(resolve, animationSpeed));

    // Step 3: Animate serialization to keystream
    if (!isAnimatingRef.current) return;
    setCurrentStep(3);
    const keystream = workingMatrix;
    const finalKeystreamBytes = [];
    for (let j = 0; j < 16; j++) {
      finalKeystreamBytes.push(keystream[j] & 0xff, (keystream[j] >>> 8) & 0xff, (keystream[j] >>> 16) & 0xff, (keystream[j] >>> 24) & 0xff);
    }
    setKeystreamBytesForViz(finalKeystreamBytes.slice(0, 64));
    await new Promise((resolve) => setTimeout(resolve, animationSpeed));

    // Step 4: Animate XOR operation
    if (!isAnimatingRef.current) return;
    setCurrentStep(4);
    
    let inputBytes;
    if (decrypt) {
      // For decryption, input is hex ciphertext
      inputBytes = hexToBytes(input.replace(/[^0-9a-f]/gi, '').padEnd(128, '0').slice(0, 128));
    } else {
      // For encryption, input is plaintext string
      inputBytes = stringToBytes(input).slice(0, 64);
    }
    
    const resultBytes = inputBytes.map((byte, i) => byte ^ finalKeystreamBytes[i]);
    
    setPlaintextBytesForViz(inputBytes);
    setCiphertextBytesForViz(resultBytes);
    
    if (decrypt) {
      setOutput(bytesToString(resultBytes));
    } else {
      setOutput(bytesToHex(resultBytes));
    }
    
    await new Promise((resolve) => setTimeout(resolve, animationSpeed));
   
    isAnimatingRef.current = false;
    setIsAnimating(false);
  };
 
  const resetVisualization = (stopAnim = true) => {
    if (stopAnim) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
    }
    setOutput(""); 
    setCurrentStep(-1); 
    setMatrix([]);
    setRoundType(''); 
    setCurrentRoundNum(0); 
    setHighlightedIndices([]);
    setInitialStateForViz([]); 
    setMixedStateForViz([]);
    setKeystreamBytesForViz([]); 
    setPlaintextBytesForViz([]); 
    setCiphertextBytesForViz([]);
  };

  const steps = ["Initialize State", "Mix State (20 Rounds)", "Add Initial State", "Serialize to Keystream", "XOR Operation"];

  // --- Render Method ---
  return (
    <div className="bg-chacha-bg min-h-screen py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">ChaCha20 Cipher</h1>
          <p className="text-lg text-gray-600 mb-8">The Modern Successor to Salsa20</p>
        </header>
        <nav className="flex justify-center mb-8">
          <div className="bg-chacha-accent/10 rounded-lg p-1 flex space-x-1 shadow-md">
            {["theory", "example", "cipher"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-4 py-2 md:px-6 md:py-3 rounded-md font-medium transition-all text-sm md:text-base flex items-center gap-2 ${activeTab === tab ? "bg-chacha-accent text-chacha-alt shadow-lg" : "text-chacha-accent hover:text-chacha-alt hover:bg-chacha-accent/20"}`}
              >
                {tab === "theory" && <BookOpen className="w-4 h-4 md:w-5 md:h-5" />}
                {tab === "example" && <Play className="w-4 h-4 md:w-5 md:h-5" />}
                {tab === "cipher" && <Code className="w-4 h-4 md:w-5 md:h-5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </nav>
        <main>
          {activeTab === "cipher" && (
            <section className="max-w-7xl mx-auto animate-fade-in">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Encryption Controls Card */}
                <div className="lg:col-span-2 bg-chacha-alt text-chacha-accent rounded-xl shadow-md p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                    <Lock className="w-6 h-6 mr-3 text-chacha-primary" />
                    {isDecrypting ? "Decryption Controls" : "Encryption Controls"}
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-chacha-accent mb-2">
                        {isDecrypting ? "Ciphertext (Hex)" : "Plaintext Message"}
                      </label>
                      <textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        className="w-full bg-chacha-bg border border-chacha-accent rounded-lg px-4 py-3 text-chacha-accent focus:outline-none focus:ring-2 focus:ring-chacha-primary transition" 
                        rows="4" 
                        placeholder={isDecrypting ? "Enter hex ciphertext..." : "Enter your message..."}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-chacha-accent mb-2">256-bit Key (64 hex chars)</label>
                      <input 
                        type="text" 
                        value={key} 
                        onChange={(e) => setKey(e.target.value)} 
                        className="w-full bg-chacha-bg border border-chacha-accent rounded-lg px-4 py-3 text-chacha-accent font-mono text-sm focus:outline-none focus:ring-2 focus:ring-chacha-primary transition" 
                        maxLength="64" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-chacha-accent mb-2">96-bit Nonce (24 hex chars)</label>
                      <input 
                        type="text" 
                        value={nonce} 
                        onChange={(e) => setNonce(e.target.value)} 
                        className="w-full bg-chacha-bg border border-chacha-accent rounded-lg px-4 py-3 text-chacha-accent font-mono text-sm focus:outline-none focus:ring-2 focus:ring-chacha-primary transition" 
                        maxLength="24" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-chacha-accent mb-2">Animation Speed</label>
                      <input 
                        type="range" 
                        min="200" 
                        max="2000" 
                        step="100" 
                        value={animationSpeed} 
                        onChange={(e) => setAnimationSpeed(parseInt(e.target.value))} 
                        className="w-full h-2 bg-chacha-accent/20 rounded-lg appearance-none cursor-pointer accent-chacha-primary" 
                      />
                      <div className="text-xs text-chacha-accent text-center mt-1">{animationSpeed}ms</div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => animateProcess(false)} 
                        disabled={isAnimating || isDecrypting} 
                        className={`flex-1 bg-chacha-primary disabled:opacity-50 disabled:cursor-not-allowed text-chacha-alt font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center shadow-lg ${isDecrypting ? 'opacity-50' : ''}`}
                      >
                        {isAnimating && !isDecrypting ? <><Pause className="w-5 h-5 mr-2" /> Animating....</> : <><Play className="w-5 h-5 mr-2" /> Encrypt</>}
                      </button>
                      <button 
                        onClick={() => animateProcess(true)} 
                        disabled={isAnimating || !isDecrypting} 
                        className={`flex-1 bg-chacha-accent/20 disabled:opacity-50 disabled:cursor-not-allowed text-chacha-accent font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center shadow-lg ${!isDecrypting ? 'opacity-50' : ''}`}
                      >
                        {isAnimating && isDecrypting ? <><Pause className="w-5 h-5 mr-2" /> Animating...</> : <><Play className="w-5 h-5 mr-2" /> Decrypt</>}
                      </button>
                      <button 
                        onClick={() => {
                          setIsDecrypting(!isDecrypting);
                          resetVisualization(true);
                        }} 
                        className="bg-chacha-accent/20 hover:bg-chacha-accent/30 text-chacha-accent font-medium p-3 rounded-lg transition-all flex items-center justify-center"
                        title={isDecrypting ? "Switch to Encryption" : "Switch to Decryption"}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => resetVisualization(true)} 
                        title="Reset" 
                        className="bg-chacha-accent/20 hover:bg-chacha-accent/30 text-chacha-accent font-medium p-3 rounded-lg transition-all"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Visualization & Output Card */}
                <div style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,86,179,0.08)', padding: '2rem', color: '#0056b3' }} className="lg:col-span-3">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                    <Unlock className="w-6 h-6 mr-3" />
                    Visualization & Output
                  </h2>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-chacha-accent mb-3">State Matrix</h3>
                        <div className="bg-chacha-accent/10 p-4 rounded-lg">
                          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                            {formatMatrixForDisplay(matrix).map((row, i) => row.map((val, j) => {
                              const index = i * 4 + j;
                              let bgColor = "bg-chacha-accent/10";
                              if (index < 4) bgColor = "bg-chacha-primary/80"; 
                              else if (index < 12) bgColor = "bg-chacha-accent/30"; 
                              else if (index < 13) bgColor = "bg-chacha-primary/60"; 
                              else bgColor = "bg-chacha-accent/80";
                              return (
                                <div 
                                  key={`${i}-${j}`} 
                                  className={`p-2.5 rounded transition-colors duration-200 ${bgColor}`}
                                >
                                  {(val || 0).toString(16).padStart(8, "0")}
                                </div>
                              );
                            }))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-chacha-accent mb-3">Algorithm Steps</h3>
                        <div className="space-y-2">
                          {steps.map((step, index) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg border-l-4 transition-all duration-300 text-sm ${currentStep >= index ? "bg-chacha-accent/80 border-chacha-primary text-chacha-alt" : "bg-chacha-accent/30 border-chacha-accent text-chacha-accent"} ${currentStep === index ? "scale-105 shadow-lg" : ""}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0 ${currentStep >= index ? "bg-chacha-primary text-chacha-alt" : "bg-chacha-accent/30 text-chacha-accent"}`}>
                                    {index + 1}
                                  </div>
                                  <span>{step}</span>
                                </div>
                                {currentStep === index && isAnimating && (
                                  <div className="ml-3 w-3 h-3 bg-chacha-primary rounded-full animate-ping"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <CoreMixingVisualizer 
                      currentStep={currentStep} 
                      roundType={roundType} 
                      currentRoundNum={currentRoundNum} 
                      highlightedIndices={highlightedIndices} 
                    />
                    <AdditionVisualizer 
                      currentStep={currentStep} 
                      mixedState={mixedStateForViz} 
                      initialState={initialStateForViz} 
                      resultState={matrix} 
                    />
                    <KeystreamVisualizer 
                      currentStep={currentStep} 
                      keystreamBytes={keystreamBytesForViz} 
                    />
                    <XorVisualizer 
                      currentStep={currentStep} 
                      keystreamBytes={keystreamBytesForViz} 
                                            plaintextBytes={plaintextBytesForViz}
                      ciphertextBytes={ciphertextBytesForViz}
                      isDecrypting={isDecrypting}
                    />
                    <div className={`transition-opacity duration-500 ${currentStep >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                        <h3 className="text-lg font-semibold text-chacha-accent mb-4">
                        {isDecrypting ? "Decrypted Plaintext" : "Encrypted Ciphertext"}
                      </h3>
                      <div className="bg-chacha-accent/10 p-4 rounded-lg">
                        {output ? (
                          <div className="font-mono text-sm break-all">
                            {isDecrypting ? (
                              <div className="text-chacha-primary">{output}</div>
                            ) : (
                              <div className="text-chacha-accent">{output}</div>
                            )}
                          </div>
                        ) : (
                          <p className="text-chacha-accent text-center italic">
                            {isDecrypting 
                              ? "Decrypted message will appear here..." 
                              : "Encrypted ciphertext will appear here..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          {activeTab === "theory" && (
            <section className="max-w-7xl mx-auto animate-fade-in">
              <TheoryTab />
            </section>
          )}
          {activeTab === "example" && (
            <section className="max-w-7xl mx-auto animate-fade-in">
              <ExampleTab />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChaCha20Interactive;