/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        calm: {
          950: "#0b1f3a",
          900: "#123159",
          800: "#1a4a80",
          700: "#2568a8",
          600: "#3a86c8",
          400: "#7fc4e8",
          200: "#c9e8f7",
          50: "#f2f9fd",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
};
