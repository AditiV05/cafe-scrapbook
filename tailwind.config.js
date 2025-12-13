/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui"],
        display: ["Playfair Display", "serif"],
      },
      colors: {
        cream: "#FBF7F2",
        linen: "#F6EFE8",
        blush: "#F3E6E0",
        sage: "#E8F1EF",
        mocha: "#C6A58A",
        cocoa: "#8B6A52",
        deep: "#20322F",
      },
      boxShadow: {
        soft: "0 6px 18px rgba(0, 0, 0, 0.06)",
        lift: "0 10px 28px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};
