import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { communicationTerritorialGateway } from "../../services";

// Layout Components
import { AgentHeroSection } from "../agent-page/sections/AgentHeroSection";
import { AgentStatsBar } from "../agent-page/sections/AgentStatsBar";
import { AgentLatestPublications } from "../agent-page/sections/AgentLatestPublications";
import { AgentActiveCoverage } from "../agent-page/sections/AgentActiveCoverage";
import { AgentWeekHighlights } from "../agent-page/sections/AgentWeekHighlights";
import { 
  AgentLocalNews,
  AgentEventsHighlight,
  AgentMultimediaGallery,
  AgentCulturalAgenda,
  AgentCommunityAlerts,
  AgentTrendingContent,
  AgentCoveredCommunities,
  AgentPartnersSponsors,
  AgentEditorialFeed
} from "../agent-page/sections/AgentLocalNews";

// Composer
import { AgentPublicationComposer } from "../agent-page/composer/AgentPublicationComposer";

// Sidebar Components
import { AgentSidebarAbout } from "../agent-page/sidebar/AgentSidebarAbout";
import { AgentSidebarContact } from "../agent-page/sidebar/AgentSidebarContact";
import { 
  AgentSidebarTerritorial,
  AgentSidebarActivity,
  AgentSidebarSocial,
  AgentSidebarNewsletter
} from "../agent-page/sidebar/AgentSidebarTerritorial";

/**
 * CommunicationAgentPageV2
 * 
 * Página premium de agente de comunicação territorial.
 * 
 * Conceito: Portal local moderno, mídia comunitária viva, hub editorial territorial.
 * 
 * Sensação: Portal de notícia moderno + mídia hiperlocal + comunidade ativa + feed editorial premium.
 * 
 * Representa:
 * - Portais locais
 * - Páginas de bairro
 * - Rádios comunitárias
 * - Coletivos culturais
 * - Jornais regionais
 * - Agentes culturais
 * - Mídias comunitárias
 * - Comunicadores territoriais
 * 
 * Transmite:
 * - Movimento e atividade
 * - Relevância territorial
 * - Credibilidade
 * - Identidade local forte
 * 
 * Arquitetura preparada para:
 * - Trending territorial
 * - Relevância contextual
 * - IA territorial
 * - Cobertura ao vivo
 * - Notificações locais
 * - Distribuição inteligente
 * - Monetização
 * - Patrocinadores
 * - Analytics
 * - Múltiplos administradores/editoriais
 */
