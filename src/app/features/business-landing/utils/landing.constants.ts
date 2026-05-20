/**
 * Constantes de UI da landing de empresas.
 */

import { Utensils, ShoppingBag, Heart, GraduationCap, Wrench, Store, Star, ThumbsUp, Navigation, MapPin, TrendingUp, Users } from "lucide-react";
import type { Category, NeighborActivity, Stat, QuickFilter, Benefit } from "../sections/types";

export const CATEGORIES: readonly Category[] = [
  { icon: Utensils, label: "Restaurantes", count: "124", iconColor: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/20", slug: "restaurantes" },
  { icon: ShoppingBag, label: "Mercados", count: "67", iconColor: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", slug: "mercados" },
  { icon: Heart, label: "Saúde", count: "89", iconColor: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/20", slug: "saude" },
  { icon: GraduationCap, label: "Educação", count: "45", iconColor: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/20", slug: "educacao" },
  { icon: Wrench, label: "Serviços", count: "156", iconColor: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", slug: "servicos" },
  { icon: Store, label: "Lojas", count: "203", iconColor: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/20", slug: "outros" },
] as const;

// ── Empresas com dados comunitários ──────────────────────────────────
export const NEIGHBOR_ACTIVITY: readonly NeighborActivity[] = [] as const;

// ── Stats ────────────────────────────────────────────────────────────
export const STATS: readonly Stat[] = [
  { icon: Store, value: "850+", label: "empresas cadastradas" },
  { icon: Star, value: "4.7", label: "avaliação média" },
  { icon: Users, value: "15k+", label: "clientes ativos" },
  { icon: ThumbsUp, value: "2.3k", label: "recomendações de vizinhos" },
] as const;

// ── Quick Filters ────────────────────────────────────────────────────
export const QUICK_FILTERS: readonly QuickFilter[] = [
  { label: "Perto de mim", icon: Navigation, active: false },
  { label: "Abertos agora", icon: Store, active: false },
  { label: "Com delivery", icon: ShoppingBag, active: false },
  { label: "Recomendados", icon: ThumbsUp, active: false },
  { label: "Verificados", icon: Star, active: false },
] as const;

// ── Benefits ─────────────────────────────────────────────────────────
export const BENEFITS: readonly Benefit[] = [
  {
    icon: MapPin,
    title: "Visibilidade Local",
    description: "Apareça para clientes do seu bairro",
    iconClass: "text-primary",
    bgClass: "bg-primary/10"
  },
  {
    icon: Star,
    title: "Avaliações",
    description: "Receba feedback e construa reputação",
    iconClass: "text-warning",
    bgClass: "bg-warning/10"
  },
  {
    icon: TrendingUp,
    title: "Analytics",
    description: "Acompanhe visitas e engajamento",
    iconClass: "text-accent",
    bgClass: "bg-accent/10"
  },
] as const;
