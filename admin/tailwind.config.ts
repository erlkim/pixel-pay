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
          bg: "#0b0b1a",
          surface: "#12122b",
          card: "#1a1a3e",
          border: "#2a2a5a",
          primary: "#00ff88",
          secondary: "#ff2e63",
          accent: "#08d9d6",
          yellow: "#ffcc00",
          purple: "#a855f7",
          white: "#eaeaff",
          muted: "#5a5a8a",
        },
      },
      animation: {
        blink: "blink 1.2s step-end infinite",
        slideUp: "slideUp 0.5s ease forwards",
      },
      keyframes: {
        blink: { "50%": { opacity: "0.3" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
