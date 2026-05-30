import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { communicationRoutes } from "@/core/communication-territorial/routes/communicationRoutes";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CommunicationPageShell } from "../components/CommunicationBlocks";
import {
  CompanyDetailsAboutTab,
  CompanyDetailsHero,
  CompanyDetailsPublicationsTab,
  CompanyDetailsTerritoriesTab,
} from "../components/company-details/CommunicationCompanyDetailsSections";
import { useCommunicationChannelPublicPage } from "../hooks";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-36 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted sm:w-80" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default function CommunicationCompanyDetailsPage() {
  const { channelSlug = "" } = useParams();
  const { data, isLoading } = useCommunicationChannelPublicPage(channelSlug);

  const channel = data?.channel;
  const publications = data?.publications ?? [];
  const territories = data?.territories ?? [];

  const canonicalPath = communicationRoutes.companyDetails(channel?.slug ?? channelSlug);
  const canonicalUrl = buildPublicAbsoluteUrl(canonicalPath);

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{channel?.public_name ?? "Canal de comunicacao"} | Achegue-se</title>
        <meta
          name="description"
          content={
            channel?.description ||
            "Detalhes completos de canal de comunicacao territorial."
          }
        />
        <link rel="canonical" href={canonicalUrl} />
        {!isLoading && !channel ? <meta name="robots" content="noindex,follow" /> : null}
      </Helmet>

      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to={communicationRoutes.home} className="hover:text-foreground">Comunicacao</Link>
        <span>/</span>
        <span>{channelSlug || "canal"}</span>
      </nav>

      {isLoading ? <LoadingState /> : null}

      {!isLoading && !channel ? (
        <Card className="border-border">
          <CardContent className="space-y-4 py-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Canal nao encontrado</h2>
              <p className="text-muted-foreground">
                O canal informado nao existe ou esta inativo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to={communicationRoutes.home}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para comunicacao
                </Link>
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
          <Button variant="ghost" size="sm" asChild>
            <Link to={communicationRoutes.home}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <CompanyDetailsHero channel={channel} territories={territories} />

          <Tabs defaultValue="publications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="publications">Publicacoes</TabsTrigger>
              <TabsTrigger value="about">Sobre</TabsTrigger>
              <TabsTrigger value="territories">Territorios</TabsTrigger>
            </TabsList>

            <TabsContent value="publications" className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold sm:text-xl">Publicacoes recentes</h2>
                <Badge variant="secondary">{publications.length} publicacoes</Badge>
              </div>
              <CompanyDetailsPublicationsTab publications={publications} channelHref={canonicalPath} />
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <CompanyDetailsAboutTab
                channel={channel}
                publicationsCount={publications.length}
                territoriesCount={territories.length}
              />
            </TabsContent>

            <TabsContent value="territories" className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold sm:text-xl">Territorios autorizados</h2>
                <Badge variant="secondary">{territories.length} territorios</Badge>
              </div>
              <CompanyDetailsTerritoriesTab territories={territories} />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </CommunicationPageShell>
  );
}
