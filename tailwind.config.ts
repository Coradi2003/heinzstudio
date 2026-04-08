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
        primary: {
          DEFAULT: "#4F46E5", // Azul que você pediu
          dark: "#4338CA",
        },
        secondary: {
          DEFAULT: "#7C3AED", // Roxo que você pediu
          dark: "#6D28D9",
        },
        background: "#F9FAFB",
        card: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
export default config;
