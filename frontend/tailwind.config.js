/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/config/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        '6xs': '0.625rem', // 10px
        '7xs': '0.5rem', // 8px
      colors: {
        'alms-navy': '#001F54',
        'alms-navy-dark': '#00163D',
        'alms-indigo': '#6366F1',
        'alms-indigo-dark': '#4F46E5',
      },
    },
  },
  plugins: [],
}
}
