import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "./launchScope";

export const NOTIFICATION_INBOX_PATH = "/notificacoes";
export const NOTIFICATION_FALLBACK_ACTION_LABEL = "Abrir notificações";

interface NotificationActionRouteRule {
  pattern: RegExp;
  surface: LaunchSurfaceKey;
}

export interface NotificationActionTarget {
  href: string;
  label: string;
  isFallback: boolean;
  surface?: LaunchSurfaceKey;
}

const ROUTE_RULES: readonly NotificationActionRouteRule[] = [
  // Nested/private owners must be evaluated before their broader parent.
  {
    pattern: /^\/central\/empresas\/[^/]+\/gastronomia(?:\/|$)/i,
    surface: "gastronomy",
  },
  {
    pattern: /^\/central\/empresas\/[^/]+\/educacao(?:\/|$)/i,
    surface: "education",
  },
  {
    pattern: /^\/central\/empresas\/[^/]+\/cupons(?:\/|$)/i,
    surface: "coupons",
  },
  { pattern: /^\/central\/profissional(?:\/|$)/i, surface: "services" },
  { pattern: /^\/central\/motorista(?:\/|$)/i, surface: "mobility" },
  { pattern: /^\/central\/motoboy(?:\/|$)/i, surface: "mobility" },
  { pattern: /^\/central\/empresas(?:\/|$)/i, surface: "business" },

  { pattern: /^\/empresas(?:\/|$)/i, surface: "business" },
  { pattern: /^\/comunidade(?:\/|$)/i, surface: "community" },
  { pattern: /^\/gastronomia(?:\/|$)/i, surface: "gastronomy" },
  { pattern: /^\/(?:servicos|services)(?:\/|$)/i, surface: "services" },
  {
    pattern: /^\/(?:classificados|classifieds|classificado)(?:\/|$)/i,
    surface: "classifieds",
  },
  {
    pattern: /^\/(?:pontos-turisticos|tourist-points)(?:\/|$)/i,
    surface: "touristPoints",
  },
  { pattern: /^\/(?:educacao|education)(?:\/|$)/i, surface: "education" },
  { pattern: /^\/(?:vagas|jobs)(?:\/|$)/i, surface: "jobs" },
  { pattern: /^\/(?:eventos|events)(?:\/|$)/i, surface: "events" },
  {
    pattern: /^\/(?:comunicacao|communication)(?:\/|$)/i,
    surface: "communication",
  },
  {
    pattern: /^\/(?:mobilidade|mobility|track|historico)(?:\/|$)/i,
    surface: "mobility",
  },
  { pattern: /^\/(?:cupons|coupons)(?:\/|$)/i, surface: "coupons" },
  {
    pattern: /^\/(?:ranking|gamificacao|gamification)(?:\/|$)/i,
    surface: "gamification",
  },
  { pattern: /^\/analytics(?:\/|$)/i, surface: "publicAnalytics" },
  { pattern: /^\/alertas(?:\/|$)/i, surface: "communityAlerts" },
  { pattern: /^\/problemas(?:\/|$)/i, surface: "communityIssues" },
  {
    pattern: /^\/(?:achados-perdidos|achados-e-perdidos)(?:\/|$)/i,
    surface: "communityLostFound",
  },
  {
    pattern: /^\/(?:planos|checkout)(?:\/|$)/i,
    surface: "billing",
  },
  {
    pattern: /^\/settings\/subscription(?:\/|$)/i,
    surface: "billing",
  },

  // Horizontal/active surfaces are lifecycle-scoped too.
  { pattern: /^\/mapa(?:\/|$)/i, surface: "map" },
  { pattern: /^\/perto-de-mim(?:\/|$)/i, surface: "nearby" },
  { pattern: /^\/(?:busca|buscar)(?:\/|$)/i, surface: "search" },
  { pattern: /^\/mensagens(?:\/|$)/i, surface: "messaging" },
  { pattern: /^\/u(?:\/|$)/i, surface: "profiles" },
];

const COMMUNITY_EMBEDDED_SURFACES: Readonly<
  Partial<Record<string, LaunchSurfaceKey>>
> = {
  alertas: "communityAlerts",
  problemas: "communityIssues",
  "achados-perdidos": "communityLostFound",
  "achados-e-perdidos": "communityLostFound",
  comunicacao: "communityCommunication",
  eventos: "events",
  oportunidades: "jobs",
  vagas: "jobs",
};

function getCommunityEmbeddedSurface(
  pathname: string,
): LaunchSurfaceKey | undefined {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLocaleLowerCase("pt-BR"));

  if (segments[0] !== "comunidade") return undefined;

  for (const segment of segments.slice(1)) {
    const surface = COMMUNITY_EMBEDDED_SURFACES[segment];
    if (surface) return surface;
  }

  return undefined;
}

const RETIRED_NOTIFICATION_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/notifications(?:\/|$)/i,
  /^\/settings\/notifications(?:\/|$)/i,
  /^\/perfil(?:\/|$)/i,
  /^\/create-business(?:\/|$)/i,
  /^\/edit-business(?:\/|$)/i,
  /^\/dashboard\/business(?:\/|$)/i,
];

function getInternalPathname(actionUrl: string): string | null {
  if (!actionUrl.startsWith("/")) return null;
  const end = actionUrl.search(/[?#]/);
  return end === -1 ? actionUrl : actionUrl.slice(0, end);
}

export function resolveNotificationActionTarget(
  actionUrl: string | null | undefined,
  actionLabel: string | null | undefined,
): NotificationActionTarget | null {
  if (!actionUrl || !actionLabel) return null;

  const pathname = getInternalPathname(actionUrl);
  if (!pathname) {
    return {
      href: actionUrl,
      label: actionLabel,
      isFallback: false,
    };
  }

  if (
    RETIRED_NOTIFICATION_ROUTE_PATTERNS.some((pattern) =>
      pattern.test(pathname),
    )
  ) {
    return {
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
    };
  }

  const communitySurface = getCommunityEmbeddedSurface(pathname);
  if (communitySurface && !isLaunchSurfaceEnabled(communitySurface)) {
    return {
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
      surface: communitySurface,
    };
  }

  const routeRule = ROUTE_RULES.find((rule) => rule.pattern.test(pathname));
  if (!routeRule || isLaunchSurfaceEnabled(routeRule.surface)) {
    return {
      href: actionUrl,
      label: actionLabel,
      isFallback: false,
      surface: routeRule?.surface,
    };
  }

  return {
    href: NOTIFICATION_INBOX_PATH,
    label: NOTIFICATION_FALLBACK_ACTION_LABEL,
    isFallback: true,
    surface: routeRule.surface,
  };
}
