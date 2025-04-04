/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa", // light gray background
        text: "#212529",       // dark gray text
        border: "#dee2e6",     // soft gray border
        foreground: "#111111"
      }
    },
  },
  plugins: [],
}