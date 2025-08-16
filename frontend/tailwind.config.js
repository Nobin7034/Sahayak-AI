/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#059669',
        accent: '#dc2626'
      }
    },
  },
  plugins: [],
};