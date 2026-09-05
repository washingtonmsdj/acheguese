import { useEffect, useLayoutEffect, useMemo } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle } from "lucide-react";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useGroupAvailability } from "@/core/territorial/hooks/useGroupAvailability";
import type { GroupModuleAvailability } from "@/core/territorial/types";
import { ModuleKey } from "@/core/rollout/types";
import { ErrorBoundary } from "@/shared/components/errors/ErrorBoundary";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import { TerritorialSEO } from "@/core/routing/seo/TerritorialSEO";
import type { TerritorialLayoutContext } from "./TerritorialLayout";
import { TerritorialNotFound } from "./TerritorialNotFound";
import {
  buildCommunityTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";
import {
  isCommunityTerritoryStaticSegment,
  parsePublicTerritoryPath,
} from "@/core/routing/utils/publicTerritoryPath";
import { resolvePublicTerritoryFallback } from "@/core/routing/utils/publicTerritoryFallbacks";

function cityLabelFromSlug(value?: string): string {
  if (!value) return "Cidade";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function useCommunitySeoHead(canonicalHref: string, robots: string) {
  useLayoutEffect(() => {
    const canonical =
      document.querySelector<HTMLLinkElement>("link[rel='canonical']") ??
      document.head.appendChild(document.createElement("link"));

    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", canonicalHref);

    const robotsMeta =
      document.querySelector<HTMLMetaElement>("meta[name='robots']") ??
      document.head.appendChild(document.createElement("meta"));

    robotsMeta.setAttribute("name", "robots");
    robotsMeta.setAttribute("content", robots);
  }, [canonicalHref, robots]);
}

function resolveModuleKeyFromCommunityPath(
  pathname: string,
  hasScopedTerritory: boolean,
): ModuleKey {
  const parts = pathname.split("/").filter(Boolean);
  const moduleSlug =
    parts[hasScopedTerritory ? 4 : 3] ?? MODULE_SLUGS.community;

  switch (moduleSlug) {
    case MODULE_SLUGS.business:
      return ModuleKey.BUSINESS;
    case MODULE_SLUGS.services:
      return ModuleKey.SERVICES;
    case MODULE_SLUGS.classifieds:
      return ModuleKey.CLASSIFIEDS;
    case MODULE_SLUGS.gastronomy:
      return ModuleKey.GASTRONOMY;
    case MODULE_SLUGS.education:
      return ModuleKey.BUSINESS;
    case MODULE_SLUGS.events:
      return ModuleKey.EVENTS;
    case MODULE_SLUGS.jobs:
      return ModuleKey.JOBS;
    case MODULE_SLUGS.mobility:
      return ModuleKey.MOBILITY;
    case MODULE_SLUGS.map:
      return ModuleKey.BUSINESS;
    case "feed":
    case "grupos":
    case "alertas":
    case "problemas":
    case "achados-e-perdidos":
    case "comunicacao":
    case MODULE_SLUGS.community:
    default:
      return ModuleKey.COMMUNITY;
  }
}

function PartialCoverageBanner({
  activeCount,
  totalCount,
}: {
  activeCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        Cobertura parcial: {activeCount} de {totalCount} bairros disponiveis
        neste modulo.
      </span>
    </div>
  );
}

function UnavailableModuleBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Este modulo ainda nao esta disponivel neste territorio.</span>
    </div>
  );
}

