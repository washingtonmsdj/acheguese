import {
  Bell,
  Compass,
  MapPin,
  Sun,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { useSessionContext } from "@/core/session";
import { parsePublicTerritoryPath } from "@/core/routing/utils/publicTerritoryPath";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { cn } from "@/shared/utils/cn";

interface PrimaryMode {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
}

function normalizePath(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

function resolveTerritoryNavigationBase(
  pathname: string,
  fallback: { state: string; city: string },
): string {
  const parsed = parsePublicTerritoryPath(pathname);
  if (!parsed.state || !parsed.city) {
    return `/${fallback.state}/${fallback.city}`;
  }

  return `/${parsed.state}/${parsed.city}${parsed.territorySlug ? `/${parsed.territorySlug}` : ""}`;
}

function isModeActive(pathname: string, mode: PrimaryMode): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(mode.href);

  if (mode.exact) return current === target;
  if (mode.label === "Atividade") {
    return current === "/notificacoes" || current.startsWith("/notificacoes/");
  }
  if (mode.label === "Community") {
    return current === "/comunidade" || current.startsWith("/comunidade/");
  }
  if (mode.label === "Entrar") {
    return current === "/login" || current.startsWith("/login/");
  }
  return current === target || current.startsWith(`${target}/`);
}

export function TerritoryAdaptiveNavigation() {
  const { pathname } = useLocation();
  const { active } = usePublicBrowsingCity();
  const { user } = useSessionContext();
  const territoryBase = resolveTerritoryNavigationBase(pathname, active);
  const territoryModule = (module: string) => `/${module}${territoryBase}`;

  const modes: PrimaryMode[] = [
    {
      href: territoryBase,
      label: "Hoje",
      description: "O que importa agora",
      icon: Sun,
      exact: true,
    },
    {
      href: territoryModule("busca"),
      label: "Explorar",
      description: "Buscar, filtrar e mapear",
      icon: Compass,
    },
    {
      href: buildCommunityTerritoryUrl(territoryBase),
      label: "Community",
      description: "Participação no território",
      icon: Users,
    },
    {
      href: user ? "/notificacoes" : "/login",
      label: "Atividade",
      description: "Avisos e atualizações",
      icon: Bell,
    },
    {
      href: user ? "/conta" : "/login",
      label: user ? "Conta" : "Entrar",
      description: user ? "Perfil e preferências" : "Acesse seu perfil",
      icon: UserRound,
    },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-territory-border bg-territory-surface/96 backdrop-blur-xl safe-area-bottom md:hidden"
        aria-label="Navegação principal mobile"
        data-territory-navigation="mobile"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const activeMode = isModeActive(pathname, mode);
            return (
              <Link
                key={`${mode.label}:${mode.href}`}
                to={mode.href}
                className={cn(
                  "relative mx-0 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0 py-1.5 text-territory-muted transition-colors min-[360px]:mx-0.5 min-[360px]:px-1",
                  activeMode && "text-territory-brand",
                )}
                aria-current={activeMode ? "page" : undefined}
                data-bottom-nav-item={mode.label.toLocaleLowerCase("pt-BR")}
              >
                <span
                  className={cn(
                    "flex h-7 w-9 items-center justify-center rounded-full",
                    activeMode && "bg-territory-brand/12",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="max-w-full truncate text-[0.625rem] font-semibold leading-none min-[360px]:text-[0.6875rem]">
                  {mode.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className="fixed inset-y-0 left-0 z-[90] hidden w-[4.5rem] flex-col border-r border-territory-border bg-territory-surface px-2 py-3 md:flex xl:hidden"
        aria-label="Navegação principal tablet"
        data-territory-navigation="tablet"
      >
        <Link
          to={territoryBase}
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-territory bg-territory-brand text-[hsl(var(--territory-canvas))]"
          aria-label="Achegue-se — Hoje"
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="mt-6 flex flex-1 flex-col gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const activeMode = isModeActive(pathname, mode);
            return (
              <Link
                key={`${mode.label}:${mode.href}`}
                to={mode.href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-territory text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink",
                  activeMode && "bg-territory-brand/12 text-territory-brand",
                )}
                aria-label={mode.label}
                aria-current={activeMode ? "page" : undefined}
                title={mode.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[0.5625rem] font-bold">{mode.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className="fixed inset-y-0 left-0 z-[90] hidden w-56 flex-col border-r border-territory-border bg-territory-surface p-4 xl:flex"
        aria-label="Navegação principal desktop"
        data-territory-navigation="desktop"
      >
        <Link to={territoryBase} className="flex items-center gap-3 px-1 py-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-territory bg-territory-brand text-[hsl(var(--territory-canvas))]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-heading text-lg font-semibold text-territory-ink">
              Achegue-se
            </span>
            <span className="block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-territory-muted">
              Território vivo
            </span>
          </span>
        </Link>

        <Link
          to="/?trocar=territorio"
          className="mt-5 rounded-territory border border-territory-border bg-territory-raised p-3 hover:border-territory-brand/35"
        >
          <span className="block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-territory-muted">
            Contexto atual
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-territory-ink">
            {territoryBase
              .split("/")
              .filter(Boolean)
              .at(-1)
              ?.replace(/-/g, " ")}
          </span>
          <span className="mt-1 block text-xs text-territory-brand">
            Trocar território
          </span>
        </Link>

        <div className="mt-5 flex flex-1 flex-col gap-1.5">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const activeMode = isModeActive(pathname, mode);
            return (
              <Link
                key={`${mode.label}:${mode.href}`}
                to={mode.href}
                className={cn(
                  "group flex min-h-[3.5rem] items-center gap-3 rounded-territory px-3 text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink",
                  activeMode && "bg-territory-brand/12 text-territory-brand",
                )}
                aria-current={activeMode ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {mode.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-territory-muted group-hover:text-territory-muted">
                    {mode.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="px-2 text-[0.6875rem] leading-5 text-territory-muted">
          Modos organizam a jornada. Módulos aparecem dentro do território.
        </p>
      </nav>
    </>
  );
}
