/**
 * Route prefetch helper
 *
 * Carrega apenas chunks alcançáveis pelo runtime ativo sob demanda
 * (hover/focus/touch), reduzindo latência percebida no primeiro clique.
 */
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
  isAppModulePath,
} from "@/shared/config/moduleSlugs";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/app/config/launchScope";

const PREFETCHERS: Array<{
  test: (path: string) => boolean;
  load: () => Promise<unknown>;
  surface?: LaunchSurfaceKey;
}> = [
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.business),
    load: () => import("@/app/pages/EmpresasLandingPage"),
    surface: "business",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.map),
    load: () => import("@/core/maps/pages/MapaPageV4"),
    surface: "map",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.nearby),
    load: () => import("@/core/nearby/pages/NearbyPage"),
    surface: "nearby",
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.search),
    load: () => import("@/app/pages/BuscaPage"),
    surface: "search",
  },
];

const prefetchedPaths = new Set<string>();
let idleWarmupScheduled = false;

const IDLE_WARMUP_ROUTES: Array<{
  href: string;
  surface?: LaunchSurfaceKey;
}> = [
  { href: buildAppModulePath(APP_MODULE_SLUGS.business), surface: "business" },
  { href: buildAppModulePath(APP_MODULE_SLUGS.map), surface: "map" },
  { href: buildAppModulePath(APP_MODULE_SLUGS.nearby), surface: "nearby" },
  { href: buildAppModulePath(APP_MODULE_SLUGS.search), surface: "search" },
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
 * Aquece em idle somente as superfícies do MVP ativo.
 * Deve rodar uma única vez por sessão.
 */
export function scheduleIdleRouteWarmup(): void {
  if (idleWarmupScheduled) return;
  idleWarmupScheduled = true;

  runIdle(() => {
    getLaunchWarmupHrefs().forEach((href) => prefetchRouteByHref(href));
  });
}
