/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../modules/*/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        accent: {
          damga: '#f97316',
          lokma: '#16a34a',
          santral: '#2563eb',
          ticaret: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
