import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        sans: ['IBM Plex Sans', 'sans-serif'],
        heading: ['IBM Plex Sans Condensed', 'IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        logo: ['Bungee', 'cursive'],
      },
      fontWeight: {
        normal: '500',
      },
      letterSpacing: {
        'tight': '-0.04em',
        'pressed': '-0.04em',
        'wide': '0.05em',
        'nixie': '0.3em',
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Retro theme colors
        nixie: {
          bg: "hsl(var(--nixie-bg))",
          glow: "hsl(var(--nixie-glow))",
          "glow-alt": "hsl(var(--nixie-glow-alt))",
        },
        "index-card": {
          bg: "hsl(var(--index-card-bg))",
          lines: "hsl(var(--index-card-lines))",
          margin: "hsl(var(--index-card-margin))",
        },
        chiclet: {
          light: "hsl(var(--chiclet-light))",
          dark: "hsl(var(--chiclet-dark))",
          shadow: "hsl(var(--chiclet-shadow))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'retro': '4px 4px 0 hsl(var(--muted))',
        'retro-lg': '6px 6px 0 hsl(var(--muted))',
        'chiclet': '0 4px 0 hsl(var(--chiclet-shadow))',
        'chiclet-pressed': '0 2px 0 hsl(var(--chiclet-shadow))',
        'nixie-inset': 'inset 0 0 15px hsl(0 0% 0% / 0.8)',
        'nixie-glow': '0 0 10px hsl(var(--nixie-glow)), 0 0 20px hsl(var(--nixie-glow) / 0.5)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "nixie-flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.95" },
          "75%": { opacity: "0.98" },
        },
        "typewriter": {
          "from": { width: "0" },
          "to": { width: "100%" },
        },
        "steam-rise": {
          "0%": { transform: "translateY(0) scaleY(1)", opacity: "0.4" },
          "50%": { transform: "translateY(-4px) scaleY(1.2)", opacity: "0.2" },
          "100%": { transform: "translateY(-8px) scaleY(0.8)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "nixie-flicker": "nixie-flicker 0.1s ease-in-out infinite",
        "typewriter": "typewriter 2s steps(40) forwards",
        "steam-1": "steam-rise 2s ease-out infinite",
        "steam-2": "steam-rise 2s ease-out 0.3s infinite",
        "steam-3": "steam-rise 2s ease-out 0.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
