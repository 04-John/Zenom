import type { Config } from "tailwindcss";

// Zenom Studio design tokens.
// NOTE: navy/copper hex values below are close approximations pulled from
// the logo — swap for exact brand hex once Samuel confirms final swatches.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0E1A2B", light: "#16263D" },
        copper: { DEFAULT: "#B87A4A", light: "#D2A377", dark: "#8C5A34" },
        ivory: "#F7F3EC",
        offwhite: "#FCFAF6",
        charcoal: "#272522",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      spacing: { 18: "4.5rem" },
      borderRadius: { card: "12px", btn: "8px" },
      maxWidth: { container: "1320px" },
      transitionTimingFunction: {
        "editorial-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
