import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04070f",
          900: "#070b1a",
          800: "#0b1226",
          700: "#111a35",
          600: "#1a2547",
          500: "#23315e",
        },
        gold: {
          400: "#f5d27a",
          500: "#e6b94a",
          600: "#c69a2c",
          700: "#a07a1c",
        },
        ink: {
          100: "#e7eaf3",
          200: "#c7cce0",
          300: "#9aa2bd",
          400: "#6b7395",
          500: "#4b5378",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 40px -10px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(230,185,74,0.25), 0 8px 30px -8px rgba(230,185,74,0.25)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
        "gold-sheen":
          "linear-gradient(135deg,#f5d27a 0%,#c69a2c 40%,#7a5c14 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
