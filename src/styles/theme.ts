/**
 * Global design-system facade.
 *
 * Runtime styles must consume CSS variables from src/index.css and semantic
 * Tailwind classes. Raw color, spacing, radius, shadow, or transition values
 * belong in global tokens, not in components or module-specific files.
 */

export const THEME = {
  brand: {
    petroleum: "hsl(var(--brand-petroleum))",
    solar: "hsl(var(--brand-solar))",
    surface: "hsl(var(--brand-surface))",
    text: "hsl(var(--brand-text))",
    textSecondary: "hsl(var(--brand-text-secondary))",
    textSecondaryStrong: "hsl(var(--brand-text-secondary-strong))",
  },

  background: {
    primary: "hsl(var(--background))",
    secondary: "hsl(var(--card))",
    tertiary: "hsl(var(--secondary))",
    overlay: "hsl(var(--popover) / 0.95)",
  },

  text: {
    primary: "hsl(var(--foreground))",
    secondary: "hsl(var(--muted-foreground))",
    tertiary: "hsl(var(--secondary-foreground))",
    muted: "hsl(var(--muted-foreground) / 0.75)",
  },

  accent: {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--accent))",
    light: "hsl(var(--primary) / 0.85)",
    dark: "hsl(var(--primary) / 0.7)",
  },

  highlight: {
    primary: "hsl(var(--accent))",
    secondary: "hsl(var(--primary))",
    light: "hsl(var(--accent) / 0.85)",
    dark: "hsl(var(--accent) / 0.7)",
  },

  status: {
    success: "hsl(var(--semantic-success))",
    warning: "hsl(var(--semantic-warning))",
    error: "hsl(var(--semantic-error))",
    info: "hsl(var(--semantic-info))",
    focus: "hsl(var(--semantic-focus))",
    selection: "hsl(var(--semantic-selection))",
    disabled: "hsl(var(--semantic-disabled))",
    disabledForeground: "hsl(var(--semantic-disabled-foreground))",
  },

  border: {
    primary: "hsl(var(--border))",
    secondary: "hsl(var(--border) / 0.5)",
    accent: "hsl(var(--primary) / 0.3)",
  },

  gradient: {
    primary:
      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
    secondary:
      "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)",
    accent:
      "linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--accent)))",
  },

  shadow: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
    accent: "var(--shadow-accent)",
  },

  spacing: {
    xs: "var(--space-xs)",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)",
    "2xl": "var(--space-2xl)",
  },

  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "var(--radius-full)",
  },

  transition: {
    fast: "var(--duration-fast) var(--ease-standard)",
    normal: "var(--duration-normal) var(--ease-standard)",
    slow: "var(--duration-slow) var(--ease-standard)",
  },
} as const;

export const INLINE_STYLES = {
  bgPrimary: { backgroundColor: THEME.background.primary },
  bgSecondary: { backgroundColor: THEME.background.secondary },
  bgTertiary: { backgroundColor: THEME.background.tertiary },

  textPrimary: { color: THEME.text.primary },
  textSecondary: { color: THEME.text.secondary },
  textTertiary: { color: THEME.text.tertiary },

  textAccent: { color: THEME.accent.primary },
  bgAccent: { backgroundColor: THEME.accent.primary },

  borderPrimary: { borderColor: THEME.border.primary },
  borderAccent: { borderColor: THEME.border.accent },

  gradientPrimary: { background: THEME.gradient.primary },
  gradientSecondary: { background: THEME.gradient.secondary },
} as const;

export const TAILWIND_CLASSES = {
  card: "bg-card text-card-foreground border border-border rounded-lg",
  cardHover:
    "bg-card text-card-foreground border border-border rounded-lg transition-colors hover:border-primary/40",

  btnPrimary:
    "bg-primary text-primary-foreground font-semibold rounded-md transition-colors hover:bg-primary/90",
  btnSecondary:
    "bg-secondary text-secondary-foreground font-semibold rounded-md transition-colors hover:bg-secondary/80",
  btnGhost:
    "text-muted-foreground rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",

  heading: "text-foreground font-bold",
  subheading: "text-secondary-foreground font-semibold",
  body: "text-muted-foreground",
  muted: "text-muted-foreground",

  input:
    "bg-background border border-input text-foreground placeholder:text-muted-foreground rounded-md focus:border-ring focus:ring-2 focus:ring-ring/20",

  badge:
    "bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-1 text-xs font-semibold",
} as const;

export type Theme = typeof THEME;
export type InlineStyles = typeof INLINE_STYLES;
export type TailwindClasses = typeof TAILWIND_CLASSES;
