/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        defense: {
          dark: '#0a0d14',
          card: '#111726',
          border: '#1f293d',
          accent: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          fmc: '#10b981',
          pmc: '#f59e0b',
          nmc: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