export function CommunityTerritorialShell() {
  const location = useLocation();
  const { resolved, status: territoryStatus } = useResolveTerritoryFromUrl();
  const scopeLoading = territoryStatus === "idle" || territoryStatus === "loading";
  const params = useParams<{
    state?: string;
    city?: string;
    territorySlug?: string;
    district?: string;
    groupSlugOrDistrict?: string;
  }>();
  const parsedPath = parsePublicTerritoryPath(location.pathname);

  const state = params.state?.trim() || parsedPath.state || "";
  const city = params.city?.trim() || parsedPath.city || "";
  const rawScopedSlug =
    params.territorySlug?.trim() ||
    params.district?.trim() ||
    params.groupSlugOrDistrict?.trim() ||
    parsedPath.territorySlug ||
    "";
  const scopedSlug = isCommunityTerritoryStaticSegment(rawScopedSlug)
    ? ""
    : rawScopedSlug;
  const publicCommunityFallback = useMemo(
    () =>
      scopedSlug
        ? resolvePublicTerritoryFallback({
            state,
            city,
            territorySlug: scopedSlug,
          })
        : resolvePublicTerritoryFallback({
            state,
            city,
          }),
    [city, scopedSlug, state],
  );
  const effectiveResolved = resolved ?? publicCommunityFallback;
  const routeParts = location.pathname.split("/").filter(Boolean);
  const hasInvalidRouteParams = !state || !city;
  const hasLegacyAreaSegment =
    routeParts[0] === MODULE_SLUGS.community && routeParts[3] === "area";
  const hasInvalidCommunityRoute =
    hasInvalidRouteParams || hasLegacyAreaSegment;
  const territoryBase = scopedSlug
    ? `/${state}/${city}/${scopedSlug}`
    : `/${state}/${city}`;
  const communityBase = hasInvalidRouteParams
    ? `/${MODULE_SLUGS.community}`
    : buildCommunityTerritoryUrl(territoryBase);
  const cityName = cityLabelFromSlug(city);
  const territoryName = resolved
    ? resolved.kind === "group"
      ? resolved.group.name
      : resolved.location.name
    : cityName;
  const effectiveTerritoryName = effectiveResolved
    ? effectiveResolved.kind === "group"
      ? effectiveResolved.group.name
      : effectiveResolved.location.name
    : territoryName;
  const currentModuleKey = useMemo(
    () =>
      resolveModuleKeyFromCommunityPath(location.pathname, Boolean(scopedSlug)),
    [location.pathname, scopedSlug],
  );
  const groupId =
    effectiveResolved?.kind === "group" ? effectiveResolved.group.id : null;
  const {
    availability,
    active_member_ids,
    result: availabilityResult,
    isLoading: availabilityLoading,
  } = useGroupAvailability(groupId, currentModuleKey);

  useEffect(() => {
    if (
      !effectiveResolved ||
      !effectiveTerritoryName ||
      hasInvalidCommunityRoute
    )
      return;

    lastTerritoryStore.set({
      name: effectiveTerritoryName,
      baseUrl: territoryBase,
    });
  }, [
    effectiveResolved,
    effectiveTerritoryName,
    hasInvalidCommunityRoute,
    territoryBase,
  ]);

  const seoPolicy = resolveSeoPolicy(location.pathname);
  const canonicalHref =
    typeof window !== "undefined"
      ? `${window.location.origin}${seoPolicy.canonicalPath}`
      : seoPolicy.canonicalPath;
  useCommunitySeoHead(canonicalHref, seoPolicy.robots);

  if (hasInvalidCommunityRoute) {
    return (
      <>
        <Helmet>
          <link rel="canonical" href={canonicalHref} />
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <TerritorialNotFound message="A comunidade precisa de estado e cidade validos na URL." />
      </>
    );
  }

  if (scopeLoading) {
    return (
      <PageLoader
        fullScreen
        message="Carregando comunidade..."
        recoveryAfterMs={9000}
        recoveryTitle="A comunidade esta demorando para abrir"
        recoveryDescription="A resolucao territorial pode levar alguns segundos. Recarregue se a pagina nao avancar."
      />
    );
  }

  if (!effectiveResolved) {
    return (
      <>
        <Helmet>
          <link rel="canonical" href={canonicalHref} />
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <TerritorialNotFound message="Nao foi possivel resolver esta comunidade." />
      </>
    );
  }

  const effectiveAvailability: GroupModuleAvailability =
    effectiveResolved.kind === "group" ? availability : "full";
  const outletContext: TerritorialLayoutContext = {
    resolved: effectiveResolved,
    baseUrl: territoryBase,
    communityBaseUrl: communityBase,
    groupAvailability: effectiveAvailability,
    activeMemberIds:
      effectiveResolved.kind === "group" ? (active_member_ids ?? []) : [],
  };

  return (
    <>
      <TerritorialSEO resolved={effectiveResolved} baseUrl={territoryBase} />
      <Helmet>
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content={seoPolicy.robots} />
      </Helmet>

      <div
        className="min-h-[100dvh] overflow-x-hidden"
        data-community-territorial-shell="canonical"
      >
        {effectiveResolved.kind === "group" && currentModuleKey ? (
          <>
            {effectiveAvailability === "partial" && availabilityResult ? (
              <PartialCoverageBanner
                activeCount={availabilityResult.active_module_members}
                totalCount={availabilityResult.total_active_members}
              />
            ) : null}
            {effectiveAvailability === "none" && !availabilityLoading ? (
              <UnavailableModuleBanner />
            ) : null}
          </>
        ) : null}

        <ErrorBoundary>
          <Outlet context={outletContext} />
        </ErrorBoundary>
      </div>
    </>
  );
}
