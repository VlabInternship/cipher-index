# Ciphers Virtual-Lab

## Overview
Ciphers Virtual-Lab is an interactive web application built using Next.js and React. It provides users with a platform to explore and visualize various cryptographic ciphers interactively. Each cipher has its own dedicated page with detailed explanations, examples, and interactive tools to understand encryption and decryption processes.

## Features
- **Interactive Visualization**: Learn how different ciphers work through step-by-step animations.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Multiple Ciphers**: Includes popular ciphers such as Salsa20, Hill Cipher, RailFence Cipher, Vigenere Cipher, A5/1 Cipher, ChaCha20 Cipher, One Time Pad Cipher, Speck Cipher, Present Cipher, and RC4 Cipher.
- **Customizable Inputs**: Users can input their own plaintext and keys to see the encryption and decryption results.

## Technologies Used
- **Next.js**: Framework for building server-rendered React applications.
- **React**: Library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide Icons**: Icon library for enhancing the UI.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/VlabInternship/chiper-index.git
   ```
2. Navigate to the project directory:
   ```bash
   cd ciper-index
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the application in your browser at `http://localhost:3000`.

## Project Structure
```
├── pages
│   ├── index.jsx          # Landing page
│   ├── hill-cipher.jsx    # Hill Cipher page
│   ├── salsa20.jsx        # Salsa20 Cipher page
│   ├── ...                # Other cipher pages
├── public
│   ├── favicon.ico        # Favicon
│   ├── ...                # Public assets
├── styles
│   ├── globals.css        # Global styles
├── tailwind.config.js     # Tailwind CSS configuration
├── next.config.mjs        # Next.js configuration
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## How to Add a New Cipher
1. Create a new page in the `pages` directory (e.g., `new-cipher.jsx`).
2. Implement the cipher logic and interactive visualization.
3. Add the cipher to the list on the landing page (`index.jsx`).
4. Test the new cipher page thoroughly.

## Contributing
Contributions are welcome! If you have suggestions for new ciphers or improvements, feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License.

## Contact
For any inquiries or support, please contact [VlabInternship](https://github.com/VlabInternship).
