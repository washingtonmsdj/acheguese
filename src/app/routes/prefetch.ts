/**
 * Route prefetch helper
 *
 * Carrega chunks críticos de navegação sob demanda (hover/focus/touch),
 * reduzindo latência percebida no primeiro clique dos atalhos.
 */

import { APP_MODULE_SLUGS, buildAppModulePath, isAppModulePath } from "@/config/moduleSlugs";
import { LAUNCH_URLS } from "@/config/territory";

const PREFETCHERS: Array<{ test: (path: string) => boolean; load: () => Promise<unknown> }> = [
  {
    test: (path) => path === "/",
    load: () => import("@/app/pages/MainLandingPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.business),
    load: () => import("@/app/pages/EmpresasLandingPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.services),
    load: () => import("@/modules/professionals/services/pages/ServicosLandingPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.classifieds),
    load: () => import("@/modules/classifieds/pages/ClassificadosPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.gastronomy),
    load: () => import("@/modules/business/gastronomy/pages/GastronomyLandingPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.events),
    load: () => import("@/features/events/pages/EventsListPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.jobs),
    load: () => import("@/modules/classifieds/jobs/pages/VagasPublicPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.community),
    load: () => import("@/modules/community-feed/pages/ComunidadePage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.map),
    load: () => import("@/core/maps/pages/MapaPageV4"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.search),
    load: () => import("@/app/pages/BuscaPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.mobility),
    load: () => import("@/modules/mobility/pages/MobilidadeLandingPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.ranking),
    load: () => import("@/app/pages/gamification/RankingPage"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.touristPoints),
    load: () => import("@/modules/guide/pages/TouristPointsPage"),
  },
  {
    test: (path) => path.startsWith("/mensagens") || path.startsWith("/chat/"),
    load: () => import("@/core/messaging/pages/MensagensPage"),
  },
  {
    test: (path) => path.startsWith("/notifications"),
    load: () => import("@/app/pages/NotificationsPage"),
  },
  {
    test: (path) => path.startsWith("/conta"),
    load: () => import("@/modules/profile/pages/ContaHubPage"),
  },
];

const prefetchedPaths = new Set<string>();
let idleWarmupScheduled = false;

function normalizePath(href: string): string {
  const [path] = href.split("?");
  return path.trim();
}

export function prefetchRouteByHref(href: string): void {
  const path = normalizePath(href);
  if (!path || prefetchedPaths.has(path)) return;

  const candidate = PREFETCHERS.find((entry) => entry.test(path));
  if (!candidate) return;

  prefetchedPaths.add(path);
  void candidate.load().catch(() => {
    prefetchedPaths.delete(path);
  });
}

function runIdle(callback: () => void): void {
  if (typeof window === "undefined") return;

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback(callback, { timeout: 1200 });
    return;
  }

  globalThis.setTimeout(callback, 350);
}

/**
 * Aquece em idle os módulos de navegação mais usados.
 * Deve rodar uma única vez por sessão.
 */
export function scheduleIdleRouteWarmup(): void {
  if (idleWarmupScheduled) return;
  idleWarmupScheduled = true;

  runIdle(() => {
    [
      buildAppModulePath(APP_MODULE_SLUGS.business),
      buildAppModulePath(APP_MODULE_SLUGS.gastronomy),
      buildAppModulePath(APP_MODULE_SLUGS.events),
      buildAppModulePath(APP_MODULE_SLUGS.classifieds),
      buildAppModulePath(APP_MODULE_SLUGS.jobs),
      LAUNCH_URLS.community,
      buildAppModulePath(APP_MODULE_SLUGS.services),
      buildAppModulePath(APP_MODULE_SLUGS.map),
      buildAppModulePath(APP_MODULE_SLUGS.search),
      buildAppModulePath(APP_MODULE_SLUGS.mobility),
      buildAppModulePath(APP_MODULE_SLUGS.ranking),
      LAUNCH_URLS.touristPoints,
      "/mensagens",
      "/notifications",
      "/conta",
    ].forEach((href) => prefetchRouteByHref(href));
  });
}
