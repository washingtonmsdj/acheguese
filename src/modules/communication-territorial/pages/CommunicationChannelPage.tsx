import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { SafeLink } from "@/shared/components/security";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { buildMailtoUrl } from "@/shared/utils/contactLinks";
import { CommunicationPageShell, PublicationCard } from "../components/CommunicationBlocks";
import { useCommunicationChannelPublicPage } from "../hooks";
import { buildCommunicationChannelPath, buildCommunicationCityPath } from "../services";
import { CHANNEL_KIND_LABELS } from "../types";

function LoadingState() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border">
        <CardContent className="space-y-4 p-6">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CommunicationChannelPage() {
  const { state = "", city = "", channelSlug = "" } = useParams();
  const { data, isLoading } = useCommunicationChannelPublicPage(channelSlug);
  const channel = data?.channel;

  const cityPath = buildCommunicationCityPath(state, city);
  const canonicalPath = buildCommunicationChannelPath({
    state,
    city,
    channelSlug: channel?.slug ?? channelSlug,
  });
  const canonicalUrl = buildPublicAbsoluteUrl(canonicalPath);

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{channel?.public_name ?? "Canal de Comunicacao"} | Achegue-se</title>
        <meta
          name="description"
          content={
            channel?.description ||
            "Canal territorial com cobertura local, publicacoes e governanca por territorio."
          }
        />
        <link rel="canonical" href={canonicalUrl} />
        {!isLoading && !channel ? <meta name="robots" content="noindex,follow" /> : null}
      </Helmet>

      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/comunicacao" className="hover:text-foreground">Comunicacao</Link>
        <span>/</span>
        <Link to={cityPath} className="hover:text-foreground">{city || "cidade"}</Link>
      </nav>

      {isLoading ? <LoadingState /> : null}

      {!isLoading && !channel ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Canal nao encontrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este canal nao esta ativo ou nao pertence a cidade informada.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to={cityPath}>Voltar a comunicacao da cidade</Link>
              </Button>
              <Button asChild>
                <Link to="/comunicacao/solicitar">Solicitar canal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {channel ? (
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{channel.verification_status === "verified" ? "Canal verificado" : "Em verificacao"}</Badge>
                <Badge variant="outline">{CHANNEL_KIND_LABELS[channel.channel_kind]}</Badge>
                <Badge variant="secondary">Confiabilidade {channel.reliability_score}/100</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{channel.public_name}</h1>
              <p className="text-sm text-muted-foreground sm:text-base">{channel.description}</p>
              <p className="text-xs text-muted-foreground">Identidade publica: /{channel.slug}</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-border md:col-span-2">
              <CardHeader>
                <CardTitle>Territorios autorizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(data?.territories ?? []).length ? (
                  (data?.territories ?? []).map((territory) => (
                    <div
                      key={territory.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span>{territory.location?.full_name ?? territory.location?.name ?? territory.location_id}</span>
                      <Badge variant={territory.can_publish ? "default" : "outline"}>
                        {territory.can_publish ? "Pode publicar" : "Sem publicacao"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum territorio autorizado no momento.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {channel.website_url ? (
                  <p>
                    Site:{" "}
                    <SafeLink
                      href={channel.website_url}
                      target="_blank"
                      className="font-medium text-primary hover:underline"
                    >
                      {channel.website_url}
                    </SafeLink>
                  </p>
                ) : null}
                {channel.contact_email ? (
                  <p>
                    Email:{" "}
                    <a href={buildMailtoUrl(channel.contact_email) ?? undefined} className="font-medium text-primary hover:underline">
                      {channel.contact_email}
                    </a>
                  </p>
                ) : null}
                {channel.contact_phone ? <p>Telefone: {channel.contact_phone}</p> : null}
                {!channel.website_url && !channel.contact_email && !channel.contact_phone ? (
                  <p className="text-muted-foreground">Canal sem dados publicos de contato.</p>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold sm:text-2xl">Publicacoes</h2>
              <Badge variant="outline">{data?.publications?.length ?? 0} itens</Badge>
            </div>
            {(data?.publications ?? []).length ? (
              (data?.publications ?? []).map((publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                  channelHref={canonicalPath}
                />
              ))
            ) : (
              <Card className="border-border">
                <CardContent className="py-8 text-sm text-muted-foreground">
                  Este canal ainda nao publicou conteudo nesta cidade.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      ) : null}
    </CommunicationPageShell>
  );
}
