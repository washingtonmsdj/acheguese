import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { PlatformCapabilityKey } from "./platformCapabilityRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";
import {
  APP_MODULE_SLUGS,
  getAppModuleSlugFromPath,
  type AppModuleSlug,
} from "@/shared/config/moduleSlugs";

export const NOTIFICATION_INBOX_PATH = "/notificacoes";
export const NOTIFICATION_FALLBACK_ACTION_LABEL = "Abrir notificações";

type NotificationLifecycleSurfaceKey =
  | ProductModuleKey
  | PlatformCapabilityKey;

type NotificationLifecycleOwner =
  | {
      kind: "product";
      surface: ProductModuleKey;
    }
  | {
      kind: "capability";
      surface: PlatformCapabilityKey;
    };

type NotificationActionRouteRule = NotificationLifecycleOwner & {
  pattern: RegExp;
};

export interface NotificationActionTarget {
  href: string;
  label: string;
  isFallback: boolean;
  surface?: NotificationLifecycleSurfaceKey;
}

const ROUTE_RULES: readonly NotificationActionRouteRule[] = [
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
    pattern: /^\/(?:planos|checkout)(?:\/|$)/i,
    kind: "product",
    surface: "billing",
  },
  {
    pattern: /^\/settings\/subscription(?:\/|$)/i,
    kind: "product",
    surface: "billing",
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

const MODULE_ROUTE_OWNERS: Readonly<
  Partial<Record<AppModuleSlug, NotificationLifecycleOwner>>
> = {
  [APP_MODULE_SLUGS.business]: { kind: "product", surface: "business" },
  [APP_MODULE_SLUGS.community]: { kind: "product", surface: "community" },
  [APP_MODULE_SLUGS.gastronomy]: { kind: "product", surface: "gastronomy" },
  [APP_MODULE_SLUGS.services]: { kind: "product", surface: "services" },
  [APP_MODULE_SLUGS.classifieds]: { kind: "product", surface: "classifieds" },
  [APP_MODULE_SLUGS.touristPoints]: { kind: "product", surface: "touristPoints" },
  [APP_MODULE_SLUGS.education]: { kind: "product", surface: "education" },
  [APP_MODULE_SLUGS.jobs]: { kind: "product", surface: "jobs" },
  [APP_MODULE_SLUGS.events]: { kind: "product", surface: "events" },
  [APP_MODULE_SLUGS.mobility]: { kind: "product", surface: "mobility" },
  [APP_MODULE_SLUGS.ranking]: { kind: "product", surface: "gamification" },
  [APP_MODULE_SLUGS.communityAlerts]: { kind: "product", surface: "communityAlerts" },
  [APP_MODULE_SLUGS.communityIssues]: { kind: "product", surface: "communityIssues" },
  [APP_MODULE_SLUGS.communityLostFound]: { kind: "product", surface: "communityLostFound" },
  [APP_MODULE_SLUGS.map]: { kind: "capability", surface: "map" },
  [APP_MODULE_SLUGS.nearby]: { kind: "capability", surface: "nearby" },
  [APP_MODULE_SLUGS.search]: { kind: "capability", surface: "search" },
};

function getModuleRouteOwner(
  pathname: string,
): NotificationLifecycleOwner | undefined {
  const moduleSlug = getAppModuleSlugFromPath(pathname);
  return moduleSlug ? MODULE_ROUTE_OWNERS[moduleSlug] : undefined;
}

function isRetiredModuleFirstTerritorialPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] as AppModuleSlug | undefined;
  if (!first || !MODULE_ROUTE_OWNERS[first]) return false;
  return /^[a-z]{2}$/i.test(segments[1] ?? "") && Boolean(segments[2]);
}

const COMMUNITY_CHILD_SURFACES: Readonly<
  Partial<Record<string, ProductModuleKey>>
> = {
  alertas: "communityAlerts",
  problemas: "communityIssues",
  "achados-perdidos": "communityLostFound",
  "achados-e-perdidos": "communityLostFound",
  comunicacao: "communityCommunication",
};

function getCommunityChildSurface(
  pathname: string,
): ProductModuleKey | undefined {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLocaleLowerCase("pt-BR"));

  const communityIndex = segments.indexOf(APP_MODULE_SLUGS.community);
  if (communityIndex < 0) return undefined;

  for (const segment of segments.slice(communityIndex + 1)) {
    const surface = COMMUNITY_CHILD_SURFACES[segment];
    if (surface) return surface;
  }

  return undefined;
}

function isRetiredCommunityContainerPath(pathname: string): boolean {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLocaleLowerCase("pt-BR"));

  const communityIndex = segments.indexOf(APP_MODULE_SLUGS.community);
  if (communityIndex < 0) return false;

  return segments.slice(communityIndex + 1).some((segment) => {
    const nestedOwner = MODULE_ROUTE_OWNERS[segment as AppModuleSlug];
    return Boolean(nestedOwner && !COMMUNITY_CHILD_SURFACES[segment]);
  });
}

function isNotificationRouteOwnerEnabled(
  owner: NotificationLifecycleOwner,
): boolean {
  return owner.kind === "product"
    ? isProductModuleEnabled(owner.surface)
    : isPlatformCapabilityEnabled(owner.surface);
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
    return { href: actionUrl, label: actionLabel, isFallback: false };
  }

  if (
    isRetiredModuleFirstTerritorialPath(pathname) ||
    isRetiredCommunityContainerPath(pathname) ||
    RETIRED_NOTIFICATION_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))
  ) {
    return {
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
    };
  }

  const communitySurface = getCommunityChildSurface(pathname);
  if (communitySurface && !isProductModuleEnabled(communitySurface)) {
    return {
      href: NOTIFICATION_INBOX_PATH,
      label: NOTIFICATION_FALLBACK_ACTION_LABEL,
      isFallback: true,
      surface: communitySurface,
    };
  }

  const routeOwner =
    getModuleRouteOwner(pathname) ??
    ROUTE_RULES.find((rule) => rule.pattern.test(pathname));

  if (!routeOwner || isNotificationRouteOwnerEnabled(routeOwner)) {
    return {
      href: actionUrl,
      label: actionLabel,
      isFallback: false,
      surface: routeOwner?.surface,
    };
  }

  return {
    href: NOTIFICATION_INBOX_PATH,
    label: NOTIFICATION_FALLBACK_ACTION_LABEL,
    isFallback: true,
    surface: routeOwner.surface,
  };
}
