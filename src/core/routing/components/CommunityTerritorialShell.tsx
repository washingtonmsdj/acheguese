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
import { buildCommunityTerritoryUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
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

  // Padrão canônico de comunidade: /comunidade/:state/:city/:territorySlug/...
  // segment3 é sempre o territorySlug (nunca "area")
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
  }>();
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const communityProfileQuery = useCommunityProfile(resolved);

  const state = params.state ?? "ba";
  const city = params.city ?? "salvador";
  const territorySlug = params.territorySlug ?? city;
  const territoryBase = resolveCommunityTerritoryBase(location.pathname, state, city);
  const communityBase = buildCommunityTerritoryUrl(territoryBase);
  const cityHref = `/${state}/${city}`;
  const territoryName = resolved
    ? resolved.kind === "group"
      ? resolved.group.name
      : resolved.location.name
    : titleFromSlug(territorySlug);
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

  if (communityProfileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#081114] text-white">
        Carregando comunidade...
      </div>
    );
  }

  if (communityStatus === "inactive") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#081114] text-white px-4 text-center">
        <h1 className="text-2xl font-bold">Comunidade indisponivel neste momento</h1>
        <p className="mt-2 text-sm text-white/70 max-w-xl">
          Esta area ainda nao esta ativa para experiencia comunitaria. Voce pode navegar pela cidade ou entrar no Complexo.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate(cityHref)}>Navegar por {cityName}</Button>
          <Button variant="outline" onClick={() => navigate("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina")}>
            Ir para Comunidade do Complexo
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
        <div className="min-h-screen bg-[#081114] text-white px-4 py-14">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-wide text-primary">Proxima comunidade</p>
            <h1 className="mt-2 text-3xl font-bold">{profile?.hero_title ?? `A comunidade de ${territoryName} esta chegando`}</h1>
            <p className="mt-3 text-white/75">{profile?.hero_subtitle ?? profile?.description}</p>
            <p className="mt-2 text-sm text-white/60">
              Enquanto esta comunidade estiver em preparacao, voce pode navegar pela cidade e registrar interesse para o lancamento.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button onClick={() => navigate(interestPath)}>
                {profile?.primary_cta_label ?? "Cadastrar interesse"}
              </Button>
              <Button variant="outline" onClick={() => navigate(`${communityBase}/empresas`)}>
                {profile?.secondary_cta_label ?? "Quero minha empresa aqui"}
              </Button>
              <Button variant="outline" onClick={() => navigate(interestPath)}>
                Indicar comercio ou servico da regiao
              </Button>
              <Button variant="outline" onClick={() => navigate(`${communityBase}/eventos`)}>Cadastrar evento da regiao</Button>
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
              Carregando a experiencia local do territorio.
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
