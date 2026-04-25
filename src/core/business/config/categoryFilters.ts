/**
 * Category Filter Configuration — Niche-Specific Filters
 *
 * Each business category has unique filtering needs.
 * This config defines which filters, sort options, and display
 * features are relevant per niche.
 *
 * SSOT for category-specific UX configuration.
 */

import {
  Clock, Truck, CreditCard, Star, Utensils, Stethoscope, GraduationCap,
  Wrench, ShoppingBag, Heart, Dumbbell, Store, Wifi, Baby, Dog,
  Accessibility, Globe, CalendarCheck, DollarSign, MapPin, Flame,
  BadgeCheck, Phone, Layers,
} from "lucide-react";
import type { BusinessCategory } from "@/core/business/types/Business";

// ── Filter Option ────────────────────────────────────────────────────
export interface FilterOption {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Filter logic key — mapped in the page component */
  filterKey: string;
}

// ── Sort Option ──────────────────────────────────────────────────────
export interface SortOption {
  id: string;
  label: string;
}

// ── Category Config ──────────────────────────────────────────────────
export interface CategoryConfig {
  slug: string;
  label: string;
  labelPlural: string;
  description: string;
  icon: React.ElementType;
  color: string;         // Tailwind text class token
  bg: string;            // Tailwind bg class token
  accentGradient: string; // gradient for hero
  filters: FilterOption[];
  sortOptions: SortOption[];
  /** Show "open now" / "closed" status prominently */
  showOpenStatus: boolean;
  /** Show delivery badge */
  showDeliveryBadge: boolean;
  /** Emoji for empty state */
  emptyEmoji: string;
}

// ── Common filters (shared across niches) ────────────────────────────
const COMMON_FILTERS: FilterOption[] = [
  { id: "open_now", label: "Aberto agora", icon: Clock, filterKey: "openNow" },
  { id: "verified", label: "Verificados", icon: BadgeCheck, filterKey: "verified" },
  { id: "premium", label: "Premium", icon: Flame, filterKey: "premium" },
  { id: "nearby", label: "Perto de mim", icon: MapPin, filterKey: "nearby" },
];

const COMMON_SORTS: SortOption[] = [
  { id: "rating", label: "Melhor avaliação" },
  { id: "distance", label: "Mais perto" },
  { id: "recent", label: "Mais recentes" },
  { id: "name_az", label: "A-Z" },
];

// ── Per-niche configs ────────────────────────────────────────────────

const RESTAURANTE_CONFIG: CategoryConfig = {
  slug: "restaurante",
  label: "Restaurante",
  labelPlural: "Restaurantes",
  description: "Descubra os melhores restaurantes da sua região. Comida de verdade, recomendada por vizinhos.",
  icon: Utensils,
  color: "text-orange-400",
  bg: "bg-orange-400/10",
  accentGradient: "from-orange-500/20 via-card to-amber-500/10",
  showOpenStatus: true,
  showDeliveryBadge: true,
  emptyEmoji: "🍽️",
  filters: [
    ...COMMON_FILTERS,
    { id: "delivery", label: "Delivery", icon: Truck, filterKey: "delivery" },
    { id: "accepts_card", label: "Aceita cartão", icon: CreditCard, filterKey: "acceptsCard" },
    { id: "accepts_pix", label: "Aceita PIX", icon: DollarSign, filterKey: "acceptsPix" },
    { id: "wifi", label: "Wi-Fi", icon: Wifi, filterKey: "wifi" },
  ],
  sortOptions: [
    ...COMMON_SORTS,
    { id: "reviews", label: "Mais avaliados" },
  ],
};

const MERCADO_CONFIG: CategoryConfig = {
  slug: "mercado",
  label: "Mercado",
  labelPlural: "Mercados",
  description: "Mercados, mercearias e minimercados da sua região. Produtos frescos do dia a dia.",
  icon: ShoppingBag,
  color: "text-emerald-400",
  bg: "bg-emerald-400/10",
  accentGradient: "from-emerald-500/20 via-card to-green-500/10",
  showOpenStatus: true,
  showDeliveryBadge: true,
  emptyEmoji: "🛒",
  filters: [
    ...COMMON_FILTERS,
    { id: "delivery", label: "Delivery", icon: Truck, filterKey: "delivery" },
    { id: "accepts_card", label: "Aceita cartão", icon: CreditCard, filterKey: "acceptsCard" },
  ],
  sortOptions: COMMON_SORTS,
};

const FARMACIA_CONFIG: CategoryConfig = {
  slug: "farmacia",
  label: "Farmácia",
  labelPlural: "Farmácias",
  description: "Farmácias e drogarias da sua região. Medicamentos, cosméticos e atendimento especializado.",
  icon: Heart,
  color: "text-rose-400",
  bg: "bg-rose-400/10",
  accentGradient: "from-rose-500/20 via-card to-pink-500/10",
  showOpenStatus: true,
  showDeliveryBadge: true,
  emptyEmoji: "💊",
  filters: [
    ...COMMON_FILTERS,
    { id: "delivery", label: "Delivery", icon: Truck, filterKey: "delivery" },
    { id: "24h", label: "24 horas", icon: Clock, filterKey: "is24h" },
  ],
  sortOptions: COMMON_SORTS,
};

