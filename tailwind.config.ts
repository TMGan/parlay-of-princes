import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7c3aed",
          foreground: "#f5f3ff"
        },
        secondary: {
          DEFAULT: "#d4af37",
          foreground: "#0f172a"
        },
        accent: {
          DEFAULT: "#ef4444",
          foreground: "#0b0b0b"
        },
        background: {
          DEFAULT: "#000000",
          foreground: "#f8fafc"
        },
        foreground: "#f8fafc",
        border: "#1f1f2b",
        muted: "#14141c"
      }
    }
  }
} satisfies Config;

export default config;
