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
        // Surfaces — warmer and with real chroma, so white cards lift off the page
        cream: "#F6E9D8",
        linen: "#F0E2D0",
        blush: "#F6DCD2",
        sage: "#DCEBE2",
        surface: "#FFFDFA",
        // Ink
        deep: "#1B2A26",
        muted: "#566962",
        subtle: "#5C6A63",
        // Warm neutrals
        mocha: "#C6A58A",
        cocoa: "#755741",
        // Accents
        honey: "#F0AD33",
        "honey-deep": "#D9901A",
        terracotta: "#D2694A",
        // Lines
        edge: "#E2CDB4",
        "edge-strong": "#D2B795",
      },
      boxShadow: {
        // Warm-tinted rather than black — black haze is what reads as "pale"
        soft: "0 4px 14px rgba(94, 62, 30, 0.09)",
        lift: "0 14px 32px rgba(94, 62, 30, 0.17)",
        glow: "0 8px 24px rgba(217, 144, 26, 0.28)",
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};
