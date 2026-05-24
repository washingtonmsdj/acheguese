import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCommunicationAgentDashboardData } from "../hooks";

import { DashboardHeader } from "../agent-dashboard/sections/DashboardHeader";
import { DashboardOverview } from "../agent-dashboard/sections/DashboardOverview";
import { DashboardQuickActions } from "../agent-dashboard/sections/DashboardQuickActions";
import { DashboardPublications } from "../agent-dashboard/sections/DashboardPublications";
import { DashboardDrafts } from "../agent-dashboard/sections/DashboardDrafts";
import { DashboardAnalytics } from "../agent-dashboard/sections/DashboardAnalytics";
import { DashboardTerritories } from "../agent-dashboard/sections/DashboardTerritories";
import { DashboardSchedule } from "../agent-dashboard/sections/DashboardSchedule";
import { DashboardTeam } from "../agent-dashboard/sections/DashboardTeam";

import { DashboardSidebarStats } from "../agent-dashboard/sidebar/DashboardSidebarStats";
import { DashboardSidebarActivity } from "../agent-dashboard/sidebar/DashboardSidebarActivity";
import { DashboardSidebarQuickLinks } from "../agent-dashboard/sidebar/DashboardSidebarQuickLinks";
import { DashboardSidebarHelp } from "../agent-dashboard/sidebar/DashboardSidebarHelp";
import type { DashboardChannelView, DashboardView } from "../types/agentDashboardViewModels";
import { communicationRoutes } from "@/modules/communication-territorial/routes/communicationRoutes";

const DASHBOARD_VIEWS: DashboardView[] = [
  "overview",
  "publications",
  "drafts",
  "analytics",
  "territories",
  "schedule",
  "team",
];

function parseDashboardView(view: string | null): DashboardView {
  return DASHBOARD_VIEWS.includes((view ?? "") as DashboardView) ? (view as DashboardView) : "overview";
}

export default function CommunicationAgentDashboard() {
  const { channelSlug } = useParams<{ channelSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = useMemo(() => parseDashboardView(searchParams.get("view")), [searchParams]);

  const handleViewChange = (view: DashboardView) => {
    const nextParams = new URLSearchParams(searchParams);

    if (view === "overview") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", view);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const {
    channels,
    channelsLoading,
    territories,
    publications,
    drafts,
    selectedChannel,
    selectedChannelId,
    setSelectedChannelId,
    isLoading,
  } = useCommunicationAgentDashboardData(channelSlug);
  const selectedChannelView = selectedChannel as DashboardChannelView | null;

  return (
    <>
      <Helmet>
        <title>Dashboard | Gestao de Comunicacao Territorial | Achegue-se</title>
        <meta name="description" content="Dashboard completo para gestao de canais de comunicacao territorial" />
      </Helmet>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-muted/30">
        <DashboardHeader
          channels={(channels ?? []) as never}
          selectedChannelId={selectedChannelId}
          onChannelSelect={setSelectedChannelId}
          isLoading={channelsLoading}
        />

        {!channelsLoading && (!channels || channels.length === 0) ? (
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">Nenhum canal encontrado</h1>
                <p className="text-lg text-muted-foreground">
                  Voce ainda nao gerencia nenhum canal de comunicacao territorial.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={communicationRoutes.request}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Solicitar Novo Canal
                </Link>
                <Link
                  to={communicationRoutes.home}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-background font-medium hover:bg-accent transition-colors"
                >
                  Explorar Comunicacao
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading && selectedChannelId ? (
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Carregando dashboard...</h2>
                <p className="text-sm text-muted-foreground">Preparando dados do canal</p>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && selectedChannelView ? (
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <DashboardQuickActions
              channel={selectedChannelView}
              activeView={activeView}
              onViewChange={handleViewChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6">
              <main className="lg:col-span-8 space-y-6">
                {activeView === "overview" ? (
                  <>
                    <DashboardOverview
                      channel={selectedChannel as never}
                      publications={(publications ?? []) as never}
                      territories={(territories ?? []) as never}
                      drafts={(drafts ?? []) as never}
                    />
                    <DashboardAnalytics channel={selectedChannel as never} publications={(publications ?? []) as never} />
                  </>
                ) : null}

                {activeView === "publications" ? (
                  <DashboardPublications
                    channel={selectedChannel as never}
                    publications={(publications ?? []) as never}
                    territories={(territories ?? []) as never}
                  />
                ) : null}

                {activeView === "drafts" ? (
                  <DashboardDrafts
                    channel={selectedChannel as never}
                    drafts={(drafts ?? []) as never}
                    territories={(territories ?? []) as never}
                  />
                ) : null}

                {activeView === "analytics" ? (
                  <DashboardAnalytics channel={selectedChannel as never} publications={(publications ?? []) as never} />
                ) : null}

                {activeView === "territories" ? (
                  <DashboardTerritories channel={selectedChannel as never} territories={(territories ?? []) as never} />
                ) : null}

                {activeView === "schedule" ? (
                  <DashboardSchedule channel={selectedChannel as never} publications={(publications ?? []) as never} />
                ) : null}

                {activeView === "team" ? <DashboardTeam channel={selectedChannel as never} /> : null}
              </main>

              <aside className="lg:col-span-4 space-y-6">
                <div className="lg:sticky lg:top-6 space-y-6">
                  <DashboardSidebarStats
                    channel={selectedChannel as never}
                    publications={(publications ?? []) as never}
                    territories={(territories ?? []) as never}
                  />
                  <DashboardSidebarActivity
                    channel={selectedChannelView}
                    publications={[...(publications ?? []), ...(drafts ?? [])]}
                  />
                  <DashboardSidebarQuickLinks channel={selectedChannel as never} />
                  <DashboardSidebarHelp />
                </div>
              </aside>
            </div>
          </div>
        ) : null}

        {!isLoading && channels && channels.length > 0 && !selectedChannel ? (
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">Canal indisponivel</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Nao foi possivel abrir este canal. Selecione outro canal no topo para continuar.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

