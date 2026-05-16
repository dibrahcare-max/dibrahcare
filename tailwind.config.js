/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#E9eedd',
        bg2: '#d5e6c0',
        dark: '#5f6157',
        dark2: '#4d4f47',
        gold: '#CDBE8C',
        muted: '#8a8e80',
      },
      fontFamily: {
        pnu: ['PNU', 'Tajawal', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
