/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        defense: {
          dark: '#06080d',
          panel: '#0c101a',
          card: '#0e1320',
          border: '#1a2333',
          accent: '#10b981',
          danger: '#f43f5e',
          warning: '#f59e0b',
          fmc: '#10b981',
          pmc: '#f59e0b',
          nmc: '#f43f5e'
        }
      },
      boxShadow: {
        'tactical': '0 4px 20px -2px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'tactical-glow': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'danger-glow': '0 0 25px -4px rgba(244, 63, 94, 0.45)',
        'amber-glow': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'blue-glow': '0 0 25px -4px rgba(59, 130, 246, 0.35)',
      }
    },
  },
  plugins: [],
}
