import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Newspaper } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useCommunityCommunicationFeed } from "../hooks";
import { buildCommunicationCityPath } from "../services";
import { CommunityCommunicationCard } from "../components/CommunityCommunicationCard";

interface CommunityCommunicationTabPageProps {
  resolved: ResolvedTerritory;
}

function getLocationIds(resolved: ResolvedTerritory): string[] {
  if (!resolved) return [];
  if (resolved.kind === "location") return [resolved.location.id];
  return [...new Set(resolved.group.members.map((member) => member.id))];
}

function getTerritoryName(resolved: ResolvedTerritory): string {
  if (!resolved) return "territorio";
  if (resolved.kind === "location") return resolved.location.name;
  return resolved.group.name;
}

function parseStateCityFromTerritory(resolved: ResolvedTerritory): { state?: string; city?: string } {
  const path =
    resolved?.kind === "location"
      ? resolved.location.geographic_path
      : resolved?.group.members[0]?.geographic_path;
  const [, state, city] = (path ?? "").split("/").filter(Boolean);
  return { state, city };
}

export default function CommunityCommunicationTabPage({ resolved }: CommunityCommunicationTabPageProps) {
  const params = useParams<{ state?: string; city?: string }>();
  const locationIds = useMemo(() => getLocationIds(resolved), [resolved]);
  const territoryName = getTerritoryName(resolved);
  const routeTerritory = parseStateCityFromTerritory(resolved);
  const state = params.state ?? routeTerritory.state;
  const city = params.city ?? routeTerritory.city;
  const canonicalCommunicationHref = state && city ? buildCommunicationCityPath(state, city) : null;

  const feed = useCommunityCommunicationFeed(locationIds);

  return (
    <div className="min-h-full bg-[#081114] px-4 py-6 text-white md:px-8">
      <Helmet>
        <title>Comunicacao em {territoryName} | Achegue-se</title>
        <meta
          name="description"
          content={`Publicacoes de portais, radios, coletivos e canais comunitarios em ${territoryName}.`}
        />
      </Helmet>

      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Camada editorial comunitaria
              </p>
              <h1 className="mt-2 text-3xl font-bold">Comunicacao em {territoryName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Conteudos publicados por portais locais, radios, coletivos, jornais regionais e comunicadores
                autorizados neste territorio.
              </p>
            </div>
            {canonicalCommunicationHref ? (
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link to={canonicalCommunicationHref}>Ver canais da cidade</Link>
              </Button>
            ) : null}
          </div>
        </section>

        {feed.isLoading ? (
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardContent className="py-10 text-sm text-white/60">Carregando publicacoes de comunicacao...</CardContent>
          </Card>
        ) : null}

        {!feed.isLoading && !feed.data?.length ? (
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardContent className="py-10">
              <div className="flex items-start gap-3">
                <Newspaper className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Ainda nao ha publicacoes de canais neste territorio.</p>
                  <p className="mt-1 text-sm text-white/60">
                    Quando um canal autorizado publicar, o conteudo aparecera aqui e continuara canonico em `/comunicacao`.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {(feed.data ?? []).map((distribution) =>
            state && city ? (
              <CommunityCommunicationCard
                key={distribution.id}
                distribution={distribution}
                routeParams={{ state, city }}
              />
            ) : null,
          )}
        </section>
      </div>
    </div>
  );
}
