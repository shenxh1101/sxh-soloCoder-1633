/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        accent: {
          50: "#fef3f2",
          100: "#fde7e4",
          200: "#fbd3cc",
          300: "#f7b2a5",
          400: "#f18772",
          500: "#e55c3f",
          600: "#d44022",
          700: "#7C2D12",
          800: "#5C200B",
          900: "#431708",
          950: "#2A0E05",
        },
        brand: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#D97706",
          600: "#b45309",
          700: "#92400e",
          800: "#78350f",
          900: "#451a03",
        },
      },
    },
  },
  plugins: [],
};
