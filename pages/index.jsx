import React, { useState } from 'react';

// Data for the different pages and the table.
// In a real application, this data would likely be fetched from an API or live in a separate file.
const TABLE_DATA = [
  { algorithm: 'Playfair Cipher', type: 'Symmetric', class: 'Digram Substitution', keyLength: 'Keyword', blockSize: '5x5 Matrix', corePrinciple: 'Polygraphic substitution', keyStrength: 'Weak', modernStatus: 'Historical/Educational' },
  { algorithm: 'Vigenère Cipher', type: 'Symmetric', class: 'Polyalphabetic Substitution', keyLength: 'Repeating Keyword', blockSize: 'N/A (Stream)', corePrinciple: 'Disguising letter frequency', keyStrength: 'Weak', modernStatus: 'Historical/Educational' },
  { algorithm: 'Hill Cipher', type: 'Symmetric', class: 'Polygraphic Substitution', keyLength: 'Matrix', blockSize: 'N x N Matrix', corePrinciple: 'Linear algebraic transformation', keyStrength: 'Weak', modernStatus: 'Historical/Educational' },
  { algorithm: 'Rail Fence Cipher', type: 'Symmetric', class: 'Transposition', keyLength: 'Number of Rails', blockSize: 'N/A (Stream)', corePrinciple: 'Zig-zag transposition', keyStrength: 'Weak', modernStatus: 'Historical/Educational' },
  { algorithm: 'One-Time Pad', type: 'Symmetric', class: 'Stream', keyLength: 'As long as message', blockSize: 'N/A (Stream)', corePrinciple: 'XOR with truly random key', keyStrength: 'Unbreakable (Theoretically)', modernStatus: 'Historical/Specialized' },
  { algorithm: 'Feistel Cipher', type: 'Symmetric', class: 'Block Cipher Structure', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'Iterative, invertible rounds', keyStrength: 'Varies', modernStatus: 'Foundational/Design Pattern' },
  { algorithm: 'DES', type: 'Symmetric', class: 'Block', keyLength: '56 bits', blockSize: '64 bits', corePrinciple: 'Feistel Network', keyStrength: 'Insecure (Brute-Force)', modernStatus: 'Obsolete' },
  { algorithm: 'AES', type: 'Symmetric', class: 'Block', keyLength: '128, 192, 256 bits', blockSize: '128 bits', corePrinciple: 'Substitution-Permutation Network', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'Threefish', type: 'Symmetric', class: 'Block (Tweakable)', keyLength: '256, 512, 1024 bits', blockSize: 'Same as key', corePrinciple: 'ARX, No S-boxes, Tweakable', keyStrength: 'Secure', modernStatus: 'Specialized/Niche' },
  { algorithm: 'PRESENT', type: 'Symmetric', class: 'Block (Lightweight)', keyLength: '80, 128 bits', blockSize: '64 bits', corePrinciple: 'Simple SPN', keyStrength: 'Secure', modernStatus: 'Specialized/IoT' },
  { algorithm: 'IDEA', type: 'Symmetric', class: 'Block', keyLength: '128 bits', blockSize: '64 bits', corePrinciple: 'Interleaving algebraic operations', keyStrength: 'Secure', modernStatus: 'Specialized/Historical' },
  { algorithm: 'SPECK', type: 'Symmetric', class: 'Block (Lightweight)', keyLength: '64-256 bits', blockSize: '32-128 bits', corePrinciple: 'ARX, Software-optimized', keyStrength: 'Secure', modernStatus: 'Specialized/IoT' },
  { algorithm: 'RC4', type: 'Symmetric', class: 'Stream', keyLength: '40-2048 bits', blockSize: 'N/A (Stream)', corePrinciple: 'Pseudo-random keystream generator', keyStrength: 'Insecure (Known Attacks)', modernStatus: 'Deprecated' },
  { algorithm: 'Salsa20', type: 'Symmetric', class: 'Stream', keyLength: '128, 256 bits', blockSize: '512-bit block', corePrinciple: 'ARX, Parallelizable', keyStrength: 'Highly Secure', modernStatus: 'Specialized/Niche' },
  { algorithm: 'ChaCha20', type: 'Symmetric', class: 'Stream', keyLength: '256 bits', blockSize: '512-bit block', corePrinciple: 'ARX, Improved diffusion', keyStrength: 'Highly Secure', modernStatus: 'Modern Standard' },
  { algorithm: 'A5/1', type: 'Symmetric', class: 'Stream', keyLength: '64 bits', blockSize: 'N/A (Stream)', corePrinciple: 'Irregularly clocked LFSRs', keyStrength: 'Insecure (Known Attacks)', modernStatus: 'Obsolete' },
  { algorithm: 'RSA', type: 'Asymmetric', class: 'Public-Key', keyLength: '1024-4096+ bits', blockSize: 'N/A (Block)', corePrinciple: 'Factoring large primes', keyStrength: 'Secure (Large Keys)', modernStatus: 'Global Standard' },
  { algorithm: 'HMAC', type: 'N/A', class: 'Authentication', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'Two-pass keyed hash', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-256', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-2 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-384', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-3 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-512', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-3 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-3', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-3 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-3-256', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-3 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-3-384', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-3 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
  { algorithm: 'SHA-3-512', type: 'Hash', class: 'Hash', keyLength: 'Varies', blockSize: 'Varies', corePrinciple: 'SHA-3 family', keyStrength: 'Highly Secure', modernStatus: 'Global Standard' },
];
const PAGES = {
  'index': {
    title: 'The Cryptography Compendium',
    subtitle: 'A Definitive Guide to Foundational and Modern Cryptographic Algorithms',
    content: (
      <>
        <div className="grid grid-cols-1 gap-8">
          {/* Intro Card */}
          <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="h-8 w-1 bg-[#0056b3] rounded mr-4 mt-1" />
              <h2 className="text-2xl font-semibold text-[#0056b3]">Introduction to Cryptographic Principles</h2>
            </div>
            <div className="prose text-gray-700 max-w-none">
              <p>Cryptography is the science of secure communication in the presence of adversaries. At its core, it is a discipline that seeks to achieve three primary goals: <strong className="font-semibold">confidentiality, integrity, and authentication</strong>, collectively known as the CIA triad. Confidentiality ensures that information is accessible only to authorized parties. Integrity guarantees that data has not been altered or tampered with. Authentication verifies the identity of the communicating parties. These principles are realized through the transformation of a readable message, known as <span className="key-term">plaintext</span>, into an unreadable form called <span className="key-term">ciphertext</span>. This transformation is guided by a key, a piece of information that is crucial for both the encryption and decryption processes.</p>
              <p>A fundamental distinction in cryptography is between symmetric and asymmetric key systems. <span className="key-term">Symmetric-key algorithms</span>, also called secret-key cryptography, use the same key for both encryption and decryption. This requires both the sender and the receiver to securely possess this shared key prior to communication. In contrast, <span className="key-term">asymmetric-key algorithms</span>, or public-key cryptography, utilize two different, mathematically linked keys: a public key for encryption and a private key for decryption. The public key can be shared openly, while the private key must be kept secret, thereby solving the problem of secure key distribution that symmetric systems face.</p>
              <p>Another key classification is based on how algorithms process data. <span className="key-term">Block ciphers</span> encrypt data in fixed-size chunks, or blocks, of a given length, such as 64 bits or 128 bits. If the message is not an exact multiple of the block size, padding is added to complete the final block. <span className="key-term">Stream ciphers</span>, on the other hand, encrypt data one bit or byte at a time, continuously generating a pseudo-random keystream that is combined with the plaintext. Finally, cryptographic design relies on two core concepts introduced by Claude Shannon: <span className="key-term">confusion</span> and <span className="key-term">diffusion</span>. Confusion obfuscates the relationship between the key and the ciphertext, making it difficult for an adversary to deduce the key from the ciphertext. Diffusion disperses the statistical properties of the plaintext over the entire ciphertext, ensuring that changing a single plaintext bit affects many ciphertext bits, thereby obscuring patterns. The following report will explore how these principles are applied across a diverse range of cryptographic algorithms.</p>
            </div>
          </div>

          {/* Table of Contents Card */}
          <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="h-8 w-1 bg-[#0056b3] rounded mr-4 mt-1" />
              <h2 className="text-2xl font-semibold text-[#0056b3]">Table of Contents</h2>
            </div>
            <div className="text-gray-800">
              <h3 className="font-semibold">Part I: The Foundations - Manual and Historical Ciphers</h3>
              <ul className="list-none p-0 mt-3 space-y-2">
                <li><a href="/playfair-cipher" className="text-[#0056b3] hover:underline">1. Playfair Cipher: A First Look at Digram Substitution</a></li>
                <li><a href="/vigenere-cipher" className="text-[#0056b3] hover:underline">2. Vigenère Cipher: The Polyalphabetic Masterpiece</a></li>
                <li><a href="/hill-cipher" className="text-[#0056b3] hover:underline">3. Hill Cipher: A Primer on Linear Algebra in Cryptography</a></li>
                <li><a href="/railfence-cipher" className="text-[#0056b3] hover:underline">4. Rail Fence Cipher: The Simple Elegance of Transposition</a></li>
                <li><a href="/onetimepad-cipher" className="text-[#0056b3] hover:underline">5. One-Time Pad: The Epitome of Perfect Secrecy</a></li>
              </ul>

              <h3 className="font-semibold mt-6">Part II: Modern Symmetric Ciphers - The Block Era</h3>
              <ul className="list-none p-0 mt-3 space-y-2">
                <li><a href="/feistel-cipher" className="text-[#0056b3] hover:underline">6. Feistel Cipher Structure: A Foundational Blueprint</a></li>
                <li><a href="/des-cipher" className="text-[#0056b3] hover:underline">7. Data Encryption Standard (DES): A Pioneer with a Feistel Core</a></li>
                <li><a href="/aes-cipher" className="text-[#0056b3] hover:underline">8. Advanced Encryption Standard (AES): The Global Standard</a></li>
                <li><a href="/threefish-cipher" className="text-[#0056b3] hover:underline">9. Threefish: A Tweakable and S-Box-Free Design</a></li>
                <li><a href="/present-cipher" className="text-[#0056b3] hover:underline">10. PRESENT: The Lightweight Champion for IoT</a></li>
                <li><a href="/idea-cipher" className="text-[#0056b3] hover:underline">11. International Data Encryption Algorithm (IDEA)</a></li>
                <li><a href="/speck-cipher" className="text-[#0056b3] hover:underline">12. SPECK: The Software-Optimized Lightweight Contender</a></li>
              </ul>

              <h3 className="font-semibold mt-6">Part III: Modern Symmetric Ciphers - The Stream Era</h3>
              <ul className="list-none p-0 mt-3 space-y-2">
                <li><a href="/rc4-cipher" className="text-[#0056b3] hover:underline">13. RC4: The Once-Ubiquitous Stream Cipher</a></li>
                <li><a href="/salsa20-cipher" className="text-[#0056b3] hover:underline">14. Salsa20: The ARX-Based Speed Demon</a></li>
                <li><a href="/chacha20-cipher" className="text-[#0056b3] hover:underline">15. ChaCha20: The Modern Successor to Salsa20</a></li>
                <li><a href="/a51-cipher" className="text-[#0056b3] hover:underline">16. A5/1: The Legacy of Mobile Voice Encryption</a></li>
              </ul>

              <h3 className="font-semibold mt-6">Part IV: The Asymmetric Revolution and Authentication</h3>
              <ul className="list-none p-0 mt-3 space-y-2">
                <li><a href="/rsa-cipher" className="text-[#0056b3] hover:underline">17. RSA: The Cornerstone of Public-Key Cryptography</a></li>
                <li><a href="/hmac-cipher" className="text-[#0056b3] hover:underline">18. HMAC: The Guardian of Integrity and Authenticity</a></li>
              </ul>
              <h3 className="font-semibold mt-6">Part V: Meet The Team</h3>
              <ul className="list-none p-0 mt-3 space-y-2">
                <li><a href="/team" className="text-[#0056b3] hover:underline">Meet our talented team of developers and researchers.</a></li>
              </ul>
            </div>
          </div>

          {/* Comparative / Future Card */}
          <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="h-8 w-1 bg-[#0056b3] rounded mr-4 mt-1" />
              <h2 className="text-2xl font-semibold text-[#0056b3]">Comparative Analysis and Future Outlook</h2>
            </div>
            <div className="text-gray-700">
              <p className="mb-6">The eighteen algorithms explored in this report represent a chronological and conceptual journey through the evolution of cryptography. From the manual, paper-and-pencil ciphers of the 19th and early 20th centuries to the software- and hardware-optimized algorithms of the modern era, the field has continuously adapted to new threats and technological advancements.</p>
              <p className="mb-6">The transition from the Vigenère and Playfair ciphers to modern block ciphers like DES and AES demonstrates a fundamental shift from human-centric to machine-centric design. The advent of the Feistel structure provided a reliable, provably invertible blueprint for iterative ciphers, a concept that underpins DES. This evolution continued with AES, a new standard selected through a public competition, a process that built a level of trust and transparency that DES had famously lacked.</p>
              <p className="mb-6">The rise of algorithms like ChaCha20 and SPECK shows that the goal of cryptographic design is no longer just about defeating cryptanalysis; it is also about adapting to new computing environments. ChaCha20, an elegant refinement of Salsa20, demonstrates that an already-secure algorithm can be improved for better performance on modern, multi-core processors. Similarly, SPECK was developed to address the specific needs of the burgeoning Internet of Things (IoT) ecosystem, where power and memory are severely constrained.</p>
              <p className="mb-6">The introduction of asymmetric cryptography by RSA was a revolution in itself. By solving the key distribution problem, it enabled secure communication on a global scale and laid the groundwork for the modern internet. Meanwhile, HMAC provides a sophisticated and elegant solution to a more specific problem: ensuring data integrity and authenticity without relying on complex public-key infrastructure.</p>

              <div className="overflow-x-auto mt-6">
                <table className="w-full border-collapse text-sm table-fixed">
                  <thead className="sticky top-0 bg-[#0056b3] text-white font-semibold">
                    <tr>
                      <th className="p-3 text-left align-top">Algorithm</th>
                      <th className="p-3 text-left align-top">Type</th>
                      <th className="p-3 text-left align-top">Class</th>
                      <th className="p-3 text-left align-top">Key Length</th>
                      <th className="p-3 text-left align-top">Block/Key Size</th>
                      <th className="p-3 text-left align-top">Core Principle</th>
                      <th className="p-3 text-left align-top">Key Strength</th>
                      <th className="p-3 text-left align-top">Modern Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE_DATA.map((row, index) => (
                      <tr key={index} className="even:bg-gray-50">
                        <td className="p-3 border border-gray-200 align-top">{row.algorithm}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.type}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.class}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.keyLength}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.blockSize}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.corePrinciple}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.keyStrength}</td>
                        <td className="p-3 border border-gray-200 align-top">{row.modernStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* The Future of Cryptography Section */}
              <div className="mt-10">
                <div className="flex items-start mb-4">
                  <div className="h-8 w-1 bg-[#0056b3] rounded mr-4 mt-1" />
                  <h3 className="text-xl font-semibold text-[#0056b3]">The Future of Cryptography</h3>
                </div>
                <p className="text-gray-700">
                  The journey from simple ciphers to modern algorithms is a story of continuous innovation driven by the need to outpace evolving threats. While algorithms like AES and ChaCha20 are the de facto standards today, the field is already looking toward the next major challenge: quantum computing. The rise of <span className="text-[#0056b3] font-semibold">post-quantum cryptography (PQC)</span> aims to develop new algorithms that can withstand attacks from future quantum computers, which would render current public-key systems like RSA insecure. This ongoing evolution demonstrates that cryptography is a living discipline, and the principles learned from historical algorithms remain relevant as the building blocks for future security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  // Add JSX content for other pages here
  'playfair-cipher': {
    title: 'Playfair Cipher',
    subtitle: 'A First Look at Digram Substitution',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">What is the Playfair Cipher?</h2>
          <div className="section-content">
            <p>The Playfair cipher is a manual symmetric encryption technique invented by Charles Wheatstone in 1854. Unlike simpler substitution ciphers that replace a single letter, Playfair replaces pairs of letters (digrams), making it significantly harder to break using frequency analysis.</p>
            <div className="security-indicator-insecure">
              <p>Considered Insecure for Modern Use</p>
            </div>
            <div className="example-block">
              <h3 className="example-title">Example: Encrypting "HELLO" with key "PLAYFAIR"</h3>
              <div className="cipher-demo">
                <div className="cipher-step">
                  <strong className="font-semibold">Step 1: Create the 5x5 key matrix.</strong>
                  <p>A keyword is used to fill a 5x5 grid, with any duplicate letters omitted. The remaining letters of the alphabet (I and J are often treated as one letter) fill the rest of the grid.</p>
                  <pre>P L A Y F
I R B C D
E G H K M
N O Q S T
U V W X Z</pre>
                </div>
                <div className="cipher-step">
                  <strong className="font-semibold">Step 2: Prepare the plaintext.</strong>
                  <p>The plaintext is broken into digrams. If a digram contains a double letter (e.g., LL), an 'X' is inserted between them. If the message has an odd number of letters, a 'Z' is added to the end.</p>
                  <p>Plaintext: H E L L O</p>
                  <p>Digrams: HE LX LO</p>
                </div>
                <div className="cipher-step">
                  <strong className="font-semibold">Step 3: Encrypt each digram.</strong>
                  <p>Pairs are encrypted based on their position in the matrix. Three rules apply:</p>
                  <ol>
                    <li><strong className="font-semibold">Same Row:</strong> Replace each letter with the one to its right (wrapping around).</li>
                    <li><strong className="font-semibold">Same Column:</strong> Replace each letter with the one below it (wrapping around).</li>
                    <li><strong className="font-semibold">Different Row & Column:</strong> Form a rectangle and take the letters on the same row, at the opposite corners.</li>
                  </ol>
                  <p>Applying the rules to our digrams:</p>
                  <ul className="list-disc pl-5">
                    <li><strong className="font-semibold">H and E:</strong> Same row (row 2). H is at index 2, E is at index 0. H becomes the letter to its right (K). E becomes the letter to its right (G). So, HE becomes KG.</li>
                    <li><strong className="font-semibold">L and X:</strong> Different row and column. L is at (0,1), X is at (4,3). The rectangle corners are (0,3) (Y) and (4,1) (V). So, LX becomes YV.</li>
                    <li><strong className="font-semibold">L and O:</strong> Different row and column. L is at (0,1), O is at (3,1). Same column rule: L becomes O, O becomes S. So, LO becomes OS.</li>
                  </ul>
                  <p>Final Ciphertext: KG YV OS</p>
                </div>
              </div>
            </div>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'vigenere-cipher': {
    title: 'Vigenère Cipher',
    subtitle: 'The Polyalphabetic Masterpiece',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">What is the Vigenère Cipher?</h2>
          <div className="section-content">
            <p>The Vigenère cipher is a method of encrypting alphabetic text by using a simple form of polyalphabetic substitution. A key is used to determine which shift is applied to each letter of the plaintext. It was widely regarded as unbreakable for centuries, earning it the nickname "le chiffre indéchiffrable" (the indecipherable cipher), until it was successfully broken by Charles Babbage and later independently by Friedrich Kasiski.</p>
            <div className="security-indicator-insecure">
              <p>Considered Insecure for Modern Use</p>
            </div>
            <div className="example-block">
              <h3 className="example-title">Example: Encrypting "CRYPTOGRAPHY" with key "LEMON"</h3>
              <div className="cipher-demo">
                <div className="cipher-step">
                  <strong className="font-semibold">Step 1: Align plaintext with the repeating key.</strong>
                  <p>Plaintext: C R Y P T O G R A P H Y</p>
                  <p>Key:       L E M O N L E M O N L E</p>
                </div>
                <div className="cipher-step">
                  <strong className="font-semibold">Step 2: Use the Vigenère table to find the ciphertext letter.</strong>
                  <p>Each plaintext letter is encrypted using a different alphabet determined by the corresponding key letter. The table is a grid of shifted alphabets.</p>
                  <ul className="list-disc pl-5">
                    <li>Plaintext 'C' + Key 'L' -&gt; 'N'</li>
                    <li>Plaintext 'R' + Key 'E' -&gt; 'V'</li>
                    <li>Plaintext 'Y' + Key 'M' -&gt; 'K'</li>
                    <li>Plaintext 'P' + Key 'O' -&gt; 'D'</li>
                    <li>Plaintext 'T' + Key 'N' -&gt; 'G'</li>
                    <li>...and so on.</li>
                  </ul>
                  <p>A simpler way to visualize this is using modular arithmetic, where A=0, B=1, etc.
                    Ciphertext = (Plaintext + Key) mod 26</p>
                  <p>C (2) + L (11) = 13 mod 26 = N (13)</p>
                  <p>R (17) + E (4) = 21 mod 26 = V (21)</p>
                  <pre>
Plaintext:  C R Y P T O G R A P H Y
Key:        L E M O N L E M O N L E
Ciphertext: N V K D G Z I Y V D S O</pre>
                </div>
              </div>
            </div>
            <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'rail-fence-cipher': {
    title: 'Rail Fence Cipher',
    subtitle: 'The Simple Elegance of Transposition',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">What is the Rail Fence Cipher?</h2>
          <div className="section-content">
            <p>The Rail Fence cipher is a form of <span className="key-term">transposition cipher</span> that rearranges the letters of the plaintext without changing them. The message is written out in a zig-zag pattern on a series of "rails" and then read off row by row. The key is the number of rails used in the process.</p>
            <div className="security-indicator-insecure">
              <p>Considered Insecure for Modern Use</p>
            </div>
            <div className="example-block">
              <h3 className="example-title">Example: Encrypting "TRANSPOSITION" with 3 rails</h3>
              <div className="cipher-demo">
                <div className="cipher-step">
                  <strong className="font-semibold">Step 1: Write the message in a zig-zag pattern.</strong>
                  <p>Using 3 rails, we write the letters diagonally.</p>
                  <div className="rail-visual">
                    <span className="rail-line-1">T . . . S . . . O . . . I . . . N</span>
                    <span className="rail-line-2">. R . N . P . S . T . O . I . O .</span>
                    <span className="rail-line-3">. . A . . . I . . . T . . . P . .</span>
                  </div>
                </div>
                <div className="cipher-step">
                  <strong className="font-semibold">Step 2: Read the message off row by row.</strong>
                  <p>Reading the letters from each rail, left to right.</p>
                  <pre>Rail 1: T S O I N
Rail 2: R N P S T O I O
Rail 3: A I T P</pre>
                  <p>Final Ciphertext: TSOINRNPSTOIOAITP</p>
                </div>
              </div>
            </div>
            <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  // Dummy pages for demonstration
  'one-time-pad': {
    title: 'One-Time Pad',
    subtitle: 'The Epitome of Perfect Secrecy',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">The Unbreakable Cipher</h2>
          <div className="section-content">
            <p>The One-Time Pad (OTP) is the only known encryption scheme that is provably unbreakable. It works by combining a message with a truly random key of the same length. The key, known as the pad, is used only once and then discarded.</p>
            <div className="security-indicator-high">
              <p>Theoretically Secure, but Impractical</p>
            </div>
            <p>While the OTP offers perfect secrecy, its practical use is limited because of the challenge of generating, distributing, and securely storing a truly random key that is as long as the message itself. This makes it unsuitable for most modern applications, though it is used in highly specialized scenarios.</p>
            <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'feistel-cipher': {
    title: 'Feistel Cipher Structure',
    subtitle: 'A Foundational Blueprint',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Blueprint for Block Ciphers</h2>
          <div className="section-content">
            <p>The Feistel cipher is a symmetric structure used in the construction of block ciphers, including DES. It's a key design element that makes both encryption and decryption straightforward by using a series of identical, invertible rounds.</p>
            <div className="security-indicator-high">
              <p>A Strong and Proven Design Pattern</p>
            </div>
            <p>The core principle is to split the plaintext block into two halves, L (left) and R (right). In each round, the right half is combined with a subkey, and the result is XORed with the left half. The halves are then swapped. This process is repeated for a set number of rounds. The beauty of this structure is that decryption is simply the same process in reverse order, using the subkeys in the opposite sequence.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'des': {
    title: 'Data Encryption Standard (DES)',
    subtitle: 'A Pioneer with a Feistel Core',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">The First Public Block Cipher</h2>
          <div className="section-content">
            <p>DES was a symmetric-key algorithm published by the U.S. National Bureau of Standards in 1977. It became a widely used standard, but its small 56-bit key size is now considered insecure and vulnerable to brute-force attacks.</p>
            <div className="security-indicator-insecure">
              <p>Obsolete and Insecure</p>
            </div>
            <p>DES is based on the Feistel cipher structure, performing 16 rounds of encryption. While no longer secure for modern applications, its design remains a fundamental part of cryptographic history and a prime example of the Feistel structure in action.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'aes': {
    title: 'Advanced Encryption Standard (AES)',
    subtitle: 'The Global Standard',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">The Modern Standard for Encryption</h2>
          <div className="section-content">
            <p>AES is a symmetric-key block cipher adopted by the U.S. government and is now the de facto standard for encryption worldwide. It was selected through a public competition to replace DES. AES operates on 128-bit blocks and supports key sizes of 128, 192, and 256 bits.</p>
            <div className="security-indicator-high">
              <p>Highly Secure and Widely Used</p>
            </div>
            <p>Unlike DES, AES is not a Feistel cipher; it is a Substitution-Permutation Network (SPN). It is highly efficient in both hardware and software implementations and is considered secure against all known attacks when properly implemented.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'threefish': {
    title: 'Threefish',
    subtitle: 'A Tweakable and S-Box-Free Design',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Tweakable Block Cipher</h2>
          <div className="section-content">
            <p>Threefish is a symmetric-key block cipher developed as a part of the Skein hash function. It's notable for its tweakable design, which allows it to be more resistant to certain types of attacks, and for its use of only simple ARX (Add, Rotate, XOR) operations, avoiding S-boxes altogether. This design makes it very fast in software.</p>
            <div className="security-indicator-high">
              <p>Secure and Specialized</p>
            </div>
            <p>Threefish operates on large block sizes (256, 512, or 1024 bits), matching its key size. While not as common as AES, it is a highly secure and innovative design.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'present': {
    title: 'PRESENT',
    subtitle: 'The Lightweight Champion for IoT',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Lightweight Block Cipher</h2>
          <div className="section-content">
            <p>PRESENT is a lightweight block cipher designed specifically for resource-constrained environments like RFID tags and wireless sensor networks. It is a simple Substitution-Permutation Network (SPN) with a small memory footprint and low power consumption.</p>
            <div className="security-indicator-high">
              <p>Secure for IoT and Embedded Systems</p>
            </div>
            <p>With a 64-bit block size and key sizes of 80 or 128 bits, PRESENT provides robust security in contexts where more complex algorithms like AES would be too demanding.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'idea': {
    title: 'International Data Encryption Algorithm (IDEA)',
    subtitle: '',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Pioneer with a Feistel Core</h2>
          <div className="section-content">
            <p>IDEA is a block cipher that operates on 64-bit blocks using a 128-bit key. It was a precursor to AES and was used in the popular PGP (Pretty Good Privacy) software. IDEA is known for its use of three different mathematical operations on 16-bit sub-blocks to achieve strong diffusion.</p>
            <div className="security-indicator-high">
              <p>Secure, but Largely Superseded by AES</p>
            </div>
            <p>While still considered secure, its adoption declined with the rise of AES. It remains an important historical example of a strong, non-Feistel block cipher design.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'speck': {
    title: 'SPECK',
    subtitle: 'The Software-Optimized Lightweight Contender',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Lightweight and Flexible Block Cipher</h2>
          <div className="section-content">
            <p>SPECK is a lightweight block cipher designed by the NSA to be highly efficient in software implementations. It is an ARX (Add-Rotate-XOR) cipher, which makes it fast and easy to implement on a wide range of devices, from embedded systems to high-end servers.</p>
            <div className="security-indicator-high">
              <p>Secure and Optimized for Software</p>
            </div>
            <p>SPECK is a flexible cipher with various block and key sizes, making it highly adaptable for different applications. It is a strong contender for use in the Internet of Things (IoT).</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'rc4': {
    title: 'RC4',
    subtitle: 'The Once-Ubiquitous Stream Cipher',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Deprecated Stream Cipher</h2>
          <div className="section-content">
            <p>RC4 is a stream cipher that was once widely used in protocols like SSL/TLS and WEP. Its simplicity and speed made it popular, but it has been shown to be vulnerable to several serious attacks, particularly related to its key setup and keystream generation.</p>
            <div className="security-indicator-insecure">
              <p>Deprecated and Insecure</p>
            </div>
            <p>Due to its known weaknesses, RC4 is now officially deprecated and should not be used in any new systems. It serves as a cautionary tale about the need for rigorous cryptanalysis.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'salsa20': {
    title: 'Salsa20',
    subtitle: 'The ARX-Based Speed Demon',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">A Secure and Fast Stream Cipher</h2>
          <div className="section-content">
            <p>Salsa20 is a stream cipher designed by Daniel J. Bernstein. It is an ARX (Add, Rotate, XOR) cipher, which makes it incredibly fast on most modern processors. Its design is transparent, with all operations being public and well-understood, leading to high confidence in its security.</p>
            <div className="security-indicator-high">
              <p>Highly Secure and Fast</p>
            </div>
            <p>Salsa20 is known for its excellent performance and security. It has largely been superseded by its successor, ChaCha20, which provides even better diffusion and performance on some architectures.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'chacha20': {
    title: 'ChaCha20',
    subtitle: 'The Modern Successor to Salsa20',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">The Go-To Stream Cipher</h2>
          <div className="section-content">
            <p>ChaCha20 is an evolution of the Salsa20 stream cipher. It maintains the core ARX design but improves the diffusion properties, making it even more secure and slightly faster on certain hardware. It is now widely used, especially in contexts where hardware acceleration for AES is not available, such as in mobile devices and open-source software like OpenSSH and TLS.</p>
            <div className="security-indicator-high">
              <p>The Modern Standard for Stream Ciphers</p>
            </div>
            <p>ChaCha20 is often used in conjunction with Poly1305, a message authentication code, to form ChaCha20-Poly1305, a modern and highly secure authenticated encryption scheme.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'a5-1': {
    title: 'A5/1',
    subtitle: 'The Legacy of Mobile Voice Encryption',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">The GSM Voice Encryption Algorithm</h2>
          <div className="section-content">
            <p>A5/1 is a stream cipher used to provide confidentiality for mobile phone communication in the GSM standard. It is built from three linear-feedback shift registers (LFSRs) that are irregularly clocked, which was intended to provide security.</p>
            <div className="security-indicator-insecure">
              <p>Obsolete and Easily Broken</p>
            </div>
            <p>Due to its short key length and design flaws, A5/1 is easily broken with modern computing power. It has been replaced by more secure ciphers in newer mobile communication standards.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'rsa': {
    title: 'RSA',
    subtitle: 'The Cornerstone of Public-Key Cryptography',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">The Foundation of Public-Key Cryptography</h2>
          <div className="section-content">
            <p>RSA is an asymmetric-key algorithm used for both encryption and digital signatures. Its security relies on the computational difficulty of factoring large prime numbers. It was the first practical algorithm of its kind and revolutionized secure communication.</p>
            <div className="security-indicator-high">
              <p>Highly Secure with Large Key Sizes</p>
            </div>
            <p>RSA is a cornerstone of modern secure communication, used in protocols like TLS/SSL to establish a secure connection. Its keys must be large (e.g., 2048 bits or higher) to remain secure against modern attacks. RSA is vulnerable to attacks from future quantum computers, which is a major motivation for the development of post-quantum cryptography.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
    ),
  },
  'hmac': {
    title: 'HMAC',
    subtitle: 'The Guardian of Integrity and Authenticity',
    content: (
      <>
        <div className="section-card">
          <h2 className="section-title">Keyed-Hash Message Authentication Code</h2>
          <div className="section-content">
            <p>HMAC is a specific type of Message Authentication Code (MAC) involving a cryptographic hash function (like SHA-256) and a secret cryptographic key. It is used to simultaneously verify both the data integrity and the authenticity of a message. It ensures that the message has not been altered and comes from an authenticated sender.</p>
            <div className="security-indicator-high">
              <p>Highly Secure and Widely Used</p>
            </div>
            <p>HMAC is a fundamental building block in many internet protocols and is considered a highly secure method for protecting the integrity of data in transit.</p>
          <a href="/" className="back-to-index">&larr; Back to Index</a>
          </div>
        </div>
      </>
        ),
      },
      'idea-cipher': {
        title: 'IDEA Cipher',
        subtitle: 'The Simple Elegance of Transposition',
        content: (
          <>
            <div className="section-card">
              <h2 className="section-title">What is the IDEA Cipher?</h2>
              <div className="section-content">
                <p>The IDEA cipher is a block cipher that operates on 64-bit blocks using a 128-bit key. It was designed by Xuejia Lai and James Massey in 1990 and is known for its use of three different mathematical operations on 16-bit sub-blocks to achieve strong diffusion.</p>
                <div className="security-indicator-high">
                  <p>Secure, but Largely Superseded by AES</p>
                </div>
                <p>While still considered secure, its adoption declined with the rise of AES. It remains an important historical example of a strong, non-Feistel block cipher design.</p>
                <a href="/" className="back-to-index">&larr; Back to Index</a>
              </div>
            </div>
          </>
        ),
      },
};



function App() {
  const [currentPage, setCurrentPage] = useState('index');
  const pageData = PAGES[currentPage] || PAGES['index'];

  return (
    <div className="min-h-screen font-inter bg-[#f5f5f5] text-[#2c3e50] leading-relaxed overflow-x-hidden relative
                    after:content-[''] after:fixed after:top-0 after:left-0 after:w-full after:h-full after:bg-[radial-gradient(circle_at_20%_80%,rgba(0,123,255,0.03)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(0,86,179,0.03)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(0,123,255,0.02)_0%,transparent_50%)] after:z-[-1] after:animate-backgroundShift">
  <div className="max-w-5xl mx-auto p-10 md:p-12 relative">
        <div className="hero text-center mb-12 py-12 relative animate-fadeInUp">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold bg-gradient-to-r from-[#007bff] to-[#0056b3] bg-clip-text text-transparent mb-6 leading-tight">
            {pageData.title}
          </h1>
          <p className="subtitle text-lg md:text-xl text-[#5a6c7d] font-light max-w-2xl mx-auto">
            {pageData.subtitle}
          </p>
        </div>
        <div className="fade-in">
          {pageData.content}
        </div>
      </div>
    </div>
  );
}

export default App;