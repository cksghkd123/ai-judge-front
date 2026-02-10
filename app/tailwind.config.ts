import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FFFDF5',
        ink: '#18181B',
        primary: '#FF4757',
        accent: '#FFD32A',
        'blue-pen': '#3742FA',
      },
      fontFamily: {
        heading: ['"Nanum Myeongjo"', 'serif'],
        body: ['"Gowun Dodum"', 'sans-serif'],
        doodle: ['"Nanum Pen Script"', 'cursive'],
        ui: ['"Jua"', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.btn-primary': {
          '@apply border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out': '',
          '&:hover': { '@apply -translate-y-1': '' },
          '&:disabled': { '@apply opacity-60 cursor-not-allowed': '' },
        },
        '.btn-secondary': {
          '@apply border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-paper text-ink shadow-hard transition duration-150 ease-out': '',
          '&:hover': { '@apply -translate-y-1': '' },
          '&:disabled': { '@apply opacity-60 cursor-not-allowed': '' },
        },
        '.btn-danger': {
          '@apply border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-paper text-primary border-primary shadow-hard transition duration-150 ease-out': '',
          '&:hover': { '@apply -translate-y-1': '' },
        },
      })
    },
  ],
} satisfies Config
