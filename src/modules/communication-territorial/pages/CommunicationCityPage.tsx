import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChannelCard, CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationCityHub } from "../hooks";
import {
  buildCommunicationChannelPath,
  buildCommunicationCityPath,
  buildCommunicationTerritoryPath,
} from "../services";

export default function CommunicationCityPage() {
  const { state = "", city = "" } = useParams();
  const { data, isLoading } = useCommunicationCityHub(state, city);

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{data?.title ?? "Comunicacao Territorial"} | Achegue-se</title>
        <link rel="canonical" href={buildCommunicationCityPath(state, city)} />
      </Helmet>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">/comunicacao</p>
          <h1 className="text-3xl font-bold">{data?.title ?? "Comunicação Territorial"}</h1>
          <p className="text-muted-foreground">
            Listagem editorial da cidade. Escolha um território para abrir os canais em contexto local.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/comunicacao/solicitar">Solicitar canal</Link>
        </Button>
      </div>

      {isLoading ? <p>Carregando...</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        {(data?.channels ?? []).map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Cobertura por território</h2>
        {(data?.publications ?? []).map((publication) => {
          const locationSlug = publication.location?.slug ?? city;
          return (
            <PublicationCard
              key={publication.id}
              publication={publication}
              channelHref={
                publication.channel
                  ? buildCommunicationChannelPath({
                      state,
                      city,
                      territorySlug: locationSlug,
                      channelSlug: publication.channel.slug,
                    })
                  : undefined
              }
            />
          );
        })}
        {!isLoading && !data?.publications.length ? (
          <p className="text-sm text-muted-foreground">Ainda não há publicações publicadas neste recorte.</p>
        ) : null}
      </section>

      {!isLoading ? (
        <section className="mt-8 rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Para abrir canais no contexto territorial correto, acesse tambem:
            {" "}
            <Link className="font-medium text-primary" to={buildCommunicationTerritoryPath(state, city, "complexo-do-nordeste-de-amaralina")}>
              hub territorial do Complexo do Nordeste de Amaralina
            </Link>
            .
          </p>
        </section>
      ) : null}
    </CommunicationPageShell>
  );
}
