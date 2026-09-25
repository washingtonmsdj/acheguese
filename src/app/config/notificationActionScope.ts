import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { PlatformCapabilityKey } from "./platformCapabilityRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

export const NOTIFICATION_INBOX_PATH = "/notificacoes";
export const NOTIFICATION_FALLBACK_ACTION_LABEL = "Abrir notificações";

type NotificationLifecycleSurfaceKey =
  | ProductModuleKey
  | PlatformCapabilityKey;

type NotificationActionRouteRule =
  | {
      pattern: RegExp;
      kind: "product";
      surface: ProductModuleKey;
    }
  | {
      pattern: RegExp;
      kind: "capability";
      surface: PlatformCapabilityKey;
    };

export interface NotificationActionTarget {
  href: string;
  label: string;
  isFallback: boolean;
  surface?: NotificationLifecycleSurfaceKey;
}

const ROUTE_RULES: readonly NotificationActionRouteRule[] = [
  // Nested/private owners must be evaluated before their broader parent.
  {
    pattern: /^\/central\/empresas\/[^/]+\/gastronomia(?:\/|$)/i,
    kind: "product",
    surface: "gastronomy",
  },
  {
    pattern: /^\/central\/empresas\/[^/]+\/educacao(?:\/|$)/i,
    kind: "product",
    surface: "education",
  },
  {
    pattern: /^\/central\/empresas\/[^/]+\/cupons(?:\/|$)/i,
    kind: "product",
    surface: "coupons",
  },
  {
    pattern: /^\/central\/profissional(?:\/|$)/i,
    kind: "product",
    surface: "services",
  },
  {
    pattern: /^\/central\/motorista(?:\/|$)/i,
    kind: "product",
    surface: "mobility",
  },
  {
    pattern: /^\/central\/motoboy(?:\/|$)/i,
    kind: "product",
    surface: "mobility",
  },
  {
    pattern: /^\/central\/empresas(?:\/|$)/i,
    kind: "product",
    surface: "business",
  },

  {
    pattern: /^\/empresas(?:\/|$)/i,
    kind: "product",
    surface: "business",
  },
  {
    pattern: /^\/comunidade(?:\/|$)/i,
    kind: "product",
    surface: "community",
  },
  {
    pattern: /^\/gastronomia(?:\/|$)/i,
    kind: "product",
    surface: "gastronomy",
  },
  {
    pattern: /^\/(?:servicos|services)(?:\/|$)/i,
    kind: "product",
    surface: "services",
  },
  {
    pattern: /^\/(?:classificados|classifieds|classificado)(?:\/|$)/i,
    kind: "product",
    surface: "classifieds",
  },
  {
    pattern: /^\/(?:pontos-turisticos|tourist-points)(?:\/|$)/i,
    kind: "product",
    surface: "touristPoints",
  },
  {
    pattern: /^\/(?:educacao|education)(?:\/|$)/i,
    kind: "product",
    surface: "education",
  },
  {
    pattern: /^\/(?:vagas|jobs)(?:\/|$)/i,
    kind: "product",
    surface: "jobs",
  },
  {
    pattern: /^\/(?:eventos|events)(?:\/|$)/i,
    kind: "product",
    surface: "events",
  },
  {
    pattern: /^\/(?:comunicacao|communication)(?:\/|$)/i,
    kind: "product",
    surface: "communication",
  },
  {
    pattern: /^\/(?:mobilidade|mobility|track|historico)(?:\/|$)/i,
    kind: "product",
    surface: "mobility",
  },
  {
    pattern: /^\/(?:cupons|coupons)(?:\/|$)/i,
    kind: "product",
    surface: "coupons",
  },
  {
    pattern: /^\/(?:ranking|gamificacao|gamification)(?:\/|$)/i,
    kind: "product",
    surface: "gamification",
  },
  {
    pattern: /^\/analytics(?:\/|$)/i,
    kind: "product",
    surface: "publicAnalytics",
  },
  {
    pattern: /^\/alertas(?:\/|$)/i,
    kind: "product",
    surface: "communityAlerts",
  },
  {
    pattern: /^\/problemas(?:\/|$)/i,
    kind: "product",
    surface: "communityIssues",
  },
  {
    pattern: /^\/(?:achados-perdidos|achados-e-perdidos)(?:\/|$)/i,
    kind: "product",
    surface: "communityLostFound",
  },
  {
    pattern: /^\/(?:planos|checkout)(?:\/|$)/i,
    kind: "product",
    surface: "billing",
  },
  {
    pattern: /^\/settings\/subscription(?:\/|$)/i,
    kind: "product",
    surface: "billing",
  },

  // Horizontal/active surfaces are lifecycle-scoped too.
  {
    pattern: /^\/mapa(?:\/|$)/i,
    kind: "capability",
    surface: "map",
  },
  {
    pattern: /^\/perto-de-mim(?:\/|$)/i,
    kind: "capability",
    surface: "nearby",
  },
  {
    pattern: /^\/(?:busca|buscar)(?:\/|$)/i,
    kind: "capability",
    surface: "search",
  },
  {
    pattern: /^\/mensagens(?:\/|$)/i,
    kind: "capability",
    surface: "messaging",
  },
  {
    pattern: /^\/u(?:\/|$)/i,
    kind: "capability",
    surface: "profiles",
  },
];

const COMMUNITY_EMBEDDED_SURFACES: Readonly<
  Partial<Record<string, ProductModuleKey>>
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
): ProductModuleKey | undefined {
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

function isNotificationRouteRuleEnabled(
  routeRule: NotificationActionRouteRule,
): boolean {
  return routeRule.kind === "product"
    ? isProductModuleEnabled(routeRule.surface)
    : isPlatformCapabilityEnabled(routeRule.surface);
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
  if (communitySurface && !isProductModuleEnabled(communitySurface)) {
    return {
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
      surface: communitySurface,
    };
  }

  const routeRule = ROUTE_RULES.find((rule) => rule.pattern.test(pathname));
  if (!routeRule || isNotificationRouteRuleEnabled(routeRule)) {
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
