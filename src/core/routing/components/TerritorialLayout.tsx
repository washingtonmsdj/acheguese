/* eslint-disable react-refresh/only-export-components */
/**
 * TerritorialLayout
 *
 * Base layout for territorial routes. It resolves the URL territory, exposes
 * the resolved identity to child routes, and fails explicitly when resolution
 * cannot be completed. No synthetic context is created at runtime.
 */

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Link, Outlet, useLocation, useOutletContext, useParams } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/errors/ErrorBoundary";
import { useGroupAvailability } from "@/core/territorial/hooks/useGroupAvailability";
import type { GroupModuleAvailability } from "@/core/territorial/types";
import { ModuleKey } from "@/core/rollout/types";
import { lastTerritoryStore } from "../stores/LastTerritoryStore";
import { TerritorialSEO } from "../seo/TerritorialSEO";
import { useResolveTerritoryFromUrl } from "../hooks/useResolveTerritoryFromUrl";
import type { ResolvedTerritory } from "../hooks/useResolveTerritoryFromUrl";
import { MODULE_SLUGS, buildGroupBaseUrl, isEntityDetailRoute } from "../utils/territoryUrls";
import { TerritorialNotFound } from "./TerritorialNotFound";

export type TerritorialLayoutContext = {
  resolved: ResolvedTerritory;
  baseUrl: string;
  groupAvailability: GroupModuleAvailability;
  activeMemberIds: string[];
};

export function useTerritorialContext() {
  return useOutletContext<TerritorialLayoutContext>();
}

export function useTerritorialContextOptional() {
  return useOutletContext<TerritorialLayoutContext | null>() ?? null;
}

const SLUG_TO_MODULE_KEY: Record<string, ModuleKey> = {
  [MODULE_SLUGS.community]: ModuleKey.COMMUNITY,
  [MODULE_SLUGS.business]: ModuleKey.BUSINESS,
  [MODULE_SLUGS.education]: ModuleKey.BUSINESS,
  [MODULE_SLUGS.services]: ModuleKey.SERVICES,
  [MODULE_SLUGS.classifieds]: ModuleKey.CLASSIFIEDS,
  [MODULE_SLUGS.mobility]: ModuleKey.MOBILITY,
  [MODULE_SLUGS.gastronomy]: ModuleKey.GASTRONOMY,
  [MODULE_SLUGS.events]: ModuleKey.EVENTS,
  [MODULE_SLUGS.jobs]: ModuleKey.JOBS,
};

function resolveModuleKeyFromSlug(slug: string): ModuleKey | null {
  return SLUG_TO_MODULE_KEY[slug] ?? null;
}

function PartialCoverageBanner({ activeCount, totalCount }: { activeCount: number; totalCount: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        Cobertura parcial: {activeCount} de {totalCount} bairros disponíveis neste módulo.
      </span>
    </div>
  );
}

function UnavailableModuleBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-muted/60 border-b border-border text-xs text-muted-foreground">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Este módulo ainda não está disponível neste território.</span>
    </div>
  );
}

function resolveBaseUrl(
  resolved: ResolvedTerritory | null | undefined,
  params: { state?: string; city?: string; slug?: string },
) {
  if (!resolved) {
    return params.slug ? `/${params.state}/${params.city}/${params.slug}` : `/${params.state}/${params.city}`;
  }

  if (resolved.kind === "group") {
    const firstMember = resolved.group.members[0];
    if (!firstMember?.geographic_path) {
      return `/${params.state}/${params.city}/${resolved.group.slug}`;
    }

    const parts = firstMember.geographic_path.split("/").filter(Boolean);
    return buildGroupBaseUrl(resolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
  }

  const parts = resolved.location.geographic_path.split("/").filter(Boolean);
  return `/${parts.slice(1).join("/")}`;
}

function TerritoryStatusMessage({
  title,
  message,
  showCityButton,
  state,
  city,
}: {
  title: string;
  message: string;
  showCityButton?: boolean;
  state?: string;
  city?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-full p-4">
        <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-500" />
      </div>
      <div className="space-y-2 max-w-md">
        <p className="text-xl font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
      <div className="mt-4 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <button
          onClick={() => window.history.back()}
          className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:w-auto"
        >
          Voltar
        </button>
        {showCityButton && state && city && (
          <Link
            to={`/${state}/${city}`}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Ver cidade
          </Link>
        )}
      </div>
    </div>
  );
}

export function TerritorialLayout() {
  const { status, resolved, error } = useResolveTerritoryFromUrl();
  const { pathname } = useLocation();
  const params = useParams<{
    state?: string;
    city?: string;
    district?: string;
    groupSlug?: string;
    groupSlugOrDistrict?: string;
  }>();

  const state = params.state;
  const city = params.city;
  const slug = params.groupSlug ?? params.district ?? params.groupSlugOrDistrict;
  const currentModuleSlug = pathname.split("/").filter(Boolean)[0] ?? "";
  const currentModuleKey = resolveModuleKeyFromSlug(currentModuleSlug);
  const groupId = resolved?.kind === "group" ? resolved.group.id : null;
  const { availability, active_member_ids, result: availabilityResult, isLoading: availabilityLoading } =
    useGroupAvailability(groupId, currentModuleKey);
  const baseUrl = resolveBaseUrl(resolved, { state, city, slug });
  const territoryName = resolved ? (resolved.kind === "group" ? resolved.group.name : resolved.location.name) : "";

  useEffect(() => {
    if ((status === "resolved_location" || status === "resolved_group") && territoryName && baseUrl && !isEntityDetailRoute(pathname)) {
      lastTerritoryStore.set({ name: territoryName, baseUrl });
    }
  }, [status, territoryName, baseUrl, pathname]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "not_found") {
    return <TerritorialNotFound message={error ?? undefined} />;
  }

  if (status === "inactive") {
    return (
      <TerritoryStatusMessage
        title="Território inativo"
        message={error ?? "Este território não está disponível no momento."}
      />
    );
  }

  if (status === "restricted") {
    return (
      <TerritoryStatusMessage
        title="Território indisponível"
        message={error ?? "Este território não está disponível para navegação pública no momento."}
        showCityButton
        state={state}
        city={city}
      />
    );
  }

  if (status === "error" || !resolved) {
    return <TerritorialNotFound message={error ?? "Não foi possível resolver este território."} />;
  }

  const effectiveAvailability: GroupModuleAvailability = resolved.kind === "group" ? availability : "full";
  const outletContext: TerritorialLayoutContext = {
    resolved,
    baseUrl,
    groupAvailability: effectiveAvailability,
    activeMemberIds: resolved.kind === "group" ? active_member_ids : [],
  };

  return (
    <>
      <TerritorialSEO resolved={resolved} baseUrl={baseUrl} />

      {resolved.kind === "group" && currentModuleKey && (
        <>
          {effectiveAvailability === "partial" && availabilityResult && (
            <PartialCoverageBanner
              activeCount={availabilityResult.active_module_members}
              totalCount={availabilityResult.total_active_members}
            />
          )}
          {effectiveAvailability === "none" && !availabilityLoading && <UnavailableModuleBanner />}
        </>
      )}

      <ErrorBoundary>
        <Outlet context={outletContext} />
      </ErrorBoundary>
    </>
  );
}
