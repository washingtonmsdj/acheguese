import {
  Bell,
  Compass,
  Sun,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { parsePublicTerritoryPath } from "@/core/routing/utils/publicTerritoryPath";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";

export type TerritoryNavigationModeId =
  | "today"
  | "explore"
  | "community"
  | "activity"
  | "account";

export interface TerritoryNavigationMode {
  id: TerritoryNavigationModeId;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface TerritoryNavigationContext {
  pathname: string;
  fallback: {
    state: string;
    city: string;
  };
  authenticated: boolean;
}

function normalizePath(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

export function resolveTerritoryNavigationBase(
  pathname: string,
  fallback: { state: string; city: string },
): string {
  const parsed = parsePublicTerritoryPath(pathname);

  if (!parsed.state || !parsed.city) {
    return `/${fallback.state}/${fallback.city}`;
  }

  return `/${parsed.state}/${parsed.city}${
    parsed.territorySlug ? `/${parsed.territorySlug}` : ""
  }`;
}

export function buildTerritoryNavigationModes({
  pathname,
  fallback,
  authenticated,
}: TerritoryNavigationContext): TerritoryNavigationMode[] {
  const territoryBase = resolveTerritoryNavigationBase(
    pathname,
    fallback,
  );
  const territoryModule = (module: string) =>
    `/${module}${territoryBase}`;

  return [
    {
      id: "today",
      href: territoryBase,
      label: "Hoje",
      description: "O que importa agora",
      icon: Sun,
      exact: true,
    },
    {
      id: "explore",
      href: territoryModule("busca"),
      label: "Explorar",
      description: "Buscar, filtrar e mapear",
      icon: Compass,
    },
    {
      id: "community",
      href: buildCommunityTerritoryUrl(territoryBase),
      label: "Community",
      description: "Participação no território",
      icon: Users,
    },
    {
      id: "activity",
      href: authenticated ? "/notificacoes" : "/login",
      label: "Atividade",
      description: "Avisos e atualizações",
      icon: Bell,
    },
    {
      id: "account",
      href: authenticated ? "/conta" : "/login",
      label: authenticated ? "Conta" : "Entrar",
      description: authenticated
        ? "Perfil e preferências"
        : "Acesse seu perfil",
      icon: UserRound,
    },
  ];
}

export function isTerritoryNavigationModeActive(
  pathname: string,
  mode: TerritoryNavigationMode,
): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(mode.href);

  if (mode.exact) return current === target;

  if (mode.id === "activity") {
    return (
      current === "/notificacoes" ||
      current.startsWith("/notificacoes/")
    );
  }

  if (mode.id === "account" && mode.href === "/login") {
    return current === "/login" || current.startsWith("/login/");
  }

  return current === target || current.startsWith(`${target}/`);
}
