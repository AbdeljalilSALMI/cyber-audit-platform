/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#D8DCE3",
          strong: "#B9C0CC",
        },
        ink: {
          primary: "#101828",
          secondary: "#4B5565",
          muted: "#8A94A6",
        },
        brand: {
          900: "#0E2238",
          700: "#1B3A5C",
          600: "#24507D",
        },
        accent: "#2F6FA3",
        danger: {
          DEFAULT: "#B42318",
          bg: "#FEF3F2",
          border: "#FDA29B",
        },
        warning: {
          DEFAULT: "#9A6700",
          bg: "#FFFAEB",
          border: "#FEC84B",
        },
        success: "#12805C",
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};
