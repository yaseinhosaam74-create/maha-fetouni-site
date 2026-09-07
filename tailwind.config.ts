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
        "camel-coat": "#C6B39A",
        boho: "#7B694E",
        rubine: "#8D3A3C",
        tamarind: "#3B1319",
        "italian-roast": "#280B0F",
      },
      fontFamily: {
        arabic: ["var(--font-cairo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
