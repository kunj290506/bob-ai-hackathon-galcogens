/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Inter', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Lamborghini Dark-Luxury Palette
        lb: {
          black: '#000000',
          iron: '#181818',
          charcoal: '#202020',
          mid: '#494949',
          steel: '#7D7D7D',
          gold: '#FFC000',
          'gold-hover': '#917300',
          'gold-text': '#FFCE3E',
          teal: '#1EAEDB',
          cyan: '#29ABE2',
          'link-blue': '#3860BE',
          white: '#FFFFFF',
          smoke: '#F5F5F5',
          ash: '#7D7D7D',
          // Status
          fmc: '#22C55E',
          pmc: '#F59E0B',
          nmc: '#EF4444',
        }
      },
      borderRadius: {
        'none': '0px',
        DEFAULT: '0px',
        'sm': '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        'full': '9999px',
      },
      boxShadow: {
        'none': 'none',
      },
    },
  },
  plugins: [],
}
