/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F9FC',
        primary: '#2563EB',
        surface: '#FFFFFF',
      }
    },
  },
  plugins: [],
}
