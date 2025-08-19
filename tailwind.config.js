/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",  // Page Router content path
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chacha: {
          bg: '#f5f5f5',      // light page background
          accent: '#0056b3',  // darker blue (headers / accents)
          primary: '#007bff', // primary blue (highlights / buttons)
          alt: '#f9f9f9',     // alternate very light background (cards)
        }
      }
    },
  },
  plugins: [],
}
