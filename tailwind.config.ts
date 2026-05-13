import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "#0f0f11",
        sidebar: "#0d0d0e",
        border: "#1a1a1c",
        red: {
          DEFAULT: "#c5050c",
          dim: "#c5050c33",
          bg: "#140406",
        },
        muted: "#555555",
        label: "#444444",
        text: {
          DEFAULT: "#e8e8ea",
          muted: "#888888",
          dim: "#555555",
        },
      },
      fontFamily: {
        display: ["var(--font-rajdhani)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        sans: ["var(--font-ibm-plex-sans)", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
    },
  },
  plugins: [],
};
export default config;
