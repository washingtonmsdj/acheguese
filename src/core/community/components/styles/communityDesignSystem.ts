/**
 * Design System da Página Comunidade
 *
 * Configurações globais e padronizadas para todos os componentes
 * Evita repetição e garante consistência visual
 */

// ============================================
// CORES
// ============================================
export const COLORS = {
  // Backgrounds
  bgPrimary: "#12181B",
  bgCard: "#1E2529",
  bgCardAlt: "#2A3439",
  bgCardTransparent: "rgba(30, 37, 41, 0.6)",
  bgHeader: "rgba(30, 37, 41, 0.8)",

  // Textos
  textPrimary: "#FFFFFF",
  textSecondary: "#A0AEC0",
  textMuted: "#9CA3AF",
  textCyan: "#4FD1C5", // Cor principal para badges e destaques

  // Accent Colors
  accentTeal: "#4FD1C5",
  accentCyan: "#06B6D4",
  accentPink: "#EC4899",
  accentRed: "#EF4444",
  accentRedDark: "#DC2626", // Para badge de emergência

  // Borders
  borderDefault: "#2D3748",
  borderTeal: "rgba(79, 209, 197, 0.3)",
  borderPink: "rgba(236, 72, 153, 0.6)",
} as const;

// ============================================
// ESPAÇAMENTOS
// ============================================
export const SPACING = {
  // Padding dos Cards
  cardPadding: "p-4",
  cardPaddingCompact: "p-3",

  // Espaçamento entre elementos (SINCRONIZADO entre sidebars)
  sectionGap: "space-y-4",
  sectionGapCompact: "space-y-3",
  itemGap: "space-y-2",
  itemGapCompact: "space-y-2.5",

  // Margens (SINCRONIZADO entre sidebars)
  titleMargin: "mb-3",
  titleMarginLarge: "mb-4",

  // Padding do título da seção (SINCRONIZADO)
  titlePadding: "px-2",

  // Altura do título da seção (para alinhamento)
  titleHeight: "h-8",
} as const;

// ============================================
// TIPOGRAFIA
// ============================================
export const TYPOGRAPHY = {
  // Títulos de Seção (fora dos cards)
  sectionTitle: "text-lg font-bold tracking-wide",

  // Títulos de Widget (dentro dos cards)
  widgetTitle: "text-base font-bold uppercase tracking-wide",

  // Textos de conteúdo
  contentText: "text-base leading-relaxed",
  textBase: "text-base font-bold",
  textSmall: "text-sm",
  textXSmall: "text-xs",
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const RADIUS = {
  card: "rounded-[20px]",
  cardInner: "rounded-xl",
  button: "rounded-lg",
  circle: "rounded-full",
} as const;

// ============================================
// SOMBRAS E EFEITOS
// ============================================
export const EFFECTS = {
  shadow: "shadow-md hover:shadow-xl",
  transition: "transition-all duration-200",
  hover: "hover:bg-white/5",
  backdropBlur: "backdrop-blur-sm",
} as const;

// ============================================
// CLASSES COMPOSTAS (PRONTAS PARA USO)
// ============================================
export const CARD_STYLES = {
  // Card padrão
  default: `${RADIUS.card} ${EFFECTS.shadow} ${EFFECTS.transition} border-0`,

  // Card com borda
  bordered: `${RADIUS.card} ${EFFECTS.shadow} ${EFFECTS.transition} border-2`,
} as const;

export const TITLE_STYLES = {
  // Título de seção (fora dos cards)
  section: `${TYPOGRAPHY.sectionTitle}`,

  // Título de widget (dentro dos cards)
  widget: `${TYPOGRAPHY.widgetTitle}`,
} as const;

// ============================================
// INLINE STYLES (para style={{...}})
// ============================================
export const INLINE_STYLES = {
  // Backgrounds
  bgCard: { backgroundColor: COLORS.bgCard },
  bgCardAlt: { backgroundColor: COLORS.bgCardAlt },
  bgCardTransparent: { backgroundColor: COLORS.bgCardTransparent },

  // Textos
  textPrimary: { color: COLORS.textPrimary },
  textSecondary: { color: COLORS.textSecondary },
  textMuted: { color: COLORS.textMuted },
  textCyan: { color: COLORS.textCyan },

  // Borders
  borderTeal: { borderColor: COLORS.borderTeal },
  borderPink: { borderColor: COLORS.borderPink },
  borderSubtle: { borderColor: "rgba(255, 255, 255, 0.1)" },

  // Badges
  badgeEmergency: {
    backgroundColor: COLORS.accentRedDark,
    color: COLORS.textPrimary,
  },
  badgeCyan: {
    backgroundColor: "transparent",
    color: COLORS.textCyan,
  },
  badgeVerified: {
    backgroundColor: "#10B981",
    color: COLORS.textPrimary,
  },

  // Tags
  tagBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: COLORS.textPrimary,
  },

  // Confirmations
  confirmationOrange: { color: "#F97316" },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retorna as classes CSS para um card padrão
 */
export const getCardClasses = (variant: "default" | "bordered" = "default") => {
  return CARD_STYLES[variant];
};

/**
 * Retorna as classes CSS para um título
 */
export const getTitleClasses = (type: "section" | "widget") => {
  return TITLE_STYLES[type];
};

/**
 * Retorna o estilo inline para background de card
 */
export const getCardBackground = (
  variant: "solid" | "alt" | "transparent" | "card" = "solid",
) => {
  switch (variant) {
    case "alt":
      return INLINE_STYLES.bgCardAlt;
    case "transparent":
      return INLINE_STYLES.bgCardTransparent;
    case "card":
      return INLINE_STYLES.bgCard;
    default:
      return INLINE_STYLES.bgCard;
  }
};
