import type { Config } from "tailwindcss";

// Zenom Studio design tokens — "gallery at night" (see the redesign
// handoff README). `night` is the base, `ink` is text on dark, `ember` is
// the single accent, `paper` is the light "paper world" ground.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: "#12100E",
          deep: "#0C0B09",
          raised: "#1B1815",
          hover: "#1F1B17",
          bubble: "#26211C",
        },
        ink: {
          DEFAULT: "#EFE9DF",
          2: "#A39B90",
          3: "#8F877C",
          4: "#6F685F", // footer legal
        },
        ember: "#E58A52",
        paper: {
          DEFAULT: "#ECE5D8",
          raised: "#F5F0E7",
          ink: { DEFAULT: "#1A1714", 2: "#4A433B", 3: "#7A7066" },
        },
        rust: "#9A4A1F",
        // Room / world colours, one per collection.
        room: {
          portrait: "#171310",
          geometric: "#1B2340",
          minimalistic: "#4A1618",
          figurative: "#15302A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        pill: "999px",
        card: "24px",
        tile: "16px",
        input: "14px",
      },
      boxShadow: {
        art: "0 30px 70px rgba(0,0,0,.45)",
        hero: "0 40px 90px rgba(0,0,0,.6)",
        nav: "0 12px 40px rgba(0,0,0,.35)",
      },
      spacing: { 18: "4.5rem" },
      maxWidth: { container: "1320px" },
      transitionTimingFunction: {
        "editorial-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        travel: "cubic-bezier(0.65, 0, 0.35, 1)",
        wipe: "cubic-bezier(0.76, 0, 0.24, 1)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.92)" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        pop: "pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
