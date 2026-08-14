import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
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
        territory: {
          canvas: "hsl(var(--territory-canvas))",
          surface: "hsl(var(--territory-surface))",
          raised: "hsl(var(--territory-surface-raised))",
          ink: "hsl(var(--territory-ink))",
          muted: "hsl(var(--territory-muted))",
          brand: "hsl(var(--territory-brand))",
          "brand-strong": "hsl(var(--territory-brand-strong))",
          warm: "hsl(var(--territory-warm))",
          sun: "hsl(var(--territory-sun))",
          border: "hsl(var(--territory-border))",
          focus: "hsl(var(--territory-focus))",
          "on-image": "hsl(var(--territory-on-image))",
          "image-overlay": "hsl(var(--territory-image-overlay))",
        },
        category: {
          alert: {
            DEFAULT: "hsl(var(--category-alert))",
            foreground: "hsl(var(--category-alert-foreground))",
          },
          event: {
            DEFAULT: "hsl(var(--category-event))",
            foreground: "hsl(var(--category-event-foreground))",
          },
          gastronomy: {
            DEFAULT: "hsl(var(--category-gastronomy))",
            foreground: "hsl(var(--category-gastronomy-foreground))",
          },
          mobility: {
            DEFAULT: "hsl(var(--category-mobility))",
            foreground: "hsl(var(--category-mobility-foreground))",
          },
          discussion: {
            DEFAULT: "hsl(var(--category-discussion))",
            foreground: "hsl(var(--category-discussion-foreground))",
          },
          business: {
            DEFAULT: "hsl(var(--category-business))",
            foreground: "hsl(var(--category-business-foreground))",
          },
          civic: {
            DEFAULT: "hsl(var(--category-civic))",
            foreground: "hsl(var(--category-civic-foreground))",
          },
          help: {
            DEFAULT: "hsl(var(--category-help))",
            foreground: "hsl(var(--category-help-foreground))",
          },
          classified: {
            DEFAULT: "hsl(var(--category-classified))",
            foreground: "hsl(var(--category-classified-foreground))",
          },
          recommendation: {
            DEFAULT: "hsl(var(--category-recommendation))",
            foreground: "hsl(var(--category-recommendation-foreground))",
          },
          question: {
            DEFAULT: "hsl(var(--category-question))",
            foreground: "hsl(var(--category-question-foreground))",
          },
          poll: {
            DEFAULT: "hsl(var(--category-poll))",
            foreground: "hsl(var(--category-poll-foreground))",
          },
          found: {
            DEFAULT: "hsl(var(--category-found))",
            foreground: "hsl(var(--category-found-foreground))",
          },
          giveaway: {
            DEFAULT: "hsl(var(--category-giveaway))",
            foreground: "hsl(var(--category-giveaway-foreground))",
          },
          neutral: {
            DEFAULT: "hsl(var(--category-neutral))",
            foreground: "hsl(var(--category-neutral-foreground))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        territory: "1rem",
        "territory-highlight": "1.25rem",
      },
      boxShadow: {
        "territory-highlight":
          "0 24px 70px -48px hsl(var(--shadow-color) / 0.55)",
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
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} as Config;
