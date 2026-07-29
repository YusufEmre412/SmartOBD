/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f172a', // slate-900
          800: '#1e293b', // slate-800
          700: '#334155', // slate-700
        },
        primary: {
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
        },
        accent: {
          500: '#8b5cf6', // violet-500
        }
      }
    },
  },
  plugins: [],
}
