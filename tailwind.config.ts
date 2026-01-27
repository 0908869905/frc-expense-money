import type { Config } from "tailwindcss"
import tailwindAnimate from "tailwindcss-animate"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "cat-body": {
          "0%": { transform: "translateY(0) rotate(-1deg) translateX(-2px)" },
          "15%": { transform: "translateY(-12px) rotate(1deg) translateX(0px)" },
          "30%": { transform: "translateY(-2px) rotate(-1deg) translateX(2px)" },
          "45%": { transform: "translateY(-14px) rotate(1deg) translateX(0px)" },
          "60%": { transform: "translateY(-2px) rotate(-1deg) translateX(-2px)" },
          "75%": { transform: "translateY(-12px) rotate(1deg) translateX(0px)" },
          "90%": { transform: "translateY(-2px) rotate(-1deg) translateX(2px)" },
          "100%": { transform: "translateY(0) rotate(-1deg) translateX(-2px)" },
        },
        "cat-shadow": {
          "0%, 30%, 60%, 90%, 100%": { transform: "translateX(-50%) scaleX(1) scaleY(1)", opacity: "0.3" },
          "15%, 45%, 75%": { transform: "translateX(-50%) scaleX(0.7) scaleY(0.7)", opacity: "0.15" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "cat-body": "cat-body 0.5s ease-in-out infinite",
        "cat-shadow": "cat-shadow 0.5s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config

export default config