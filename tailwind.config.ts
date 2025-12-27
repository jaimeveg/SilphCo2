import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617', // Deep Space Background
          900: '#0F172A', // Surface
        },
        brand: {
          cyan: '#38BDF8', // Neon Pulse
          highlight: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      dropShadow: {
        neon: '0 0 15px rgba(56, 189, 248, 0.5)', //
      },
    },
  },
  plugins: [],
};
export default config;
