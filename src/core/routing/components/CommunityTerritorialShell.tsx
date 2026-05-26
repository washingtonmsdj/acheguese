import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  MapPin,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useCommunityScopeResolver } from "@/core/community/hooks/useCommunityScopeResolver";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { TerritorialLayout } from "./TerritorialLayout";
import { TerritorialNotFound } from "./TerritorialNotFound";
import { buildCommunityTerritoryUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";

const TRANSITION_MS = 720;
function titleFromSlug(value?: string): string {
  if (!value) return "Comunidade local";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cityLabelFromSlug(value?: string): string {
  if (!value) return "Cidade";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveCommunityTerritoryBase(
  pathname: string,
  fallbackState: string,
  fallbackCity: string,
): string {
  const parts = pathname.split("/").filter(Boolean);
  const state = parts[1] ?? fallbackState;
  const city = parts[2] ?? fallbackCity;
  const segment3 = parts[3];

  if (segment3 === "area" && parts[4]) {
    return `/${state}/${city}/${parts[4]}`;
  }

  // Padrao de bairro: /comunidade/:state/:city/:territorySlug/...
  if (segment3 && !Object.values(MODULE_SLUGS).includes(segment3 as (typeof MODULE_SLUGS)[keyof typeof MODULE_SLUGS])) {
    return `/${state}/${city}/${segment3}`;
  }

  return `/${state}/${city}`;
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

export function CommunityTerritorialShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolved } = useCommunityScopeResolver();
  const params = useParams<{
    state?: string;
    city?: string;
    territorySlug?: string;
    groupSlug?: string;
  }>();
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const communityProfileQuery = useCommunityProfile(resolved);

  const state = params.state?.trim() ?? "";
  const city = params.city?.trim() ?? "";
  const territorySlug = params.territorySlug?.trim() ?? "";
  const groupSlug = params.groupSlug?.trim() ?? "";
  const effectiveTerritorySlug = groupSlug || territorySlug;
  const hasInvalidRouteParams = !state || !city || !effectiveTerritorySlug;
  const hasInvalidTerritorySlug =
    hasInvalidRouteParams ||
    (!groupSlug && params.territorySlug === "area") ||
    isReservedSlug(effectiveTerritorySlug);
  const territoryBase = hasInvalidTerritorySlug
    ? `/${state}/${city}/${effectiveTerritorySlug}`
    : resolveCommunityTerritoryBase(location.pathname, state, city);
  const communityBase = hasInvalidTerritorySlug
    ? `/${MODULE_SLUGS.community}${territoryBase}`
    : buildCommunityTerritoryUrl(territoryBase);
  const cityHref = `/${state}/${city}`;
  const territoryName = resolved
    ? resolved.kind === "group"
      ? resolved.group.name
      : resolved.location.name
    : titleFromSlug(effectiveTerritorySlug);
  const cityName = cityLabelFromSlug(city);

  useEffect(() => {
    setTransitionMessage(`Bem-vindo ao ${territoryName}`);
    const timer = window.setTimeout(() => setTransitionMessage(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [territoryName]);

  const profile = communityProfileQuery.data;
  const communityStatus = profile?.status ?? "active";
  const seoPolicy = resolveSeoPolicy(location.pathname);
  const canonicalHref = typeof window !== "undefined"
    ? `${window.location.origin}${seoPolicy.canonicalPath}`
    : seoPolicy.canonicalPath;
  useCommunitySeoHead(canonicalHref, seoPolicy.robots);

  if (hasInvalidTerritorySlug) {
    return (
      <>
        <Helmet>
          <link rel="canonical" href={canonicalHref} />
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <TerritorialNotFound message="A comunidade precisa de um território válido na URL." />
      </>
    );
  }

  if (communityProfileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#081114] text-white">
        Carregando comunidade...
      </div>
    );
  }

  if (communityStatus === "inactive") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#081114] px-4 py-10 text-center text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Comunidade indisponível neste momento</h1>
        <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
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
        <div className="min-h-screen bg-[#081114] px-4 py-10 text-white sm:py-14">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-primary">Próxima comunidade</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{profile?.hero_title ?? `A comunidade de ${territoryName} está chegando`}</h1>
            <p className="mt-3 text-sm text-white/75 sm:text-base">{profile?.hero_subtitle ?? profile?.description}</p>
            <p className="mt-2 text-sm text-white/60 sm:text-base">
              Enquanto esta comunidade estiver em preparação, você pode navegar pela cidade e registrar interesse para o lançamento.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button className="w-full" onClick={() => navigate(interestPath)}>
                {profile?.primary_cta_label ?? "Cadastrar interesse"}
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate(`${communityBase}/empresas`)}>
                {profile?.secondary_cta_label ?? "Quero minha empresa aqui"}
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate(interestPath)}>
                Indicar comércio ou serviço da região
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate(`${communityBase}/eventos`)}>Cadastrar evento da região</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
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
        <TerritorialLayout />
      </div>
    </>
  );
}