const SAUDE_CONFIG: CategoryConfig = {
  slug: "saude",
  label: "Saúde",
  labelPlural: "Saúde",
  description: "Clínicas, consultórios e profissionais de saúde. Cuide-se com quem está perto.",
  icon: Stethoscope,
  color: "text-sky-400",
  bg: "bg-sky-400/10",
  accentGradient: "from-sky-500/20 via-card to-cyan-500/10",
  showOpenStatus: true,
  showDeliveryBadge: false,
  emptyEmoji: "🏥",
  filters: [
    ...COMMON_FILTERS,
    { id: "accessibility", label: "Acessibilidade", icon: Accessibility, filterKey: "accessibility" },
    { id: "online", label: "Atendimento online", icon: Globe, filterKey: "online" },
  ],
  sortOptions: [
    ...COMMON_SORTS,
    { id: "specialty", label: "Por especialidade" },
  ],
};

const EDUCACAO_CONFIG: CategoryConfig = {
  slug: "educacao",
  label: "Educação",
  labelPlural: "Educação",
  description: "Escolas, cursos, reforço escolar e centros de ensino da sua região.",
  icon: GraduationCap,
  color: "text-violet-400",
  bg: "bg-violet-400/10",
  accentGradient: "from-violet-500/20 via-card to-purple-500/10",
  showOpenStatus: false,
  showDeliveryBadge: false,
  emptyEmoji: "📚",
  filters: [
    ...COMMON_FILTERS,
    { id: "online", label: "Online / EAD", icon: Globe, filterKey: "online" },
    { id: "kids", label: "Infantil", icon: Baby, filterKey: "kids" },
  ],
  sortOptions: COMMON_SORTS,
};

const SERVICOS_CONFIG: CategoryConfig = {
  slug: "servicos",
  label: "Serviços",
  labelPlural: "Serviços",
  description: "Oficinas, assistências técnicas, encanadores, eletricistas e muito mais.",
  icon: Wrench,
  color: "text-amber-400",
  bg: "bg-amber-400/10",
  accentGradient: "from-amber-500/20 via-card to-yellow-500/10",
  showOpenStatus: true,
  showDeliveryBadge: false,
  emptyEmoji: "🔧",
  filters: [
    ...COMMON_FILTERS,
    { id: "delivery", label: "Atende a domicílio", icon: Truck, filterKey: "delivery" },
    { id: "accepts_card", label: "Aceita cartão", icon: CreditCard, filterKey: "acceptsCard" },
  ],
  sortOptions: COMMON_SORTS,
};

const LAZER_CONFIG: CategoryConfig = {
  slug: "lazer",
  label: "Lazer",
  labelPlural: "Lazer",
  description: "Academias, parques, esportes e entretenimento. Divirta-se perto de casa.",
  icon: Dumbbell,
  color: "text-teal-400",
  bg: "bg-teal-400/10",
  accentGradient: "from-teal-500/20 via-card to-emerald-500/10",
  showOpenStatus: true,
  showDeliveryBadge: false,
  emptyEmoji: "🎯",
  filters: [
    ...COMMON_FILTERS,
    { id: "pets", label: "Pet friendly", icon: Dog, filterKey: "pets" },
    { id: "accessibility", label: "Acessibilidade", icon: Accessibility, filterKey: "accessibility" },
  ],
  sortOptions: COMMON_SORTS,
};

const OUTROS_CONFIG: CategoryConfig = {
  slug: "outros",
  label: "Outros",
  labelPlural: "Outros",
  description: "Outros estabelecimentos e negócios da sua região.",
  icon: Store,
  color: "text-muted-foreground",
  bg: "bg-muted/50",
  accentGradient: "from-secondary via-card to-muted",
  showOpenStatus: true,
  showDeliveryBadge: false,
  emptyEmoji: "🏪",
  filters: COMMON_FILTERS,
  sortOptions: COMMON_SORTS,
};

// ── Registry ─────────────────────────────────────────────────────────

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  restaurante: RESTAURANTE_CONFIG,
  mercado: MERCADO_CONFIG,
  farmacia: FARMACIA_CONFIG,
  saude: SAUDE_CONFIG,
  educacao: EDUCACAO_CONFIG,
  servicos: SERVICOS_CONFIG,
  lazer: LAZER_CONFIG,
  outros: OUTROS_CONFIG,
};

function resolveCategorySlug(slug: string): string {
  switch (slug) {
    case "restaurantes":
      return "restaurante";
    case "mercados":
      return "mercado";
    case "farmacias":
      return "farmacia";
    case "saude":
      return "saude";
    case "educacao":
      return "educacao";
    case "servicos":
      return "servicos";
    case "lazer":
      return "lazer";
    case "lojas":
      return "outros";
    case "delivery":
      return "restaurante";
    case "outros":
      return "outros";
    default:
      return slug;
  }
}

function getConfigBySlug(slug: string): CategoryConfig | null {
  switch (slug) {
    case "restaurante":
      return CATEGORY_CONFIGS.restaurante;
    case "mercado":
      return CATEGORY_CONFIGS.mercado;
    case "farmacia":
      return CATEGORY_CONFIGS.farmacia;
    case "saude":
      return CATEGORY_CONFIGS.saude;
    case "educacao":
      return CATEGORY_CONFIGS.educacao;
    case "servicos":
      return CATEGORY_CONFIGS.servicos;
    case "lazer":
      return CATEGORY_CONFIGS.lazer;
    case "outros":
      return CATEGORY_CONFIGS.outros;
    default:
      return null;
  }
}

/** Resolve a category slug coming from the URL to a config */
export function getCategoryConfig(slug: string): CategoryConfig | null {
  const resolved = resolveCategorySlug(slug);
  return getConfigBySlug(resolved);
}

/** All categories for navigation */
export function getAllCategories(): CategoryConfig[] {
  return Object.values(CATEGORY_CONFIGS);
}
