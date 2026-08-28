import {
  CheckCircle2,
  Clock3,
  Grid2x2,
  ShieldCheck,
  Star,
  Truck,
  MessageCircle,
} from "lucide-react";
import { isLaunchBusinessCategoryEnabled } from "@/app/config/launchScope";
import { getAllCategories } from "@/core/business/config/categoryFilters";
import type { Category, QuickFilter } from "../sections/types";

export const CATEGORIES: readonly Category[] = getAllCategories()
  .filter((category) => isLaunchBusinessCategoryEnabled(category.slug))
  .map((category) => ({
    icon: category.icon,
    label: category.labelPlural,
    iconColor: category.color,
    bg: `${category.bg} border-border`,
    slug: category.slug,
  }));

export const QUICK_FILTERS: readonly QuickFilter[] = [
  { id: "open_now", label: "Aberto agora", icon: Clock3 },
  { id: "verified", label: "Verificadas", icon: ShieldCheck },
  { id: "recommended", label: "Recomendadas", icon: Star },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "delivery", label: "Entrega no bairro", icon: Truck },
] as const;

export const HERO_TRUST_ITEMS = [
  "Empresas verificadas pela equipe Achegue-se.",
  "Recomendacoes reais de moradores do bairro.",
  "Avaliacoes publicas e transparentes.",
  "Negocios que apoiam a comunidade.",
] as const;

export const HERO_BADGES = [
  { id: "territory", label: "Territorio ativo", icon: Grid2x2 },
  { id: "public", label: "Leitura publica", icon: CheckCircle2 },
  { id: "community", label: "Moradores recomendam", icon: Star },
] as const;