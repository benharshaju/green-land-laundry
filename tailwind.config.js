/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'green-land': {
                    50:  '#effdf5',
                    100: '#d9fbe8',
                    200: '#b5f5d3',
                    300: '#7eeab2',
                    400: '#40d689',
                    500: '#1abb6b',
                    600: '#0f9956',
                    700: '#107a47',
                    800: '#12603b',
                    900: '#104f33',
                    950: '#032c1a',
                },
                'gold': {
                    300: '#FCD34D',
                    400: '#FBBF24',
                    500: '#F59E0B',
                    600: '#D97706',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                arabic: ['Cairo', 'sans-serif'],
            },
            boxShadow: {
                'glow-green': '0 0 20px rgba(26, 187, 107, 0.15)',
                'glow-gold':  '0 0 20px rgba(245, 158, 11, 0.15)',
                'glow-blue':  '0 0 20px rgba(59, 130, 246, 0.15)',
                'card':       '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                'card-hover':  '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
                'sidebar':    '4px 0 24px rgba(0,0,0,0.08)',
            },
            animation: {
                'fade-in':       'fadeIn 0.5s ease-out',
                'fade-in-up':    'fadeInUp 0.5s ease-out',
                'fade-in-down':  'fadeInDown 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'slide-in-right':'slideInRight 0.3s ease-out',
                'scale-in':      'scaleIn 0.3s ease-out',
                'pulse-soft':    'pulseSoft 2s ease-in-out infinite',
                'shimmer':       'shimmer 2s linear infinite',
                'float':         'float 3s ease-in-out infinite',
                'count-up':      'countUp 0.6s ease-out',
                'spin-slow':     'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%':   { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%':   { opacity: '0', transform: 'translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    '0%':   { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    '0%':   { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%':   { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%':      { opacity: '0.7' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%':      { transform: 'translateY(-6px)' },
                },
                countUp: {
                    '0%':   { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
