/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
      },
      colors: {
        'alms-navy': '#001F54',
        'alms-navy-dark': '#00163D',
        'alms-indigo': '#6366F1',
        'alms-indigo-dark': '#4F46E5',
      },
      spacing: {
        // 16.5rem — content inset used by the main layout (ml-66) and the header (left-66).
        // The floating sidebar occupies left-4 (1rem) + w-60 (15rem) = 16rem, so this leaves a
        // tight 0.5rem gap between the sidebar and the content (previously 2rem at ml-72, then
        // 1rem at ml-68).
        66: '16.5rem',
      },
    },
  },
  plugins: [],
}
