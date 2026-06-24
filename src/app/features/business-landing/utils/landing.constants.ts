/**
 * Constantes de UI da landing de empresas.
 *
 * Dados quantitativos devem ser calculados pela página a partir do SSOT.
 */

import {
  MapPin,
  Navigation,
  Star,
  Store,
  ThumbsUp,
} from "lucide-react";
import { isLaunchBusinessCategoryEnabled } from "@/config/launchScope";
import { getAllCategories } from "@/core/business/config/categoryFilters";
import type { Benefit, Category, NeighborActivity, QuickFilter } from "../sections/types";

export const CATEGORIES: readonly Category[] = getAllCategories()
  .filter((category) => isLaunchBusinessCategoryEnabled(category.slug))
  .map((category) => ({
    icon: category.icon,
    label: category.labelPlural,
    iconColor: category.color,
    bg: `${category.bg} border-border`,
    slug: category.slug,
  }));

export const NEIGHBOR_ACTIVITY: readonly NeighborActivity[] = [] as const;

export const QUICK_FILTERS: readonly QuickFilter[] = [
  { label: "Perto de mim", icon: Navigation, active: false },
  { label: "Abertos agora", icon: Store, active: false },
  { label: "Recomendados", icon: ThumbsUp, active: false },
  { label: "Verificados", icon: Star, active: false },
] as const;

export const BENEFITS: readonly Benefit[] = [
  {
    icon: MapPin,
    title: "Visibilidade Local",
    description: "Apareça para clientes do seu bairro",
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  {
    icon: Star,
    title: "Avaliações",
    description: "Receba feedback e construa reputação",
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
  },
  {
    icon: Store,
    title: "Presenca local",
    description: "Mostre catalogo, contato e localizacao",
    iconClass: "text-accent",
    bgClass: "bg-accent/10",
  },
] as const;
