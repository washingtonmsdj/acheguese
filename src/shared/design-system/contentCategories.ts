/**
 * Content Category Design Tokens (SSOT)
 *
 * Mapa oficial de categorias de conteúdo do Achegue-se para tokens visuais.
 * Cada categoria tem uma cor semântica definida em `src/index.css` como
 * `--category-<name>`. Usar SEMPRE este helper em vez de cores hardcoded.
 *
 * Uso:
 *   const tokens = getCategoryTokens("alerta");
 *   <span className={tokens.badge}>Alerta</span>
 *   <div style={tokens.accentBar} />
 */

export type ContentCategoryKey =
  | "alert"
  | "event"
  | "gastronomy"
  | "mobility"
  | "discussion"
  | "business"
  | "civic"
  | "help"
  | "classified"
  | "recommendation"
  | "question"
  | "poll"
  | "found"
  | "giveaway"
  | "neutral";

export interface CategoryTokens {
  key: ContentCategoryKey;
  label: string;
  /** Tailwind classes para badge sólido (uso primário). */
  badge: string;
  /** Tailwind classes para chip suave (fundo translúcido + texto na cor). */
  chip: string;
  /** Classe para bordas/acentos (ex: barra lateral do card). */
  border: string;
  /** Classe para texto colorido. */
  text: string;
  /** Estilo inline reutilizável (para SVG, ícones, gráficos). */
  cssVar: string;
}

const REGISTRY: Record<ContentCategoryKey, Omit<CategoryTokens, "key">> = {
  alert: {
    label: "Alerta",
    badge: "bg-category-alert text-category-alert-foreground",
    chip: "bg-category-alert/12 text-category-alert border-category-alert/30",
    border: "border-category-alert/40",
    text: "text-category-alert",
    cssVar: "hsl(var(--category-alert))",
  },
  event: {
    label: "Evento",
    badge: "bg-category-event text-category-event-foreground",
    chip: "bg-category-event/12 text-category-event border-category-event/30",
    border: "border-category-event/40",
    text: "text-category-event",
    cssVar: "hsl(var(--category-event))",
  },
  gastronomy: {
    label: "Gastronomia",
    badge: "bg-category-gastronomy text-category-gastronomy-foreground",
    chip: "bg-category-gastronomy/12 text-category-gastronomy border-category-gastronomy/30",
    border: "border-category-gastronomy/40",
    text: "text-category-gastronomy",
    cssVar: "hsl(var(--category-gastronomy))",
  },
  mobility: {
    label: "Mobilidade",
    badge: "bg-category-mobility text-category-mobility-foreground",
    chip: "bg-category-mobility/12 text-category-mobility border-category-mobility/30",
    border: "border-category-mobility/40",
    text: "text-category-mobility",
    cssVar: "hsl(var(--category-mobility))",
  },
  discussion: {
    label: "Discussão",
    badge: "bg-category-discussion text-category-discussion-foreground",
    chip: "bg-category-discussion/12 text-category-discussion border-category-discussion/30",
    border: "border-category-discussion/40",
    text: "text-category-discussion",
    cssVar: "hsl(var(--category-discussion))",
  },
  business: {
    label: "Empresa",
    badge: "bg-category-business text-category-business-foreground",
    chip: "bg-category-business/12 text-category-business border-category-business/30",
    border: "border-category-business/40",
    text: "text-category-business",
    cssVar: "hsl(var(--category-business))",
  },
  civic: {
    label: "Zeladoria",
    badge: "bg-category-civic text-category-civic-foreground",
    chip: "bg-category-civic/12 text-category-civic border-category-civic/30",
    border: "border-category-civic/40",
    text: "text-category-civic",
    cssVar: "hsl(var(--category-civic))",
  },
  help: {
    label: "Favor",
    badge: "bg-category-help text-category-help-foreground",
    chip: "bg-category-help/12 text-category-help border-category-help/30",
    border: "border-category-help/40",
    text: "text-category-help",
    cssVar: "hsl(var(--category-help))",
  },
  classified: {
    label: "Classificado",
    badge: "bg-category-classified text-category-classified-foreground",
    chip: "bg-category-classified/15 text-category-classified border-category-classified/30",
    border: "border-category-classified/40",
    text: "text-category-classified",
    cssVar: "hsl(var(--category-classified))",
  },
  recommendation: {
    label: "Recomendação",
    badge: "bg-category-recommendation text-category-recommendation-foreground",
    chip: "bg-category-recommendation/12 text-category-recommendation border-category-recommendation/30",
    border: "border-category-recommendation/40",
    text: "text-category-recommendation",
    cssVar: "hsl(var(--category-recommendation))",
  },
  question: {
    label: "Pergunta",
    badge: "bg-category-question text-category-question-foreground",
    chip: "bg-category-question/15 text-category-question border-category-question/30",
    border: "border-category-question/40",
    text: "text-category-question",
    cssVar: "hsl(var(--category-question))",
  },
  poll: {
    label: "Enquete",
    badge: "bg-category-poll text-category-poll-foreground",
    chip: "bg-category-poll/12 text-category-poll border-category-poll/30",
    border: "border-category-poll/40",
    text: "text-category-poll",
    cssVar: "hsl(var(--category-poll))",
  },
  found: {
    label: "Achados",
    badge: "bg-category-found text-category-found-foreground",
    chip: "bg-category-found/12 text-category-found border-category-found/30",
    border: "border-category-found/40",
    text: "text-category-found",
    cssVar: "hsl(var(--category-found))",
  },
  giveaway: {
    label: "Desapego",
    badge: "bg-category-giveaway text-category-giveaway-foreground",
    chip: "bg-category-giveaway/12 text-category-giveaway border-category-giveaway/30",
    border: "border-category-giveaway/40",
    text: "text-category-giveaway",
    cssVar: "hsl(var(--category-giveaway))",
  },
  neutral: {
    label: "Post",
    badge: "bg-category-neutral text-category-neutral-foreground",
    chip: "bg-category-neutral/12 text-category-neutral border-category-neutral/30",
    border: "border-category-neutral/40",
    text: "text-category-neutral",
    cssVar: "hsl(var(--category-neutral))",
  },
};

