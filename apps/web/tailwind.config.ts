/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"VT323"', "monospace"],
      },
      colors: {
        px: {
          bg: "#0f0e17",
          surface: "#1a1a2e",
          card: "#222244",
          "card-hover": "#2a2a55",
          border: "#333366",
          primary: "#00ff88",
          secondary: "#ff2e63",
          accent: "#08d9d6",
          yellow: "#ffcc00",
          purple: "#a855f7",
          white: "#fffff0",
          text: "#cdcde0",
          muted: "#5a5a8a",
        },
      },
      animation: {
        float: "float 12s linear infinite",
        blink: "blink 1s step-end infinite",
        fadeUp: "fadeUp 0.6s ease forwards",
        marquee: "marquee 25s linear infinite",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(100vh)", opacity: "0" },
          "10%": { opacity: ".3" },
          "90%": { opacity: ".3" },
          "100%": { transform: "translateY(-10vh)", opacity: "0" },
        },
        blink: { "50%": { opacity: "0" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
