/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8B3A3A',
        'primary-dark': '#6B2A2A',
        'primary-light': '#A84A4A',
        secondary: '#C4956A',
        background: '#FDFBF8',
        surface: '#FFFFFF',
        border: '#EDE5DC',
        'text-primary': '#1C1917',
        'text-secondary': '#78716C',
        'text-muted': '#A8A29E',
        'accent-warm': '#F5EDE6',
        brand: '#8B3A3A',
      },
      boxShadow: {
        soft: '0 24px 60px rgba(139, 58, 58, 0.10)',
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 32px rgba(139, 58, 58, 0.12)',
        'glow': '0 0 0 3px rgba(139, 58, 58, 0.12)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #8B3A3A 0%, #A04A4A 50%, #C4956A 100%)',
        'warm-bg':
          'radial-gradient(ellipse at 20% 0%, rgba(139, 58, 58, 0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(196, 149, 106, 0.09) 0%, transparent 50%), #FDFBF8',
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Noto Serif SC"', 'serif'],
        sans: ['Inter', '"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
    },
  },
  plugins: [],
}
