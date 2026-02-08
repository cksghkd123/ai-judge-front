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
        heading: ['"Gamja Flower"', 'sans-serif'],
        body: ['"Gowun Dodum"', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
} satisfies Config
