/**
 * Route prefetch helper
 *
 * Carrega chunks críticos de navegação sob demanda (hover/focus/touch),
 * reduzindo latência percebida no primeiro clique dos atalhos.
 */

const PREFETCHERS: Array<{ test: (path: string) => boolean; load: () => Promise<unknown> }> = [
  {
    test: (path) => path === "/",
    load: () => import("@/app/pages/HomePageV2"),
  },
  {
    test: (path) => path.startsWith("/empresas"),
    load: () => import("@/app/pages/EmpresasLandingPage"),
  },
  {
    test: (path) => path.startsWith("/servicos"),
    load: () => import("@/modules/professionals/services/pages/ServicosLandingPage"),
  },
  {
    test: (path) => path.startsWith("/classificados"),
    load: () => import("@/modules/classifieds/pages/ClassificadosPage"),
  },
  {
    test: (path) => path.startsWith("/gastronomia"),
    load: () => import("@/modules/business/gastronomy/pages/GastronomyLandingPage"),
  },
  {
    test: (path) => path.startsWith("/eventos"),
    load: () => import("@/core/community-events/pages/EventosPage"),
  },
  {
    test: (path) => path.startsWith("/vagas"),
    load: () => import("@/modules/classifieds/jobs/pages/VagasPublicPage"),
  },
  {
    test: (path) => path.startsWith("/comunidade"),
    load: () => import("@/core/community-feed/pages/ComunidadePage"),
  },
  {
    test: (path) => path.startsWith("/mapa"),
    load: () => import("@/core/maps/pages/MapaPageV4"),
  },
  {
    test: (path) => path.startsWith("/servicos"),
    load: () => import("@/modules/professionals/services/pages/ServicosLandingPage"),
  },
  {
    test: (path) => path.startsWith("/busca"),
    load: () => import("@/app/pages/BuscaPage"),
  },
  {
    test: (path) => path.startsWith("/mobilidade"),
    load: () => import("@/modules/mobility/pages/MobilidadeLandingPage"),
  },
  {
    test: (path) => path.startsWith("/ranking"),
    load: () => import("@/core/gamification/pages/RankingPage"),
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
    test: (path) => path.startsWith("/perfil"),
    load: () => import("@/modules/profile/pages/PerfilHubPage"),
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

  window.setTimeout(callback, 350);
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
      "/empresas",
      "/gastronomia",
      "/eventos",
      "/classificados",
      "/vagas",
      "/comunidade",
      "/servicos",
      "/mapa",
      "/busca",
      "/mobilidade",
      "/ranking",
      "/mensagens",
      "/notifications",
    ].forEach((href) => prefetchRouteByHref(href));
  });
}
