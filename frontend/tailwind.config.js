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
        'alms-navy': '#0B1F3A',
        'alms-navy-dark': '#071526',
        'alms-navy-light': '#15325B',
        'alms-gold': '#D4AF37',
        'alms-gold-dark': '#B89628',
        'alms-gold-light': '#E6C65C',
        'alms-gray': '#F3F5F8',
        'alms-indigo': '#6366F1',
        'alms-indigo-dark': '#4F46E5',
      },
      spacing: {
        // 16.5rem — content inset used by the main layout (ml-66) and the header (left-66).
        66: '16.5rem',
        // 5.5rem — content inset for collapsed sidebar (left-22 / ml-22)
        22: '5.5rem',
      },
    },
  },
  plugins: [],
}