/**
 * Alias que aceita rótulos legados / PT-BR e devolve a chave canônica.
 * Mantém compatibilidade com `PostType`, `AlertType`, etc.
 */
const ALIASES: Record<string, ContentCategoryKey> = {
  // PostType canônico
  post: "neutral",
  discussao: "discussion",
  pergunta: "question",
  recomendacao: "recommendation",
  enquete: "poll",
  alerta: "alert",
  achados: "found",
  favor: "help",
  evento: "event",
  desapego: "giveaway",
  civic_report: "civic",
  classificado: "classified",
  ride_share: "mobility",
  // AlertType
  crime: "alert",
  accident: "alert",
  fire: "alert",
  flood: "alert",
  power_outage: "alert",
  water_outage: "alert",
  road_closure: "mobility",
  // Empresas / verticals
  empresa: "business",
  profissional: "business",
  gastronomia: "gastronomy",
  mobilidade: "mobility",
};

export function resolveCategoryKey(
  input: string | null | undefined,
): ContentCategoryKey {
  if (!input) return "neutral";
  const normalized = input.toLowerCase().trim();
  if (normalized in REGISTRY) return normalized as ContentCategoryKey;
  return ALIASES[normalized] ?? "neutral";
}

export function getCategoryTokens(
  input: ContentCategoryKey | string | null | undefined,
): CategoryTokens {
  const key = resolveCategoryKey(input as string);
  return { key, ...REGISTRY[key] };
}

export const CONTENT_CATEGORY_REGISTRY = REGISTRY;
