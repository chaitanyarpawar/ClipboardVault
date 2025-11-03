/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          50: '#F0F0FF',
          100: '#E5E5FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        accent: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        surface: {
          light: 'rgba(255,255,255,0.12)',
          dark: 'rgba(255,255,255,0.08)',
        },
        background: {
          light: '#F9FAFB',
          dark: '#0F172A',
        },
        text: {
          light: '#111827',
          dark: '#F9FAFB',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.25)',
          dark: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        'poppins': ['Poppins'],
        'inter': ['Inter'],
        'manrope': ['Manrope'],
      },
      borderRadius: {
        'glass': '24px',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [],
}