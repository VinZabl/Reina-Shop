/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cafe: {
          accent: '#DC2626', // Red accent
          dark: '#0A0A0A', // Off-black background
          cream: '#1A1A1A',
          beige: '#1F1F1F',
          latte: '#252525',
          espresso: '#DC2626',
          light: '#1A1A1A',
          // Reina Shop theme colors
          primary: '#DC2626', // Red primary
          secondary: '#EF4444', // Slightly lighter red
          darkBg: '#0A0A0A', // Off-black main background
          darkCard: '#1A1A1A', // Dark card background
          glass: 'rgba(220, 38, 38, 0.1)', // Glass effect with red accent
          text: '#FFFFFF', // White text for dark background
          textMuted: '#A0A0A0' // Muted text
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};