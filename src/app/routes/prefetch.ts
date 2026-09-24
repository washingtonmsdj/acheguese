/**
 * Route prefetch helper
 *
 * Carrega apenas chunks alcançáveis pelo runtime ativo sob demanda
 * (hover/focus/touch), reduzindo latência percebida no primeiro clique.
 *
 * Lifecycle é resolvido neste boundary de app; loaders não conhecem
 * launchScope nem decidem estado de domínio/capability por conta própria.
 */
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
  isAppModulePath,
} from "@/shared/config/moduleSlugs";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "@/app/config/lifecycleRegistry";

type PrefetchLifecycleGate = () => boolean;

interface PrefetchEntry {
  test: (path: string) => boolean;
  load: () => Promise<unknown>;
  enabled: PrefetchLifecycleGate;
}

const PREFETCHERS: PrefetchEntry[] = [
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.business),
    load: () => import("@/app/pages/EmpresasLandingPage"),
    enabled: () => isProductModuleEnabled("business"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.map),
    load: () => import("@/app/pages/MapaPage"),
    enabled: () => isPlatformCapabilityEnabled("map"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.nearby),
    load: () => import("@/app/pages/NearbyPage"),
    enabled: () => isPlatformCapabilityEnabled("nearby"),
  },
  {
    test: (path) => isAppModulePath(path, APP_MODULE_SLUGS.search),
    load: () => import("@/app/pages/BuscaPage"),
    enabled: () => isPlatformCapabilityEnabled("search"),
  },
  {
    test: (path) => path.startsWith("/notificacoes"),
    load: () => import("@/app/pages/NotificationsPage"),
    enabled: () => isPlatformCapabilityEnabled("notifications"),
  },
];

const prefetchedPaths = new Set<string>();
let idleWarmupScheduled = false;

const IDLE_WARMUP_ROUTES: Array<{
  href: string;
  enabled: PrefetchLifecycleGate;
}> = [
  {
    href: buildAppModulePath(APP_MODULE_SLUGS.business),
    enabled: () => isProductModuleEnabled("business"),
  },
  {
    href: buildAppModulePath(APP_MODULE_SLUGS.map),
    enabled: () => isPlatformCapabilityEnabled("map"),
  },
  {
    href: buildAppModulePath(APP_MODULE_SLUGS.nearby),
    enabled: () => isPlatformCapabilityEnabled("nearby"),
  },
  {
    href: buildAppModulePath(APP_MODULE_SLUGS.search),
    enabled: () => isPlatformCapabilityEnabled("search"),
  },
  {
    href: "/notificacoes",
    enabled: () => isPlatformCapabilityEnabled("notifications"),
  },
];

export function getActiveWarmupHrefs(): string[] {
  return IDLE_WARMUP_ROUTES.filter((entry) => entry.enabled()).map(
    (entry) => entry.href,
  );
}

function normalizePath(href: string): string {
  const [path] = href.split("?");
  return path.trim();
}

export function prefetchRouteByHref(href: string): void {
  const path = normalizePath(href);
  if (!path || prefetchedPaths.has(path)) return;

  const candidate = PREFETCHERS.find((entry) => entry.test(path));
  if (!candidate || !candidate.enabled()) return;

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
    getActiveWarmupHrefs().forEach((href) => prefetchRouteByHref(href));
  });
}
