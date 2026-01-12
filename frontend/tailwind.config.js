/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'f1-red': '#E10600',
        'f1-dark': '#15151E',
        'f1-gray': '#38383F',
        'paddock-red': '#EF4444',
        'paddock-coral': '#FF6B6B',
        'paddock-dark': '#0A0A0A',
        'paddock-darkgray': '#1A1A1A',
        'paddock-gray': '#2A2A2A',
        'paddock-lightgray': '#3A3A3A',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out'
      }
    },
  },
  plugins: [],
}
