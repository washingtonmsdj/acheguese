import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ChannelCard, CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationTerritoryHub } from "../hooks";
import { buildCommunicationChannelPath, buildCommunicationTerritoryPath } from "../services";

export default function CommunicationTerritoryPage() {
  const { state = "", city = "", territorySlug = "" } = useParams();
  const { data, isLoading } = useCommunicationTerritoryHub(state, city, territorySlug);

  const territoryPath = buildCommunicationTerritoryPath(state, city, territorySlug);
  const canonicalUrl = buildPublicAbsoluteUrl(territoryPath);

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{data?.title ?? "Comunicacao Territorial"} | Achegue-se</title>
        <meta
          name="description"
          content="Diretorio territorial de canais locais com governanca de publicacao e cobertura editorial."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Camada editorial territorial</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {data?.title ?? "Comunicacao Territorial"}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Diretorio territorial de portais, radios, coletivos e jornais locais com governanca de publicacao.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/comunicacao/solicitar">Solicitar canal</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-border">
                <CardContent className="space-y-3 p-5">
                  <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="h-36 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {(data?.channels ?? []).length ? (
              (data?.channels ?? []).map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  href={buildCommunicationChannelPath({
                    state,
                    city,
                    territorySlug,
                    channelSlug: channel.slug,
                  })}
                />
              ))
            ) : (
              <Card className="border-border md:col-span-3">
                <CardContent className="py-8 text-sm text-muted-foreground">
                  Nenhum canal ativo encontrado para este territorio.
                </CardContent>
              </Card>
            )}
          </section>

          <section className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold sm:text-2xl">Cobertura editorial recente</h2>
              <Badge variant="outline">{data?.publications?.length ?? 0} publicacoes</Badge>
            </div>
            {(data?.publications ?? []).length ? (
              (data?.publications ?? []).map((publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                  channelHref={
                    publication.channel
                      ? buildCommunicationChannelPath({
                          state,
                          city,
                          territorySlug,
                          channelSlug: publication.channel.slug,
                        })
                      : undefined
                  }
                />
              ))
            ) : (
              <Card className="border-border">
                <CardContent className="py-8 text-sm text-muted-foreground">
                  Ainda nao ha publicacoes publicadas neste territorio.
                </CardContent>
              </Card>
            )}
          </section>
        </>
      ) : null}
    </CommunicationPageShell>
  );
}
