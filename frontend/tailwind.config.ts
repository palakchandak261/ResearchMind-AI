import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fb",
          400: "#36aaf5",
          500: "#0c8ee9",
          600: "#0270c7",
          700: "#0359a1",
          800: "#074c85",
          900: "#0b406e",
          950: "#072849",
        },
        slate: {
          850: "#172033",
          925: "#0c1322",
          950: "#070b14",
        },
        teal: {
          450: "#14b8a6",
          550: "#0d9488",
        }
      },
    },
  },
  plugins: [],
};
export default config;
