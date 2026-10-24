/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace']
      },
      colors: {
        cream: {
          50: '#FAF8F4',
          100: '#F5F3EB', // Main light background
          200: '#EDEFE6', // Secondary surface
          300: '#E1E4D9', // Subtle borders
          400: '#D5D9CB',
        },
        sage: {
          50: '#F4F6F2',
          100: '#E6EBE0',
          200: '#D0DAC5',
          300: '#B8C7A8',
          400: '#A3B18A', // Main sage accent
          500: '#8A9A71',
          600: '#75866A', // Primary muted green
          700: '#626F47', // Olive green
          800: '#475336',
          900: '#29372D', // Deep forest green
          950: '#1B241E',
        },
        surface: {
          light: '#FFFFFF',
          'light-secondary': '#EDEFE6',
          'light-hover': '#E8EBE0',
          'light-selected': '#E1E7D8',
          dark: '#222922',
          'dark-bg': '#171C18',
          'dark-sidebar': '#1B211C',
          'dark-secondary': '#293229',
          'dark-elevated': '#303A30',
          'dark-hover': '#2C352C',
          'dark-selected': '#303C30'
        },
        ink: {
          primary: '#252A24',
          secondary: '#697064',
          muted: '#858A80',
          'dark-primary': '#EEF1E9',
          'dark-secondary': '#B1B9AC',
          'dark-muted': '#929D8D',
        },
        status: {
          success: '#477A57',
          warning: '#A87535',
          error: '#B64D45',
          info: '#597C91'
        }
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(41, 55, 45, 0.04)',
        card: '0 1px 3px 0 rgba(41, 55, 45, 0.06), 0 1px 2px -1px rgba(41, 55, 45, 0.04)',
        dropdown: '0 4px 12px -2px rgba(27, 36, 30, 0.1), 0 2px 6px -2px rgba(27, 36, 30, 0.06)',
        modal: '0 20px 25px -5px rgba(23, 28, 24, 0.2), 0 8px 10px -6px rgba(23, 28, 24, 0.1)'
      }
    },
  },
  plugins: [],
}
