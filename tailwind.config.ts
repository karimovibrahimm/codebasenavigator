import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0d1117",
          soft: "#161b22",
          softer: "#1c2128",
        },
        line: "#30363d",
        accent: {
          DEFAULT: "#58a6ff",
          soft: "#1f6feb",
        },
        muted: "#8b949e",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
