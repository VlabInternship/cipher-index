import React from 'react';

const WorksCited = () => {
  // Hardcoded list of citations provided by the user
  const citations = [
    { title: 'Playfair cipher - Wikipedia', url: 'https://en.wikipedia.org/wiki/Playfair_cipher' },
    { title: 'Playfair Cipher in cryptography | Abdul Wahab Junaid', url: 'https://awjunaid.com/cryptography/playfair-cipher-in-cryptography/' },
    { title: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher#:~:text=The%20Vigen%C3%A8re%20cipher%20(French%20pronunciation,of%20another%20text%2C%20the%20key.' },
    { title: 'Vigenère cipher - Wikipedia', url: 'https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher' },
    { title: 'Creating your own encryption and decryption algorithm - Cryptography Stack Exchange', url: 'https://crypto.stackexchange.com/questions/48054/creating-your-own-encryption-and-decryption-algorithm' },
    { title: 'An Introduction to Hill Ciphers Using Linear Algebra - UNT Math Department', url: 'https://math.unt.edu/~tushar/S10Linear2700%20%20Project_files/Worthington%20Paper.pdf' },
    { title: 'The Hill Cipher', url: 'https://mathcenter.oxford.emory.edu/site/math125/hillCipher/' },
    { title: 'Rail-Fence cipher Encryption & Decryption | Transposition Cipher ...', url: 'https://www.youtube.com/watch?v=m0A-SLHaDnc' },
    { title: 'Rail Fence Cipher Columnar Transposition', url: 'https://uregina.ca/~kozdron/Teaching/Cornell/135Summer06/Handouts/transposition.pdf' },
    { title: '[2015-01-07] Challenge #196 [Intermediate] Rail Fence Cipher : r/dailyprogrammer - Reddit', url: 'https://www.reddit.com/r/dailyprogrammer/comments/2rnwzf/20150107_challenge_196_intermediate_rail_fence/' },
    { title: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/One-time_pad#:~:text=The%20one%2Dtime%20pad%20(OTP,a%20one%2Dtime%20pad).' },
    { title: 'One-time pad - Wikipedia', url: 'https://en.wikipedia.org/wiki/One-time_pad' },
    { title: 'RC4 - Wikipedia', url: 'https://en.wikipedia.org/wiki/RC4' },
    { title: 'www.educative.io', url: 'https://www.educative.io/answers/what-is-the-feistel-cipher-structure#:~:text=Feistel%20cipher%20structure%20encrypts%20plain,used%20for%20the%20decryption%20process.' },
    { title: 'Feistel cipher - Wikipedia', url: 'https://en.wikipedia.org/wiki/Feistel_cipher' },
    { title: 'DATA ENCRYPTION STANDARD - UMSL', url: 'https://www.umsl.edu/~siegelj/information_theory/projects/des.netau.net/Dataencryptionstandard.html' },
    { title: 'Feistel Block Cipher - Tutorialspoint', url: 'https://www.tutorialspoint.com/cryptography/feistel_block_cipher.htm' },
    { title: 'The DES Algorithm Illustrated - Private Homepages', url: 'https://page.math.tu-berlin.de/~kant/teaching/hess/krypto-ws2006/des.htm' },
    { title: 'What is Data Encryption Standard (DES) in Cryptography ...', url: 'https://www.zenarmor.com/docs/network-security-tutorials/what-is-data-encryption-standard-des' },
    { title: 'Chapter 8 Data Encryption Standard - sandilands.info', url: 'https://sandilands.info/crypto/DataEncryptionStandard.html' },
    { title: 'What is Advanced Encryption Standard (AES)? - Portnox', url: 'https://www.portnox.com/cybersecurity-101/what-is-advanced-encryption-standard-aes/' },
    { title: 'Everything You Need to Know About AES-256 Encryption - Kiteworks', url: 'https://www.kiteworks.com/risk-compliance-glossary/aes-256-encryption/' },
    { title: 'AES Encryption I — How it works. What is AES? | by Void - Medium', url: 'https://medium.com/@atulit23/aes-encryption-i-how-it-works-d93f8cc8193e' },
    { title: 'Reconsidering Speck - LWN.net', url: 'https://lwn.net/Articles/761992/' },
    { title: 'What is AES? — Step by Step - zeroFruit - Medium', url: 'https://zerofruit-web3.medium.com/what-is-aes-step-by-step-fcb2ba41bb20' },
    { title: 'AES Example - Input (128 bit key and message) - Kavaliro', url: 'https://www.kavaliro.com/wp-content/uploads/2014/03/AES.pdf' },
    { title: 'Three Fish Algorithm: T-Mix Cipher using SHA-256 - ResearchGate', url: 'https://www.researchgate.net/publication/364051992_Three_Fish_Algorithm_T-Mix_Cipher_using_SHA-256' },
    { title: 'Threefish - Wikipedia', url: 'https://en.wikipedia.org/wiki/Threefish' },
    { title: 'Design and implementation of Threefish cipher algorithm in PNG file - Sustainable Engineering and Innovation', url: 'https://sei.ardascience.com/index.php/journal/article/download/131/136/411' },
    { title: 'The threefry random number generator - Pierre de Buyl\'s homepage', url: 'http://pdebuyl.be/blog/2016/threefry-rng.html' },
    { title: 'GIFT: A Small Present - Towards Reaching the Limit of ... - CHES', url: 'https://ches.iacr.org/2017/slides/ches2017s5t3.pdf' },
    { title: 'SIMON and SPECK are both pretty straightforward block cipher designs. You can im... | Hacker News', url: 'https://news.ycombinator.com/item?id=15303663' },
    { title: 'PRESENT - ASecuritySite.com', url: 'https://asecuritysite.com/encryption/present' },
    { title: 'IDEA - International Data Encryption Algorithm - Tutorialspoint', url: 'https://www.tutorialspoint.com/cryptography/idea_algorithm.htm' },
    { title: 'International Data Encryption Algorithm - Wikipedia', url: 'https://en.wikipedia.org/wiki/International_Data_Encryption_Algorithm' },
    { title: 'A SIMPLIFIED IDEA ALGORITHM 1. Introduction The International Data Encryption Algorithm (IDEA) is a symmetric-key, block cipher. - Northern Kentucky University', url: 'https://websites.nku.edu/~christensen/simplified%20IDEA%20algorithm.pdf' },
    { title: 'What is Speck (cipher)? Explain Speck (cipher), Define Speck (cipher), Meaning of Speck (cipher) - YouTube', url: 'https://www.youtube.com/watch?v=o0WGbjAFE_k' },
    { title: 'Side Channel Analysis of SPECK Based on Transfer Learning - PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9268767/' },
    { title: 'SIMON and SPECK Implementation Guide 1 Some Definitions and Routines - nsacyber.github.io', url: 'https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf' },
    { title: 'RC4 Encryption Algorithm Stream Ciphers Defined | Okta', url: 'https://www.okta.com/identity-101/rc4-stream-cipher/' },
    { title: 'RC4 Example | PDF - Scribd', url: 'https://www.scribd.com/document/664218841/RC4example' },
    { title: 'Simplified RC4 Example - sandilands.info', url: 'https://sandilands.info/sgordon/teaching/css322y07s2/protected/CSS322Y07S2H03-RC4-Example.pdf' },
    { title: 'A hardware solution for the Salsa20 encryption algorithm - California State University, Sacramento', url: 'https://scholars.csus.edu/esploro/outputs/graduate/A-hardware-solution-for-the-Salsa20/99257931763201671' },
    { title: 'Salsa20 - Wikipedia', url: 'https://en.wikipedia.org/wiki/Salsa20' },
    { title: 'The design of Chacha20 - Loup Vaillant', url: 'https://loup-vaillant.fr/tutorials/chacha20-design' },
    { title: 'Salsa20 Symmetric Cipher | Cryptography | Crypto-IT', url: 'http://www.crypto-it.net/eng/symmetric/salsa20.html' },
    { title: 'Salsa20 Usage & Deployment - IANIX', url: 'https://ianix.com/pub/salsa20-deployment.html' },
    { title: 'Understanding ChaCha20 Encryption: A Secure and Fast Algorithm ...', url: 'https://cyberw1ng.medium.com/understanding-chacha20-encryption-a-secure-and-fast-algorithm-for-data-protection-2023-a80c208c1401' },
    { title: 'ChaCha, a variant of Salsa20', url: 'https://cr.yp.to/chacha/chacha-20080128.pdf' },
    { title: 'A Detailed Overview of ChaCha20-256 Encryption : NodeJS - MojoAuth', url: 'https://mojoauth.com/encryption-decryption/chacha20-256-encryption--nodejs/' },
    { title: 'Another attack on A5/1 - Lund University Research Portal', url: 'https://portal.research.lu.se/en/publications/another-attack-on-a51-2' },
    { title: 'Interactive Online Simulation of the A5/1 Cipher', url: 'https://733amir.github.io/a51-cipher-simulator/' },
    { title: 'README.md - pamelasabio/A5-1-Encryption-Algorithm - GitHub', url: 'https://github.com/pamelasabio/A5-1-Encryption-Algorithm/blob/master/README.md' },
    { title: 'A5/1 stream cipher - ASecuritySite.com', url: 'https://asecuritysite.com/encryption/a5' },
    { title: 'In an A5/1 stream cipher, why do the registers have a stepping probability of 3/4', url: 'https://crypto.stackexchange.com/questions/33493/in-an-a5-1-stream-cipher-why-do-the-registers-have-a-stepping-probability-of-3' },
    { title: 'RSA Algorithm in Cryptography: Rivest Shamir Adleman Explained ...', url: 'https://www.splunk.com/en_us/blog/learn/rsa-algorithm-cryptography.html' },
    { title: 'RSA Encryption | Brilliant Math & Science Wiki', url: 'https://brilliant.org/wiki/rsa-encryption/' },
    { title: 'RSA cryptosystem - Wikipedia', url: 'https://en.wikipedia.org/wiki/RSA_cryptosystem' },
    { title: 'RSA Algorithm Example - UT Computer Science', url: 'https://www.cs.utexas.edu/~mitra/honors/soln.html' },
    { title: 'HMAC (Hash-Based Message Authentication Codes) Definition - Okta', url: 'https://www.okta.com/identity-101/hmac/' },
    { title: 'HMAC - Wikipedia', url: 'https://en.wikipedia.org/wiki/HMAC' },
    { title: 'Hash-based Message Authentication Code (HMAC): secure hash authentication - negg Blog', url: 'https://negg.blog/en/hash-based-message-authentication-code-hmac-secure-hash-authentication/' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 my-5 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-[#0056b3] mb-6">Works Cited</h2>
      <ul className="list-none space-y-4 text-left">
        {citations.map((citation, index) => (
          <li key={index} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg text-blue-600 hover:underline break-words"
            >
              {citation.title}
            </a>
            <p className="text-sm text-gray-500 mt-1 break-words">
              Accessed August 18, 2025
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorksCited;
