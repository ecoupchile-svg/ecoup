import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#f0faf0', 100: '#dcf5dc', 200: '#b8eab8',
          300: '#00D3D9', 400: '#4ec44e', 500: '#28a428',
          600: '#8EE612', 700: '#175c17', 800: '#134813',
          900: '#0d300d',
        },
        earth: {
          50: '#faf7f0', 100: '#f0e8d4', 200: '#dfd0a9',
          300: '#c9b07a', 400: '#b69255', 500: '#9a7640',
          600: '#7d5e32', 700: '#5f4526', 800: '#472f19',
          900: '#2d1c0e',
        },
        sage: { 500: '#7fa882', 600: '#5e8a62' },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      }
    }
  },
  plugins: [],
};
export default config;
