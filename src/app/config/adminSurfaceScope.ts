import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { PlatformCapabilityKey } from "./platformCapabilityRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

export type AdminSurfaceKey =
  | "dashboard"
  | "banners"
  | "empresas"
  | "gastronomia"
  | "services"
  | "anuncios"
  | "classificados"
  | "classificados-denuncias"
  | "vagas"
  | "eventos"
  | "usuarios"
  | "motoristas"
  | "reports-passageiros"
  | "pontos-embarque"
  | "verificacoes"
  | "analytics-mobilidade"
  | "realtime-dashboard"
  | "moderacao"
  | "qualidade-dados"
  | "privacidade"
  | "analytics"
  | "cupons"
  | "promocoes"
  | "assinaturas"
  | "pricing"
  | "mensagens"
  | "notifications"
  | "community-alerts"
  | "community-issues"
  | "community-interest"
  | "comunicacao"
  | "identidade"
  | "mapa"
  | "configuracoes"
  | "operacoes"
  | "motoboy-operacoes"
  | "reivindicacoes"
  | "ssot"
  | "highlights"
  | "territory-content"
  | "territorial-groups"
  | "city-metadata"
  | "territory-management"
  | "pontos-turisticos"
  | "locations"
  | "branding"
  | "roles";

type AdminSurfacePolicy =
  | { readonly kind: "platform" }
  | { readonly kind: "product"; readonly module: ProductModuleKey }
  | { readonly kind: "capability"; readonly capability: PlatformCapabilityKey }
  | { readonly kind: "paused"; readonly reason: string };

/**
 * Application-level SSOT for admin runtime surfaces.
 *
 * Product/capability-backed surfaces inherit the canonical lifecycle registry.
 * "platform" is reserved for administrative infrastructure that is not owned by
 * a product module. "paused" is only for an admin-only surface that has not been
 * certified even though its underlying capability may be active.
 */
export const ADMIN_SURFACE_SCOPE: Record<AdminSurfaceKey, AdminSurfacePolicy> = {
  dashboard: { kind: "platform" },
  banners: { kind: "platform" },
  empresas: { kind: "product", module: "business" },
  gastronomia: { kind: "product", module: "gastronomy" },
  services: { kind: "product", module: "services" },
  anuncios: { kind: "product", module: "business" },
  classificados: { kind: "product", module: "classifieds" },
  "classificados-denuncias": { kind: "product", module: "classifieds" },
  vagas: { kind: "product", module: "jobs" },
  eventos: { kind: "product", module: "events" },
  usuarios: { kind: "capability", capability: "profiles" },
  motoristas: { kind: "product", module: "mobility" },
  "reports-passageiros": { kind: "product", module: "mobility" },
  "pontos-embarque": { kind: "product", module: "mobility" },
  verificacoes: { kind: "capability", capability: "profiles" },
  "analytics-mobilidade": { kind: "product", module: "mobility" },
  "realtime-dashboard": { kind: "product", module: "mobility" },
  moderacao: { kind: "platform" },
  "qualidade-dados": { kind: "platform" },
  privacidade: { kind: "platform" },
  analytics: { kind: "product", module: "publicAnalytics" },
  cupons: { kind: "product", module: "coupons" },
  promocoes: { kind: "product", module: "coupons" },
  assinaturas: { kind: "product", module: "billing" },
  pricing: { kind: "product", module: "mobility" },
  mensagens: {
    kind: "paused",
    reason: "Admin messaging console is not part of the certified MVP messaging surface.",
  },
  notifications: {
    kind: "paused",
    reason:
      "The end-user Notifications capability is active, but the admin notification console is not part of the certified MVP admin surface.",
  },
  "community-alerts": { kind: "product", module: "communityAlerts" },
  "community-issues": { kind: "product", module: "communityIssues" },
  "community-interest": { kind: "product", module: "community" },
  comunicacao: { kind: "product", module: "communication" },
  identidade: { kind: "capability", capability: "profiles" },
  mapa: { kind: "capability", capability: "map" },
  configuracoes: { kind: "platform" },
  operacoes: { kind: "platform" },
  "motoboy-operacoes": { kind: "product", module: "mobility" },
  reivindicacoes: { kind: "product", module: "business" },
  ssot: { kind: "platform" },
  highlights: { kind: "capability", capability: "territory" },
  "territory-content": { kind: "capability", capability: "territory" },
  "territorial-groups": { kind: "capability", capability: "territory" },
  "city-metadata": { kind: "capability", capability: "territory" },
  "territory-management": { kind: "capability", capability: "territory" },
  "pontos-turisticos": { kind: "product", module: "touristPoints" },
  locations: { kind: "capability", capability: "location" },
  branding: { kind: "platform" },
  roles: { kind: "platform" },
};

export function isAdminSurfaceEnabled(surface: AdminSurfaceKey): boolean {
  const policy = ADMIN_SURFACE_SCOPE[surface];

  switch (policy.kind) {
    case "platform":
      return true;
    case "product":
      return isProductModuleEnabled(policy.module);
    case "capability":
      return isPlatformCapabilityEnabled(policy.capability);
    case "paused":
      return false;
  }
}

function isKnownAdminSurface(id: string): id is AdminSurfaceKey {
  return Object.prototype.hasOwnProperty.call(ADMIN_SURFACE_SCOPE, id);
}

export function filterAdminNavigationSections<
  T extends { readonly items: readonly { readonly id: string }[] },
>(sections: readonly T[]): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!isKnownAdminSurface(item.id)) {
          throw new Error(
            `Admin navigation item "${item.id}" is missing from ADMIN_SURFACE_SCOPE.`,
          );
        }
        return isAdminSurfaceEnabled(item.id);
      }),
    }))
    .filter((section) => section.items.length > 0) as T[];
}
