import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";

export const STATIC_ROUTE_PATHS = {
  home: "/",
  about: "/sobre",
  howItWorks: "/como-funciona",
  notifications: "/notificacoes",
  onboarding: "/onboarding",
  pricing: "/planos",
  searchAlias: `/${TERRITORIAL_ROUTE_STATIC_SEGMENTS.searchAlias}`,
} as const;
