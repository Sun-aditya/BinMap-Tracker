import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        binmap: {
          bg: "#070707",
          surface: "#171717",
          primary: "#5F6368",
          success: "#7DD3A8",
          warning: "#D6A760",
          danger: "#E07A7A",
          text: "#F4F1EA",
          muted: "#A8A29E",
        },
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI Variable", "Segoe UI", "Inter", "system-ui", "sans-serif"],
        display: ["Georgia", "Cormorant Garamond", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 24px 70px rgba(0, 0, 0, 0.42)",
      },
    },
  },
  plugins: [],
};

export default config;
