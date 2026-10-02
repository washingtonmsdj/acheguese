/**
 * Canonical static application routes that are not owned by a domain-specific
 * route config.
 *
 * Domain routes stay with their owners (ACCOUNT_PATHS, messagingRoutes,
 * legal constants, territorial builders, business route helpers, etc.).
 */
export const APP_PATHS = {
  search: "/busca",
  aiSearch: "/buscar",
  notifications: "/notificacoes",
  emailLogs: "/settings/email-logs",
} as const;
