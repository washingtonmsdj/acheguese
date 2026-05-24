import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Radio,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useSessionContext } from "@/core/session";
import { communicationRoutes } from "@/core/communication-territorial/routes/communicationRoutes";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { buildMailtoUrl, buildTelUrl } from "@/shared/utils/contactLinks";
import { CHANNEL_KIND_LABELS, PUBLICATION_TYPE_LABELS } from "../types";
import { communicationTerritorialGateway } from "../services";

function formatDate(value?: string | null): string {
  if (!value) return "Data indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CommunicationAgentPage() {
  const { channelSlug = "" } = useParams();
  const { user } = useSessionContext();

  const { data, isLoading } = useQuery({
    queryKey: ["communication-agent", channelSlug],
    queryFn: () => communicationTerritorialGateway.getChannelPublicPage(channelSlug),
    retry: false,
    enabled: Boolean(channelSlug),
  });

  const agent = data?.channel ?? null;
  const publications = data?.publications ?? [];
  const territories = data?.territories ?? [];
  const isChannelManager = Boolean(user && agent && agent.profile_id === user.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold text-foreground">Carregando portal...</h2>
              <p className="text-sm text-muted-foreground">Buscando dados reais do canal territorial.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Helmet>
          <title>Portal não encontrado | Achegue-se</title>
        </Helmet>
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">Portal não encontrado</h1>
              <p className="text-lg text-muted-foreground">
                O agente de comunicação não existe, foi removido ou ainda não está ativo.
              </p>
            </div>
            <Button asChild>
              <Link to={communicationRoutes.home}>Explorar comunicação territorial</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{agent.public_name} | Comunicação Territorial | Achegue-se</title>
        <meta
          name="description"
          content={agent.description ?? "Canal de comunicação territorial no Achegue-se."}
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={agent.public_name} />
        <meta property="og:description" content={agent.description ?? ""} />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
          <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="max-w-5xl">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-2 border-white/20 bg-white/10 px-3 py-1.5 text-white">
                  <Radio className="h-4 w-4" />
                  {CHANNEL_KIND_LABELS[agent.channel_kind]}
                </Badge>
                {agent.verification_status === "verified" ? (
                  <Badge className="gap-2 px-3 py-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Verificado
                  </Badge>
                ) : null}
                <Badge variant="outline" className="gap-2 border-white/20 bg-white/5 px-3 py-1.5 text-white">
                  <TrendingUp className="h-4 w-4" />
                  Confiabilidade {agent.reliability_score}/100
                </Badge>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
                <div>
                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-4xl font-black shadow-2xl sm:h-28 sm:w-28">
                    {agent.public_name.charAt(0)}
                  </div>
                  <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    {agent.public_name}
                  </h1>
                  {agent.description ? (
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                      {agent.description}
                    </p>
                  ) : null}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {isChannelManager ? (
                      <Button asChild variant="secondary">
                        <Link to={`/central/comunicacao/${agent.slug}`}>Gerenciar canal</Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                      <Link to={communicationRoutes.request}>Solicitar canal</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-3xl font-black">{territories.length}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/65">territórios</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-3xl font-black">{publications.length}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/65">publicações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto grid gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-12">
          <section className="space-y-6 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Publicações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {publications.length ? (
                  publications.map((publication) => (
                    <article key={publication.id} className="rounded-2xl border p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{PUBLICATION_TYPE_LABELS[publication.publication_type]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(publication.published_at ?? publication.created_at)}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-foreground">{publication.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {publication.summary ?? publication.body}
                      </p>
                      {publication.source_url ? (
                        <a
                          href={publication.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80"
                        >
                          Abrir fonte
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed p-6 text-center">
                    <p className="text-sm font-medium text-foreground">Nenhuma publicação ativa.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Este canal ainda não publicou conteúdo aprovado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Territórios atendidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {territories.length ? (
                  territories.map((territory) => (
                    <div key={territory.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="truncate">{territory.location?.full_name ?? territory.location?.name ?? "Território"}</span>
                      </span>
                      <Badge variant="outline">ativo</Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhum território autorizado para publicação.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {agent.contact_email ? (
                  <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={buildMailtoUrl(agent.contact_email) ?? undefined}>
                    <Mail className="h-4 w-4" />
                    {agent.contact_email}
                  </a>
                ) : null}
                {agent.contact_phone ? (
                  <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={buildTelUrl(agent.contact_phone) ?? undefined}>
                    <Phone className="h-4 w-4" />
                    {agent.contact_phone}
                  </a>
                ) : null}
                {agent.website_url ? (
                  <a
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                    href={agent.website_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Site oficial
                  </a>
                ) : null}
                {!agent.contact_email && !agent.contact_phone && !agent.website_url ? (
                  <p className="text-muted-foreground">Contato público não informado.</p>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
