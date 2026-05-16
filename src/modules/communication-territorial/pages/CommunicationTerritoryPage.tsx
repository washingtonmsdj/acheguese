import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChannelCard, CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationTerritoryHub } from "../hooks";
import { buildCommunicationChannelPath, buildCommunicationTerritoryPath } from "../services";

export default function CommunicationTerritoryPage() {
  const { state = "", city = "", territorySlug = "" } = useParams();
  const { data, isLoading } = useCommunicationTerritoryHub(state, city, territorySlug);

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{data?.title ?? "Comunicacao Territorial"} | Achegue-se</title>
        <link rel="canonical" href={buildCommunicationTerritoryPath(state, city, territorySlug)} />
      </Helmet>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Camada editorial territorial</p>
          <h1 className="text-3xl font-bold">{data?.title ?? "Comunicação Territorial"}</h1>
          <p className="text-muted-foreground">
            Diretório territorial de portais, rádios, coletivos e jornais locais com governança de publicação por território.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/comunicacao/solicitar">Solicitar canal</Link>
        </Button>
      </div>

      {isLoading ? <p>Carregando...</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        {(data?.channels ?? []).map((channel) => (
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
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Cobertura editorial recente</h2>
        {(data?.publications ?? []).map((publication) => (
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
        ))}
        {!isLoading && !data?.publications.length ? (
          <p className="text-sm text-muted-foreground">Ainda não há publicações publicadas neste território.</p>
        ) : null}
      </section>
    </CommunicationPageShell>
  );
}
