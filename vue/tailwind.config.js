/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        'accent': '#0ea5e9',
        'accent-dark': '#0369a1',
        'accent-light': '#bae6fd',
      }
    }
  },
  plugins: [],
}
