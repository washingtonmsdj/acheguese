import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { communicationTerritorialGateway } from "../../services";
import { resolveAgentPageDisplayData } from "../mocks/agentPageFallback";

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
  AgentEditorialFeed,
} from "../agent-page/sections/AgentLocalNews";
import { AgentPublicationComposer } from "../agent-page/composer/AgentPublicationComposer";
import { AgentSidebarAbout } from "../agent-page/sidebar/AgentSidebarAbout";
import { AgentSidebarContact } from "../agent-page/sidebar/AgentSidebarContact";
import {
  AgentSidebarTerritorial,
  AgentSidebarActivity,
  AgentSidebarSocial,
  AgentSidebarNewsletter,
} from "../agent-page/sidebar/AgentSidebarTerritorial";

export default function CommunicationAgentPageV2() {
  const { channelSlug = "" } = useParams();
  const { user } = useSessionContext();

  const { data, isLoading } = useQuery({
    queryKey: ["communication-agent-v2", channelSlug],
    queryFn: () => communicationTerritorialGateway.getChannelPublicPage(channelSlug),
    retry: false,
  });

  const agent = data?.channel;
  const publications = data?.publications ?? [];
  const territories = data?.territories ?? [];
  const isChannelManager = user && agent && agent.profile_id === user.id;

  const { useMockData, displayAgent, displayTerritories } = resolveAgentPageDisplayData({
    agent,
    territories,
    isLoading,
    channelSlug,
  });

  return (
    <>
      <Helmet>
        <title>{agent?.public_name ?? "Agente de Comunicacao"} | Portal Territorial | Achegue-se</title>
        <meta
          name="description"
          content={agent?.description ?? "Hub editorial territorial, midia comunitaria e portal local moderno"}
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={agent?.public_name ?? "Agente de Comunicacao"} />
        <meta property="og:description" content={agent?.description ?? ""} />
      </Helmet>

      {isLoading ? (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Carregando portal...</h2>
                <p className="text-sm text-muted-foreground">Preparando conteudo territorial</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !agent && !useMockData ? (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">Portal nao encontrado</h1>
                <p className="text-lg text-muted-foreground">
                  O agente de comunicacao que voce procura nao existe ou esta temporariamente indisponivel.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/comunicacao"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Explorar Comunicacao Territorial
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {displayAgent || useMockData ? (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
          {useMockData ? (
            <div className="bg-amber-50 border-b border-amber-200">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <span className="font-semibold">Modo Demonstracao:</span>
                  <span>Exibindo dados de exemplo. O canal "{channelSlug}" nao foi encontrado no banco de dados.</span>
                </div>
              </div>
            </div>
          ) : null}

          <AgentHeroSection
            agent={displayAgent}
            territories={displayTerritories}
            isChannelManager={isChannelManager}
          />

          <AgentStatsBar agent={displayAgent} publications={publications} territories={displayTerritories} />

          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <main className="lg:col-span-8 space-y-6 sm:space-y-8">
                {isChannelManager && agent ? (
                  <AgentPublicationComposer channel={agent} territories={displayTerritories} />
                ) : null}

                <AgentWeekHighlights publications={publications} />
                <AgentLatestPublications publications={publications} agent={displayAgent} />
                <AgentActiveCoverage territories={displayTerritories} agent={displayAgent} />
                <AgentLocalNews publications={publications} />
                <AgentEventsHighlight agent={displayAgent} />
                <AgentTrendingContent publications={publications} />
                <AgentEditorialFeed publications={publications} agent={displayAgent} />
                <AgentMultimediaGallery agent={displayAgent} />
                <AgentCulturalAgenda agent={displayAgent} />
                <AgentCommunityAlerts agent={displayAgent} />
                <AgentCoveredCommunities territories={displayTerritories} />
                <AgentPartnersSponsors agent={displayAgent} />
              </main>

              <aside className="lg:col-span-4 space-y-6">
                <div className="lg:sticky lg:top-6 space-y-6">
                  <AgentSidebarAbout agent={displayAgent} />
                  <AgentSidebarContact agent={displayAgent} />
                  <AgentSidebarTerritorial territories={displayTerritories} />
                  <AgentSidebarActivity agent={displayAgent} />
                  <AgentSidebarSocial agent={displayAgent} />
                  <AgentSidebarNewsletter agent={displayAgent} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
