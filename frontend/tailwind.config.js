/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean Medical Theme
        'medical': {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Clean blue
          600: '#2563eb',  // Primary medical blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Medical Green for secondary actions
        'medical-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0', 
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#059669',  // Medical green
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Professional Purple for accents
        'medical-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe', 
          400: '#c084fc',
          500: '#a855f7',
          600: '#7c3aed',  // Professional purple
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'medical': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medical-lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'medical-xl': '0 8px 25px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}