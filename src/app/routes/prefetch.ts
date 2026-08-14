/**
 * Route prefetch helper
 *
 * Carrega chunks críticos de navegação sob demanda (hover/focus/touch),
 * reduzindo latência percebida no primeiro clique dos atalhos.
 */

import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
  isAppModulePath,
} from "@/config/moduleSlugs";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
import { LAUNCH_URLS } from "@/config/territory";

const PREFETCHERS: Array<{
  test: (path: string) => boolean;
  load: () => Promise<unknown>;
  surface?: LaunchSurfaceKey;
}> = [
  {
    test: (path) => path === "/",
    load: () => import("@/app/pages/PublicCityLandingPage"),
    surface: "home",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.business),
    load: () => import("@/app/pages/EmpresasLandingPage"),
    surface: "business",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.services),
    load: () =>
      import("@/modules/professionals/services/pages/ServicosLandingPage"),
    surface: "services",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.classifieds),
    load: () => import("@/modules/classifieds/pages/ClassificadosPage"),
    surface: "classifieds",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.gastronomy),
    load: () =>
      import("@/modules/business/gastronomy/pages/GastronomyLandingPage"),
    surface: "gastronomy",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.community),
    load: () => import("@/core/community-feed/pages/ComunidadePage"),
    surface: "community",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.map),
    load: () => import("@/core/maps/pages/MapaPageV4"),
    surface: "map",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.search),
    load: () => import("@/app/pages/BuscaPage"),
    surface: "search",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.touristPoints),
    load: () => import("@/modules/guide/pages/TouristPointsPage"),
    surface: "touristPoints",
  },
  {
    test: (path) => path.startsWith("/notifications"),
    load: () => import("@/app/pages/NotificationsPage"),
  },
];

const prefetchedPaths = new Set<string>();
let idleWarmupScheduled = false;

const IDLE_WARMUP_ROUTES: Array<{
  href: string;
  surface?: LaunchSurfaceKey;
}> = [
  { href: buildAppModulePath(APP_MODULE_SLUGS.business), surface: "business" },
  {
    href: buildAppModulePath(APP_MODULE_SLUGS.gastronomy),
    surface: "gastronomy",
  },
  {
    href: buildAppModulePath(APP_MODULE_SLUGS.classifieds),
    surface: "classifieds",
  },
  { href: LAUNCH_URLS.community, surface: "community" },
  { href: buildAppModulePath(APP_MODULE_SLUGS.services), surface: "services" },
  { href: buildAppModulePath(APP_MODULE_SLUGS.map), surface: "map" },
  { href: buildAppModulePath(APP_MODULE_SLUGS.search), surface: "search" },
  { href: LAUNCH_URLS.touristPoints, surface: "touristPoints" },
  { href: "/notifications" },
];

export function getLaunchWarmupHrefs(): string[] {
  return IDLE_WARMUP_ROUTES.filter(
    (entry) => !entry.surface || isLaunchSurfaceEnabled(entry.surface),
  ).map((entry) => entry.href);
}

function normalizePath(href: string): string {
  const [path] = href.split("?");
  return path.trim();
}

export function prefetchRouteByHref(href: string): void {
  const path = normalizePath(href);
  if (!path || prefetchedPaths.has(path)) return;

  const candidate = PREFETCHERS.find((entry) => entry.test(path));
  if (!candidate) return;
  if (candidate.surface && !isLaunchSurfaceEnabled(candidate.surface)) return;

  prefetchedPaths.add(path);
  void candidate.load().catch(() => {
    prefetchedPaths.delete(path);
  });
}

function runIdle(callback: () => void): void {
  if (typeof window === "undefined") return;

  if ("requestIdleCallback" in window) {
    (
      window as Window & {
        requestIdleCallback: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
      }
    ).requestIdleCallback(callback, { timeout: 1200 });
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
    getLaunchWarmupHrefs().forEach((href) => prefetchRouteByHref(href));
  });
}
