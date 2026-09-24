import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { PlatformCapabilityKey } from "./platformCapabilityRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

type ProductRouteRule = {
  readonly owner: ProductModuleKey;
  readonly prefixes: readonly string[];
};

type CapabilityRouteRule = {
  readonly owner: PlatformCapabilityKey;
  readonly prefixes: readonly string[];
};

const PRODUCT_ROUTE_RULES: readonly ProductRouteRule[] = [
  {
    owner: "business",
    prefixes: ["/empresas", "/central/empresas", "/p/"],
  },
  {
    owner: "community",
    prefixes: ["/comunidade", "/central/comunidade"],
  },
  {
    owner: "gastronomy",
    prefixes: ["/gastronomia", "/central/gastronomia"],
  },
  {
    owner: "services",
    prefixes: ["/servicos", "/central/profissional", "/central/servicos"],
  },
  {
    owner: "classifieds",
    prefixes: ["/classificados", "/central/classificados"],
  },
  {
    owner: "touristPoints",
    prefixes: ["/pontos-turisticos", "/guia", "/central/pontos-turisticos"],
  },
  {
    owner: "education",
    prefixes: ["/educacao", "/central/educacao"],
  },
  {
    owner: "jobs",
    prefixes: ["/vagas", "/oportunidades", "/central/vagas"],
  },
  {
    owner: "events",
    prefixes: ["/eventos", "/central/eventos"],
  },
  {
    owner: "communication",
    prefixes: ["/comunicacao", "/central/comunicacao"],
  },
  {
    owner: "mobility",
    prefixes: [
      "/mobilidade",
      "/mobility",
      "/track",
      "/motorista",
      "/passageiro",
      "/central/mobilidade",
      "/central/motorista",
      "/central/motoboy",
    ],
  },
  {
    owner: "coupons",
    prefixes: ["/cupons", "/promocoes", "/central/cupons"],
  },
  {
    owner: "gamification",
    prefixes: ["/ranking", "/gamificacao"],
  },
  {
    owner: "communityAlerts",
    prefixes: ["/alertas", "/central/alertas"],
  },
  {
    owner: "communityIssues",
    prefixes: ["/problemas", "/central/problemas"],
  },
  {
    owner: "communityLostFound",
    prefixes: ["/achados-perdidos", "/achados-e-perdidos"],
  },
  {
    owner: "familySafety",
    prefixes: ["/familia", "/perfil/familia"],
  },
  {
    owner: "billing",
    prefixes: ["/planos", "/checkout", "/settings/subscription"],
  },
  {
    owner: "publicAnalytics",
    prefixes: ["/analytics"],
  },
];

const CAPABILITY_ROUTE_RULES: readonly CapabilityRouteRule[] = [
  { owner: "notifications", prefixes: ["/notificacoes"] },
  { owner: "messaging", prefixes: ["/mensagens"] },
  { owner: "nearby", prefixes: ["/perto-de-mim"] },
  { owner: "search", prefixes: ["/busca", "/buscar"] },
  { owner: "map", prefixes: ["/mapa"] },
  { owner: "account", prefixes: ["/conta"] },
  { owner: "profiles", prefixes: ["/u/"] },
  { owner: "central", prefixes: ["/central"] },
];

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return pathname.startsWith(prefix);
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function getInternalPathname(href: string): string | null {
  const value = href.trim();
  if (!value) return "/";

  if (value.startsWith("/")) {
    try {
      return new URL(value, "https://acheguese.invalid").pathname;
    } catch {
      return "/";
    }
  }

  if (value.startsWith("#")) return "/";

  if (typeof window !== "undefined") {
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin === window.location.origin) return url.pathname;
    } catch {
      return "/";
    }
  }

  return null;
}

/**
 * Applies product/capability lifecycle to notification CTAs.
 *
 * Notifications remain a horizontal capability. A stale notification from a
 * paused vertical may still exist in persistence, but its CTA must not reopen
 * that vertical until the vertical lifecycle is active again.
 *
 * External URLs are left to SafeLink's protocol/origin safety validation.
 */
export function isNotificationActionHrefEnabled(href: string): boolean {
  const pathname = getInternalPathname(href);
  if (pathname === null) return true;

  for (const rule of PRODUCT_ROUTE_RULES) {
    if (rule.prefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) {
      return isProductModuleEnabled(rule.owner);
    }
  }

  for (const rule of CAPABILITY_ROUTE_RULES) {
    if (rule.prefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) {
      return isPlatformCapabilityEnabled(rule.owner);
    }
  }

  return true;
}
