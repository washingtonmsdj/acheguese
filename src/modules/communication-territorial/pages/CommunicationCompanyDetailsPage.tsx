import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CommunicationPageShell } from "../components/CommunicationBlocks";
import {
  CompanyDetailsAboutTab,
  CompanyDetailsHero,
  CompanyDetailsPublicationsTab,
  CompanyDetailsTerritoriesTab,
} from "../components/company-details/CommunicationCompanyDetailsSections";
import { useCommunicationChannelPublicPage } from "../hooks";
import { buildCommunicationChannelPath } from "../services";

/**
 * CommunicationCompanyDetailsPage
 *
 * Pagina de detalhes completa de uma empresa/canal de comunicacao territorial.
 * Exibe informacoes detalhadas, publicacoes, territorios cobertos, estatisticas e contato.
 */
export default function CommunicationCompanyDetailsPage() {
  const { state = "", city = "", territorySlug = "", channelSlug = "" } = useParams();

  const { data, isLoading } = useCommunicationChannelPublicPage(channelSlug);

  const channel = data?.channel;
  const publications = data?.publications ?? [];
  const territories = data?.territories ?? [];
  const canonicalPath = buildCommunicationChannelPath({ state, city, territorySlug, channelSlug });

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>{channel?.public_name ?? "Detalhes da Empresa"} | Comunicacao Territorial | Achegue-se</title>
        <meta
          name="description"
          content={channel?.description ?? "Detalhes completos do canal de comunicacao territorial"}
        />
        <link rel="canonical" href={canonicalPath} />
      </Helmet>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando informacoes...</p>
          </div>
        </div>
      ) : null}

      {!isLoading && !channel ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Canal nao encontrado</h2>
            <p className="text-muted-foreground">O canal que voce procura nao existe ou esta inativo.</p>
          </div>
          <Button asChild>
            <Link to="/comunicacao">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Comunicacao
            </Link>
          </Button>
        </div>
      ) : null}

      {channel ? (
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/comunicacao">
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Publicacoes Recentes</h2>
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Territorios Autorizados</h2>
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

