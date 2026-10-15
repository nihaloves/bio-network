/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep midnight navy background
        'spore-bg': '#0B1220',
        'spore-surface': '#111C2E',
        'spore-surface-light': '#1A2740',
        'spore-border': '#1E2D45',
        // Accents
        'spore-teal': '#35C6B0',
        'spore-teal-dim': '#2A9E8C',
        'spore-cyan': '#78DCE8',
        'spore-mint': '#9BEDD5',
        // Text
        'spore-text': '#F3F7FA',
        'spore-muted': '#A8B6C8',
        'spore-dim': '#6B7A92',
        // Light research surface
        'spore-light': '#F4F8FA',
        'spore-light-text': '#172334',
        'spore-light-muted': '#5A6B82',
        // Status
        'spore-success': '#3DD68C',
        'spore-warning': '#F5B955',
        'spore-error': '#EF6B6B',
        'spore-failed': '#8B4H5C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
