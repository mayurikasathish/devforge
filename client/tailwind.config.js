/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pink: { DEFAULT: '#f472b6', dark: '#ec4899', light: '#fbcfe8' },
        purple: { DEFAULT: '#a855f7', dark: '#7c3aed', light: '#e9d5ff' },
        aqua: { DEFAULT: '#2dd4bf', dark: '#0d9488', light: '#99f6e4' },
        glass: 'rgba(255,255,255,0.07)'
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 8s ease infinite'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        glow: { from: { boxShadow: '0 0 10px #a855f7' }, to: { boxShadow: '0 0 25px #f472b6, 0 0 40px #a855f7' } },
        gradient: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } }
      }
    }
  },
  plugins: []
};
