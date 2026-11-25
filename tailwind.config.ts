import type { Config } from "tailwindcss";

// Shape rule for the whole page: every surface and control is sharp (radius 0).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0b0c0d",
        coal: "#121416",
        slate: "#1b1e21",
        line: "#2b2f33",
        bone: "#ece7df",
        mute: "#a39e96",
        molten: "#ff6b2c",
        "molten-deep": "#c9461a",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { none: "0", DEFAULT: "0" },
      transitionTimingFunction: { out: "cubic-bezier(0.16, 1, 0.3, 1)" },
    },
  },
  plugins: [],
};
export default config;
