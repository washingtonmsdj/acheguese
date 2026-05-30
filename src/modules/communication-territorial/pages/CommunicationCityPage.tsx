import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ChannelCard, CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationCityHub } from "../hooks";
import {
  buildCommunicationChannelPath,
  buildCommunicationCityPath,
} from "../services";

export default function CommunicationCityPage() {
  const { state = "", city = "" } = useParams();
  const { data, isLoading } = useCommunicationCityHub(state, city);

  const cityPath = buildCommunicationCityPath(state, city);
  const canonicalUrl = buildPublicAbsoluteUrl(cityPath);
  const communityPath = buildCommunityTerritoryUrl(`/${state}/${city}`);

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{data?.title ?? "Comunicação Territorial"} | Achegue-se</title>
        <meta
          name="description"
          content="Diretorio editorial da cidade com canais locais, coberturas territoriais e publicacoes recentes."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">/comunicacao/{state}/{city}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {data?.title ?? "Comunicação Territorial"}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Canais editoriais da cidade com cobertura local organizada por contexto territorial.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/comunicacao/solicitar">Solicitar canal</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Card key={index} className="border-border">
                <CardContent className="space-y-3 p-5">
                  <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
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
                />
              ))
            ) : (
              <Card className="border-border md:col-span-3">
                <CardContent className="py-8 text-sm text-muted-foreground">
                  Nenhum canal ativo encontrado para esta cidade.
                </CardContent>
              </Card>
            )}
          </section>

          <section className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold sm:text-2xl">Cobertura por território</h2>
              <Badge variant="outline">{data?.publications?.length ?? 0} publicações</Badge>
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
                          channelSlug: publication.channel.slug,
                        })
                      : undefined
                  }
                />
              ))
            ) : (
              <Card className="border-border">
                <CardContent className="py-8 text-sm text-muted-foreground">
                  Ainda não há publicações neste recorte de cidade.
                </CardContent>
              </Card>
            )}
          </section>

          <section className="mt-8 rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Quer navegar por bairros e grupos desta cidade?{" "}
              <Link className="font-medium text-primary hover:underline" to={communityPath}>
                Abrir comunidade
              </Link>
              .
            </p>
          </section>
        </>
      ) : null}
    </CommunicationPageShell>
  );
}
