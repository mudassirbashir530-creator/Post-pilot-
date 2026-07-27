/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        primary: {
          500: '#6366f1',
          600: '#4f46e5',
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        card: '#1e293b',
        darkBg: '#0f172a',
        lightText: '#f1f5f9',
        success: '#22c55e',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};
