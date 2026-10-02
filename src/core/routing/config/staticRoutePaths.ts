import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";

export const STATIC_ROUTE_PATHS = {
  home: "/",
  emailLogs: "/settings/email-logs",
  offlineSettings: "/offline-settings",
  status: "/status",
  about: "/sobre",
  brazilShowcase: "/brasil",
  countryLanding: "/br",
  howItWorks: "/como-funciona",
  notifications: "/notificacoes",
  onboarding: "/onboarding",
  pricing: "/planos",
  searchAlias: `/${TERRITORIAL_ROUTE_STATIC_SEGMENTS.searchAlias}`,
} as const;

export const STATIC_ROUTE_PATTERNS = {
  qrResolver: "/q/:token",
} as const;
