import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { useCommunityScopeResolver } from "@/core/community/hooks/useCommunityScopeResolver";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
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
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";

const TRANSITION_MS = 720;
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

function resolveModuleKeyFromCommunityPath(pathname: string, hasScopedTerritory: boolean): ModuleKey {
  const parts = pathname.split("/").filter(Boolean);
  const moduleSlug = parts[hasScopedTerritory ? 4 : 3] ?? MODULE_SLUGS.community;

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

function PartialCoverageBanner({ activeCount, totalCount }: { activeCount: number; totalCount: number }) {
  return (
    <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        Cobertura parcial: {activeCount} de {totalCount} bairros disponiveis neste modulo.
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
  const navigate = useNavigate();
  const location = useLocation();
  const { resolved, isLoading: scopeLoading } = useCommunityScopeResolver();
  const params = useParams<{
    state?: string;
    city?: string;
    territorySlug?: string;
    district?: string;
    groupSlugOrDistrict?: string;
  }>();
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const communityProfileQuery = useCommunityProfile(resolved);

  const state = params.state?.trim() ?? "";
  const city = params.city?.trim() ?? "";
  const scopedSlug =
    params.territorySlug?.trim() ||
    params.district?.trim() ||
    params.groupSlugOrDistrict?.trim() ||
    "";
  const routeParts = location.pathname.split("/").filter(Boolean);
  const hasInvalidRouteParams = !state || !city;
  const hasLegacyAreaSegment = routeParts[0] === MODULE_SLUGS.community && routeParts[3] === "area";
  const hasInvalidCommunityRoute = hasInvalidRouteParams || hasLegacyAreaSegment;
  const territoryBase = scopedSlug ? `/${state}/${city}/${scopedSlug}` : `/${state}/${city}`;
  const communityBase = hasInvalidRouteParams
    ? `/${MODULE_SLUGS.community}`
    : buildCommunityTerritoryUrl(territoryBase);
  const businessModuleUrl = hasInvalidRouteParams
    ? `/${MODULE_SLUGS.business}`
    : buildModuleTerritoryUrl(MODULE_SLUGS.business, territoryBase);
  const eventsModuleUrl = hasInvalidRouteParams
    ? `/${MODULE_SLUGS.events}`
    : buildModuleTerritoryUrl(MODULE_SLUGS.events, territoryBase);
  const cityHref = `/${state}/${city}`;
  const cityName = cityLabelFromSlug(city);
  const territoryName = resolved
    ? resolved.kind === "group"
      ? resolved.group.name
      : resolved.location.name
    : cityName;
  const currentModuleKey = useMemo(
    () => resolveModuleKeyFromCommunityPath(location.pathname, Boolean(scopedSlug)),
    [location.pathname, scopedSlug],
  );
  const groupId = resolved?.kind === "group" ? resolved.group.id : null;
  const {
    availability,
    active_member_ids,
    result: availabilityResult,
    isLoading: availabilityLoading,
  } = useGroupAvailability(groupId, currentModuleKey);

  useEffect(() => {
    setTransitionMessage(`Bem-vindo ao ${territoryName}`);
    const timer = window.setTimeout(() => setTransitionMessage(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [territoryName]);

  useEffect(() => {
    if (!resolved || !territoryName || hasInvalidCommunityRoute) return;

    lastTerritoryStore.set({
      name: territoryName,
      baseUrl: territoryBase,
    });
  }, [hasInvalidCommunityRoute, resolved, territoryBase, territoryName]);

  const profile = communityProfileQuery.data;
  const communityStatus = profile?.status ?? "active";
  const seoPolicy = resolveSeoPolicy(location.pathname);
  const canonicalHref = typeof window !== "undefined"
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
        <TerritorialNotFound message="A comunidade precisa de estado e cidade válidos na URL." />
      </>
    );
  }

  if (scopeLoading) {
    return (
      <PageLoader
        fullScreen
        message="Carregando comunidade..."
        recoveryAfterMs={9000}
        recoveryTitle="A comunidade está demorando para abrir"
        recoveryDescription="A resolução territorial pode levar alguns segundos. Recarregue se a página não avançar."
      />
    );
  }

  if (!resolved) {
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

  if (communityStatus === "inactive") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10 text-center text-foreground">
        <h1 className="text-2xl font-bold sm:text-3xl">Comunidade indisponível neste momento</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Esta área ainda não está ativa para experiência comunitária. Você pode navegar pela cidade ou acessar a comunidade principal.
        </p>
        <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" onClick={() => navigate(cityHref)}>Navegar por {cityName}</Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => navigate(communityBase)}>
            Abrir comunidade de {cityName}
          </Button>
        </div>
      </div>
    );
  }

  if (communityStatus === "launching" || communityStatus === "coming_soon" || communityStatus === "waiting_list") {
    const interestPath = `${communityBase}/interesse`;
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, follow" />
          <title>{profile?.hero_title ?? territoryName} | Achegue-se</title>
        </Helmet>
        <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:py-14">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">
            <p className="text-xs uppercase tracking-wide text-primary">Próxima comunidade</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{profile?.hero_title ?? `A comunidade de ${territoryName} está chegando`}</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">{profile?.hero_subtitle ?? profile?.description}</p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Enquanto esta comunidade estiver em preparação, você pode navegar pela cidade e registrar interesse para o lançamento.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button className="w-full" onClick={() => navigate(interestPath)}>
                {profile?.primary_cta_label ?? "Cadastrar interesse"}
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate(businessModuleUrl)}>
                {profile?.secondary_cta_label ?? "Quero minha empresa aqui"}
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate(interestPath)}>
                Indicar comércio ou serviço da região
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate(eventsModuleUrl)}>Cadastrar evento da região</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const effectiveAvailability: GroupModuleAvailability = resolved.kind === "group" ? availability : "full";
  const outletContext: TerritorialLayoutContext = {
    resolved,
    baseUrl: territoryBase,
    communityBaseUrl: communityBase,
    groupAvailability: effectiveAvailability,
    activeMemberIds: resolved.kind === "group" ? active_member_ids ?? [] : [],
  };

  return (
    <>
      <TerritorialSEO resolved={resolved} baseUrl={territoryBase} />
      <Helmet>
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content={seoPolicy.robots} />
      </Helmet>
      {transitionMessage ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md">
          <div className="w-[min(90vw,420px)] rounded-2xl border border-primary/25 bg-card/95 p-6 text-center shadow-2xl shadow-primary/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Comunidade
            </p>
            <h2 className="mt-2 text-xl font-bold text-foreground">{transitionMessage}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Carregando a experiência local do território.
            </p>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 overflow-x-hidden">
        {resolved.kind === "group" && currentModuleKey ? (
          <>
            {effectiveAvailability === "partial" && availabilityResult ? (
              <PartialCoverageBanner
                activeCount={availabilityResult.active_module_members}
                totalCount={availabilityResult.total_active_members}
              />
            ) : null}
            {effectiveAvailability === "none" && !availabilityLoading ? <UnavailableModuleBanner /> : null}
          </>
        ) : null}

        <ErrorBoundary>
          <Outlet context={outletContext} />
        </ErrorBoundary>
      </div>
    </>
  );
}
