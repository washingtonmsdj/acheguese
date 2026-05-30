import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { buildModuleTerritoryUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
import { TerritorialNotFound } from "./TerritorialNotFound";

function titleCaseFromSlug(value?: string): string {
  if (!value) return "Comunidade local";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CommunityInterestPage() {
  const navigate = useNavigate();
  const { state, city } = useParams<{
    state?: string;
    city?: string;
  }>();
  const normalizedState = state?.trim() ?? "";
  const normalizedCity = city?.trim() ?? "";
  const { resolved } = useResolveTerritoryFromUrl();
  const { data: profile } = useCommunityProfile(resolved);
  const communityBase = useMemo(() => {
    if (!normalizedState || !normalizedCity) return null;
    return `/${normalizedState}/${normalizedCity}`;
  }, [normalizedCity, normalizedState]);
  const eventsPath = useMemo(
    () => (communityBase ? buildModuleTerritoryUrl(MODULE_SLUGS.events, communityBase) : null),
    [communityBase],
  );
  const businessPath = useMemo(
    () => (communityBase ? buildModuleTerritoryUrl(MODULE_SLUGS.business, communityBase) : null),
    [communityBase],
  );

  const territoryName = useMemo(() => {
    if (resolved?.kind === "group") return resolved.group.name;
    if (resolved?.kind === "location") return resolved.location.name;
    return titleCaseFromSlug(normalizedCity);
  }, [normalizedCity, resolved]);
  if (!communityBase || !eventsPath || !businessPath) {
    return <TerritorialNotFound message="A URL de interesse precisa informar estado e cidade válidos." />;
  }

  const contactQuery = `?cidade=${encodeURIComponent(titleCaseFromSlug(normalizedCity))}&territorio=${encodeURIComponent(
    territoryName,
  )}&origem=comunidade-interesse`;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>{profile?.hero_title ?? `Comunidade ${territoryName}`} | Achegue-se</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próxima comunidade</p>
        <h1 className="mt-2 text-2xl font-bold">{profile?.hero_title ?? `Achegue-se ${territoryName} está chegando`}</h1>
        <p className="mt-3 text-muted-foreground">
          {profile?.description ??
            `Em breve, moradores, comércios, serviços e oportunidades de ${territoryName} em um só lugar.`}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button onClick={() => navigate(`/contato${contactQuery}`)}>
            {profile?.primary_cta_label ?? "Cadastrar interesse"}
          </Button>
          <Button variant="outline" onClick={() => navigate(businessPath)}>
            {profile?.secondary_cta_label ?? "Quero minha empresa aqui"}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/contato${contactQuery}`)}>
            Indicar comércio ou serviço da região
          </Button>
          <Button variant="outline" onClick={() => navigate(eventsPath)}>
            Cadastrar evento da região
          </Button>
        </div>

        <div className="mt-6 border-t pt-4 text-sm text-muted-foreground">
          Enquanto isso, você pode navegar pela cidade em{" "}
          <button className="font-medium text-primary hover:underline" onClick={() => navigate(`/${normalizedState}/${normalizedCity}`)}>
            {titleCaseFromSlug(normalizedCity)}
          </button>
          .
        </div>
      </div>
    </div>
  );
}