export default function CommunicationAgentPageV2() {
  const { channelSlug = "" } = useParams();
  const { user } = useSessionContext();
  
  const { data, isLoading } = useQuery({
    queryKey: ["communication-agent-v2", channelSlug],
    queryFn: () => communicationTerritorialGateway.getChannelPublicPage(channelSlug),
    // Adicionar retry false para não ficar tentando buscar dados que não existem
    retry: false,
  });

  const agent = data?.channel;
  const publications = data?.publications ?? [];
  const territories = data?.territories ?? [];

  // Verificar se usuário é gestor do canal
  const isChannelManager = user && agent && agent.profile_id === user.id;

  // Mock data SSOT-compliant para demonstração quando não há dados reais
  const useMockData = !isLoading && !agent;
  
  // Mock agent seguindo exatamente o schema CommunicationChannel
  const mockAgent: typeof agent = useMockData ? {
    id: "00000000-0000-0000-0000-000000000001",
    profile_id: "00000000-0000-0000-0000-000000000002",
    public_name: "Portal Nordeste",
    slug: channelSlug,
    description: "Portal de notícias e comunicação territorial do Nordeste de Amaralina. Conectando comunidades, informando moradores e fortalecendo a identidade local.",
    channel_kind: "portal" as const,
    verification_status: "verified" as const,
    reliability_score: 95,
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Campos opcionais do schema
    contact_email: "contato@portalnordeste.com.br",
    contact_phone: null,
    website_url: "https://portalnordeste.com.br",
    metadata: {
      // Dados extras que não estão no schema principal
      social_links: {
        instagram: "@portalnordeste",
        facebook: "portalnordeste",
      },
      // Stats simulados (não estão no schema, são calculados)
      mock_stats: {
        followers: 12500,
        views: 45200,
        engagement: 3800,
      }
    },
  } : agent;

  // Mock territories seguindo exatamente o schema CommunicationChannelTerritory
  const mockTerritories: typeof territories = useMockData ? [
    { 
      id: "00000000-0000-0000-0000-000000000010",
      channel_id: "00000000-0000-0000-0000-000000000001",
      location_id: "00000000-0000-0000-0000-000000000100",
      territory_role: "primary" as const,
      can_publish: true,
      can_alert: true,
      can_push: false,
      approved_by_user_id: null,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: { 
        id: "00000000-0000-0000-0000-000000000100",
        name: "Nordeste de Amaralina",
        full_name: "Nordeste de Amaralina, Salvador, BA",
        slug: "nordeste-de-amaralina",
        type: "neighborhood" as const,
        parent_id: null,
      }
    },
    { 
      id: "00000000-0000-0000-0000-000000000011",
      channel_id: "00000000-0000-0000-0000-000000000001",
      location_id: "00000000-0000-0000-0000-000000000101",
      territory_role: "secondary" as const,
      can_publish: true,
      can_alert: false,
      can_push: false,
      approved_by_user_id: null,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: { 
        id: "00000000-0000-0000-0000-000000000101",
        name: "Santa Cruz",
        full_name: "Santa Cruz, Salvador, BA",
        slug: "santa-cruz",
        type: "neighborhood" as const,
        parent_id: null,
      }
    },
    { 
      id: "00000000-0000-0000-0000-000000000012",
      channel_id: "00000000-0000-0000-0000-000000000001",
      location_id: "00000000-0000-0000-0000-000000000102",
      territory_role: "secondary" as const,
      can_publish: true,
      can_alert: false,
      can_push: false,
      approved_by_user_id: null,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: { 
        id: "00000000-0000-0000-0000-000000000102",
        name: "Vale das Pedrinhas",
        full_name: "Vale das Pedrinhas, Salvador, BA",
        slug: "vale-das-pedrinhas",
        type: "neighborhood" as const,
        parent_id: null,
      }
    },
    { 
      id: "00000000-0000-0000-0000-000000000013",
      channel_id: "00000000-0000-0000-0000-000000000001",
      location_id: "00000000-0000-0000-0000-000000000103",
      territory_role: "coverage" as const,
      can_publish: false,
      can_alert: false,
      can_push: false,
      approved_by_user_id: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: { 
        id: "00000000-0000-0000-0000-000000000103",
        name: "Chapada do Rio Vermelho",
        full_name: "Chapada do Rio Vermelho, Salvador, BA",
        slug: "chapada-do-rio-vermelho",
        type: "neighborhood" as const,
        parent_id: null,
      }
    },
    { 
      id: "00000000-0000-0000-0000-000000000014",
      channel_id: "00000000-0000-0000-0000-000000000001",
      location_id: "00000000-0000-0000-0000-000000000104",
      territory_role: "secondary" as const,
      can_publish: true,
      can_alert: false,
      can_push: false,
      approved_by_user_id: null,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: { 
        id: "00000000-0000-0000-0000-000000000104",
        name: "Calabetão",
        full_name: "Calabetão, Salvador, BA",
        slug: "calabetao",
        type: "neighborhood" as const,
        parent_id: null,
      }
    },
  ] : territories;

  const displayAgent = useMockData ? mockAgent : agent;
  const displayTerritories = useMockData ? mockTerritories : territories;

  return (
    <>
      <Helmet>
        <title>{agent?.public_name ?? "Agente de Comunicação"} | Portal Territorial | Achegue-se</title>
        <meta 
          name="description" 
          content={agent?.description ?? "Hub editorial territorial, mídia comunitária e portal local moderno"} 
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={agent?.public_name ?? "Agente de Comunicação"} />
        <meta property="og:description" content={agent?.description ?? ""} />
      </Helmet>

      {/* Loading State */}
      {isLoading && (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Carregando portal...</h2>
                <p className="text-sm text-muted-foreground">Preparando conteúdo territorial</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && !agent && !useMockData && (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">Portal não encontrado</h1>
                <p className="text-lg text-muted-foreground">
                  O agente de comunicação que você procura não existe ou está temporariamente indisponível.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/comunicacao" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Explorar Comunicação Territorial
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {(displayAgent || useMockData) && (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
          
          {/* Mock Data Notice */}
          {useMockData && (
            <div className="bg-amber-50 border-b border-amber-200">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <span className="font-semibold">⚠️ Modo Demonstração:</span>
                  <span>Exibindo dados de exemplo. O canal "{channelSlug}" não foi encontrado no banco de dados.</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Hero Section - Capa forte e dinâmica */}
          <AgentHeroSection 
            agent={displayAgent} 
            territories={displayTerritories}
            isChannelManager={isChannelManager}
          />

          {/* Stats Bar - Indicadores principais */}
          <AgentStatsBar agent={displayAgent} publications={publications} territories={displayTerritories} />

          {/* Main Container */}
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Main Content Column */}
              <main className="lg:col-span-8 space-y-6 sm:space-y-8">
                
                {/* Composer (apenas para gestores) */}
                {isChannelManager && displayAgent && (
                  <AgentPublicationComposer 
                    channel={displayAgent}
                    territories={displayTerritories}
                  />
                )}

                {/* Destaques da Semana */}
                <AgentWeekHighlights publications={publications} />

                {/* Últimas Publicações - Feed Editorial */}
                <AgentLatestPublications publications={publications} agent={displayAgent} />

                {/* Cobertura Ativa */}
                <AgentActiveCoverage territories={displayTerritories} agent={displayAgent} />

                {/* Notícias Locais */}
                <AgentLocalNews publications={publications} />

                {/* Eventos Divulgados */}
                <AgentEventsHighlight agent={displayAgent} />

                {/* Conteúdos em Alta */}
                <AgentTrendingContent publications={publications} />

                {/* Feed Editorial Completo */}
                <AgentEditorialFeed publications={publications} agent={displayAgent} />

                {/* Galeria Multimídia */}
                <AgentMultimediaGallery agent={displayAgent} />

                {/* Agenda Cultural */}
                <AgentCulturalAgenda agent={displayAgent} />

                {/* Alertas Comunitários */}
                <AgentCommunityAlerts agent={displayAgent} />

                {/* Comunidades Cobertas */}
                <AgentCoveredCommunities territories={displayTerritories} />

                {/* Parceiros e Patrocinadores */}
                <AgentPartnersSponsors agent={displayAgent} />

              </main>

              {/* Sidebar - Widgets Territoriais */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="lg:sticky lg:top-6 space-y-6">
                  
                  {/* Sobre o Agente */}
                  <AgentSidebarAbout agent={displayAgent} />

                  {/* Contato e CTAs */}
                  <AgentSidebarContact agent={displayAgent} />

                  {/* Informações Territoriais */}
                  <AgentSidebarTerritorial territories={displayTerritories} />

                  {/* Atividade Recente */}
                  <AgentSidebarActivity agent={displayAgent} />

                  {/* Redes Sociais */}
                  <AgentSidebarSocial agent={displayAgent} />

                  {/* Newsletter */}
                  <AgentSidebarNewsletter agent={displayAgent} />

                </div>
              </aside>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
