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
      fontFamily: {
        // 工程帳冊字體：Plex Sans（拉丁/UI）→ Noto Sans TC（中文）
        sans: [
          "var(--font-plex-sans)",
          "var(--font-noto-tc)",
          "Noto Sans TC",
          "PingFang TC",
          "Microsoft JhengHei",
          "system-ui",
          "sans-serif",
        ],
        // 數據字體：金額/日期/SKU/ID 一律 mono
        mono: [
          "var(--font-plex-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "var(--font-noto-tc)",
          "monospace",
        ],
      },
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
        // 語意狀態色（狀態點/文字）
        ok: "hsl(var(--ok))",
        warn: "hsl(var(--warn))",
        danger: "hsl(var(--danger))",
        info: "hsl(var(--info))",
      },
      borderRadius: {
        // 工程帳冊幾何：全站圓角收斂到 token 系統
        // （xl/2xl 重新對映，避免逐檔改 rounded-xl 造成的軟綿感）
        sm: "calc(var(--radius) - 4px)",   /* 2px */
        md: "calc(var(--radius) - 2px)",   /* 4px */
        DEFAULT: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",               /* 6px */
        xl: "calc(var(--radius) + 2px)",   /* 8px */
        "2xl": "calc(var(--radius) + 4px)", /* 10px */
        "3xl": "calc(var(--radius) + 6px)", /* 12px */
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config

export default config
