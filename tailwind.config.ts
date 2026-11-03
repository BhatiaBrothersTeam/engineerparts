import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef0f3",
          100: "#dde0e5",
          200: "#c5c8ce",
          300: "#a6a4a4",
          400: "#858585",
          500: "#666666",
          600: "#4a4a4a",
          700: "#333333",
          800: "#1f1f1f",
          900: "#000000",
          950: "#000000",
        },
        brand: {
          50: "#f1f3fb",
          100: "#e3e7f7",
          200: "#c7cfef",
          300: "#9eace2",
          400: "#7185d1",
          500: "#425bb8",
          600: "#213489",
          700: "#1b2b72",
          800: "#18255f",
          900: "#152151",
        },
        // Semantic error/destructive colour (form errors, failed payments, sign out).
        // Deliberately red, not the brand blue, so problems never look like links.
        signal: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        steel: {
          50: "#f8f9fa",
          100: "#eef0f3",
          200: "#dde0e5",
          300: "#c5c8ce",
          400: "#a6a4a4",
          500: "#777777",
          600: "#5d5d5d",
          700: "#444444",
          800: "#262626",
          900: "#000000",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        lift: "0 10px 30px -12px rgba(0,0,0,0.32)",
        header: "0 1px 0 rgba(0,0,0,0.08)",
      },
      borderRadius: {
        card: "6px",
      },
      maxWidth: {
        shell: "1920px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "fade-in": "fade-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
