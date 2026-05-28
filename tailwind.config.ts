import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#f7f5ef",
        clay: "#c56f45",
        basil: "#27745f",
        saffron: "#d7a33d",
        wine: "#8a3345",
      },
      boxShadow: {
        line: "0 1px 0 rgba(21, 21, 21, 0.08)",
        lift: "0 18px 60px rgba(21, 21, 21, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
