import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationChannelPublicPage } from "../hooks";
import { buildCommunicationChannelPath } from "../services";
import { CHANNEL_KIND_LABELS } from "../types";

export default function CommunicationChannelPage() {
  const { state = "", city = "", territorySlug = "", channelSlug = "" } = useParams();
  const { data, isLoading } = useCommunicationChannelPublicPage(channelSlug);
  const channel = data?.channel;

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{channel?.public_name ?? "Canal de Comunicacao"} | Achegue-se</title>
        <link
          rel="canonical"
          href={buildCommunicationChannelPath({ state, city, territorySlug, channelSlug })}
        />
      </Helmet>
      {isLoading ? <p>Carregando...</p> : null}
      {!isLoading && !channel ? <p className="text-sm text-muted-foreground">Canal nao encontrado ou inativo.</p> : null}
      {channel ? (
        <>
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge>{channel.verification_status === "verified" ? "Canal verificado" : "Em verificacao"}</Badge>
                  <Badge variant="outline">{CHANNEL_KIND_LABELS[channel.channel_kind]}</Badge>
                  <Badge variant="secondary">Confiabilidade {channel.reliability_score}/100</Badge>
                </div>
                <h1 className="text-3xl font-bold">{channel.public_name}</h1>
                <p className="mt-2 max-w-3xl text-muted-foreground">{channel.description}</p>
              </div>
            </div>
          </section>
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Territórios autorizados</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(data?.territories ?? []).map((territory) => (
                  <div key={territory.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span>{territory.location?.full_name ?? territory.location?.name ?? territory.location_id}</span>
                    <Badge variant={territory.can_publish ? "default" : "outline"}>{territory.can_publish ? "Pode publicar" : "Sem publicacao"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Alertas</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Alertas urgentes, push territorial e cooldown automatico estao preparados no schema, mas desabilitados no MVP.
              </CardContent>
            </Card>
          </section>
          <section className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold">Publicações</h2>
            {(data?.publications ?? []).map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                channelHref={buildCommunicationChannelPath({ state, city, territorySlug, channelSlug })}
              />
            ))}
          </section>
        </>
      ) : null}
    </CommunicationPageShell>
  );
}
