import type { Config } from "tailwindcss"

const config = {
  // Dark mode support planned for future release
  // darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
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
        // Extended Rivo brand palette for enterprise UI
        rivo: {
          50: "#f0f9ff",    // Very light background
          100: "#e0f2fe",   // Light background
          200: "#bae6fd",   // Lighter accent
          300: "#7dd3fc",   // Light accent
          400: "#38bdf8",   // Medium accent
          500: "#1D9DB7",   // Base brand color
          600: "#126EA0",   // Primary hover
          700: "#0f5f87",   // Darker hover
          800: "#0c4a68",   // Dark accent
          900: "#0f3460",   // Very dark text
          light: "#53C1D0", // Legacy gradient start
          base: "#1D9DB7",  // Legacy middle
          dark: "#126EA0",  // Legacy gradient end
          text: "#1F2937",
          subtext: "#6B7280",
          bgLight: "#F9FAFB",
          bgWhite: "#FFFFFF",
        },
        'rivo-base': '#1D9DB7',
        'rivo-light': '#61B3C6',
        'rivo-medium': '#4BA3C7',
        'rivo-dark': '#2F72B8',
        // Enterprise semantic colors
        enterprise: {
          success: {
            50: "#ecfdf5",
            500: "#10b981", 
            600: "#059669",
            900: "#064e3b"
          },
          warning: {
            50: "#fffbeb",
            500: "#f59e0b",
            600: "#d97706", 
            900: "#78350f"
          },
          error: {
            50: "#fef2f2",
            500: "#ef4444",
            600: "#dc2626",
            900: "#7f1d1d"
          },
          info: {
            50: "#eff6ff",
            500: "#3b82f6",
            600: "#2563eb",
            900: "#1e3a8a"
          }
        },
        // Enterprise UI colors
        surface: {
          primary: "#ffffff",
          secondary: "#f8fafc",
          tertiary: "#f1f5f9"
        }
      },
      backgroundImage: {
        'rivo-gradient': 'linear-gradient(to right, #53C1D0, #1D9DB7, #126EA0)',
        'rivo-gradient-animated': 'linear-gradient(135deg, #53C1D0 0%, #1D9DB7 50%, #126EA0 100%)',
        'enterprise-gradient': 'linear-gradient(135deg, #1D9DB7 0%, #126EA0 50%, #0f3460 100%)',
        'success-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'warning-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'info-gradient': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'enterprise': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'enterprise-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'enterprise-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'rivo-glow': '0 0 20px rgba(29, 157, 183, 0.3)',
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0px)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(29, 157, 183, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(29, 157, 183, 0.5)" },
        },
        "counter-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "counter-up": "counter-up 0.5s ease-out",
        "shimmer": "shimmer 2s infinite linear",
      },
      transitionDuration: {
        '400': '400ms',
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

