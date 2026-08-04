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
        primary: {
          DEFAULT: "#0F172A",
          inverse: "#FFFFFF",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#DBEAFE",
        },
        accent: {
          violet: "#8B5CF6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#F8FAFC",
          pressed: "#F1F5F9",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          disabled: "#94A3B8",
        },
        chart: {
          blue: "#3B82F6",
          green: "#10B981",
          orange: "#F59E0B",
          red: "#EF4444",
          purple: "#8B5CF6",
        },
        ink: "#0F172A",
        paper: "#F8FAFC",
        clay: "#3B82F6",
        basil: "#10B981",
        saffron: "#F59E0B",
        wine: "#EF4444",
      },
      boxShadow: {
        line: "0 1px 2px rgba(15, 23, 42, 0.05)",
        lift: "0 10px 15px -3px rgba(15, 23, 42, 0.10)",
        focus: "0 0 0 2px rgba(59, 130, 246, 0.25)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
