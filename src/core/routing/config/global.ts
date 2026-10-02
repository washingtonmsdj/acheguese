/**
 * Canonical global application paths.
 *
 * Territorial URLs with state/city/territory context must be built through
 * territory routing helpers instead of being added here.
 */
export const APP_GLOBAL_PATHS = {
  home: "/",
  notifications: "/notificacoes",
  emailLogs: "/settings/email-logs",
  businessDirectory: "/empresas",
  businessRegistration: "/empresas/cadastrar",
  map: "/mapa",
  nearby: "/perto-de-mim",
  search: "/busca",
  aiSearch: "/buscar",
  offlineSettings: "/offline-settings",
  about: "/sobre",
  howItWorks: "/como-funciona",
} as const;
