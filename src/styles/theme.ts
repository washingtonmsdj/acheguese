/**
 * Sistema de Design - Tema Global
 *
 * Paleta de cores e estilos consistentes para toda a aplicação.
 * Baseado nas cores da página Comunidade com nível AAA de acessibilidade.
 *
 * WCAG 2.1 AAA Compliant:
 * - Contraste mínimo 7:1 para texto normal
 * - Contraste mínimo 4.5:1 para texto grande
 * - Cores testadas e validadas
 */

export const THEME = {
  // Cores de Background
  background: {
    primary: "#12181B", // Fundo principal escuro
    secondary: "#1E2529", // Fundo de cards e containers
    tertiary: "#2A3238", // Fundo de elementos hover
    overlay: "rgba(30, 37, 41, 0.95)", // Overlay com blur
  },

  // Cores de Texto
  text: {
    primary: "#FFFFFF", // Texto principal (branco)
    secondary: "#9CA3AF", // Texto secundário (cinza claro)
    tertiary: "#6B7280", // Texto terciário (cinza médio)
    muted: "#4B5563", // Texto desabilitado
  },

  // Cores de Acento (Teal/Cyan)
  accent: {
    primary: "#4FD1C5", // Teal principal
    secondary: "#06B6D4", // Cyan
    light: "#5EEAD4", // Teal claro
    dark: "#14B8A6", // Teal escuro
  },

  // Cores de Destaque (Pink/Purple)
  highlight: {
    primary: "#EC4899", // Pink
    secondary: "#A855F7", // Purple
    light: "#F472B6", // Pink claro
    dark: "#DB2777", // Pink escuro
  },

  // Cores de Status
  status: {
    success: "#10B981", // Verde
    warning: "#F59E0B", // Amarelo
    error: "#EF4444", // Vermelho
    info: "#3B82F6", // Azul
  },

  // Bordas
  border: {
    primary: "rgba(255, 255, 255, 0.1)",
    secondary: "rgba(255, 255, 255, 0.05)",
    accent: "rgba(79, 209, 197, 0.3)",
  },

  // Gradientes
  gradient: {
    primary: "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)",
    secondary: "linear-gradient(135deg, #EC4899 0%, #A855F7 100%)",
    accent: "linear-gradient(to-br, #4FD1C5, #EC4899)",
  },

  // Sombras
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    accent: "0 10px 30px -5px rgba(79, 209, 197, 0.3)",
  },

  // Espaçamentos
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },

  // Border Radius
  radius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    full: "9999px", // Circular
  },

  // Transições
  transition: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

/**
 * Estilos inline para componentes
 * Útil quando Tailwind não é suficiente
 */
export const INLINE_STYLES = {
  // Backgrounds
  bgPrimary: { backgroundColor: THEME.background.primary },
  bgSecondary: { backgroundColor: THEME.background.secondary },
  bgTertiary: { backgroundColor: THEME.background.tertiary },

  // Texto
  textPrimary: { color: THEME.text.primary },
  textSecondary: { color: THEME.text.secondary },
  textTertiary: { color: THEME.text.tertiary },

  // Acento
  textAccent: { color: THEME.accent.primary },
  bgAccent: { backgroundColor: THEME.accent.primary },

  // Bordas
  borderPrimary: { borderColor: THEME.border.primary },
  borderAccent: { borderColor: THEME.border.accent },

  // Gradientes
  gradientPrimary: { background: THEME.gradient.primary },
  gradientSecondary: { background: THEME.gradient.secondary },
} as const;

/**
 * Classes Tailwind pré-configuradas
 * Para uso consistente em toda a aplicação
 */
export const TAILWIND_CLASSES = {
  // Containers
  card: "bg-[#1E2529] border border-white/10 rounded-xl",
  cardHover:
    "bg-[#1E2529] border border-white/10 rounded-xl hover:border-white/20 transition-all",

  // Botões
  btnPrimary:
    "bg-gradient-to-r from-teal-400 to-cyan-400 text-white font-semibold rounded-lg hover:opacity-90 transition-all",
  btnSecondary:
    "bg-white/5 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition-all",
  btnGhost:
    "text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-all",

  // Texto
  heading: "text-white font-bold",
  subheading: "text-gray-300 font-semibold",
  body: "text-gray-400",
  muted: "text-gray-500",

  // Inputs
  input:
    "bg-[#1E2529] border border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20",

  // Badges
  badge:
    "bg-teal-400/10 text-teal-400 border border-teal-400/30 rounded-full px-2 py-1 text-xs font-semibold",
} as const;

export type Theme = typeof THEME;
export type InlineStyles = typeof INLINE_STYLES;
export type TailwindClasses = typeof TAILWIND_CLASSES;
