import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        anthracite: "#39424e",
        anthracite2: "#4c5766",
        rouge: "#d0212f",
        rougeL: "#fdecee",
      },
    },
  },
  plugins: [],
};
export default config;
