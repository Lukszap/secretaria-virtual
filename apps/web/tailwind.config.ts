import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta warm luxury - Terracota e Sage
        terracotta: {
          50: "#fdf6f4",
          100: "#f9ebe6",
          200: "#f2d5cc",
          300: "#e8b5a6",
          400: "#db8f7a",
          500: "#c96f55",
          600: "#b55841",
          700: "#964335",
          800: "#7d3a30",
          900: "#66332b",
          950: "#361815",
        },
        sage: {
          50: "#f6f7f5",
          100: "#e8ebe4",
          200: "#d2d9c9",
          300: "#b3c0a5",
          400: "#94a381",
          500: "#788764",
          600: "#5e6b4e",
          700: "#4a543e",
          800: "#3d4534",
          900: "#34392d",
          950: "#1a1f16",
        },
        cream: {
          50: "#fdfcfb",
          100: "#faf7f2",
          200: "#f5efe6",
          300: "#ede4d5",
          400: "#e2d4bf",
          500: "#d4c0a5",
          600: "#bfa082",
          700: "#a08060",
          800: "#85684e",
          900: "#6d5540",
          950: "#3a2e21",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Crimson Pro", "Georgia", "serif"],
        sans: ["Source Sans 3", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        "gradient-mesh": "linear-gradient(135deg, #fdf6f4 0%, #f5efe6 50%, #e8ebe4 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "confetti": "confetti 1s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(720deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
