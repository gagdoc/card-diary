/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        'sky-gradient-start': '#E0F2FE', // light sky blue
        'sky-gradient-end': '#F0F9FF',   // lighter sky blue
      }
    },
  },
  plugins: [],
}
