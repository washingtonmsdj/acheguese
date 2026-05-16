import type { AgentChannelView, AgentTerritoryView } from "../types/agentPageViewModels";

export function resolveAgentPageDisplayData(options: {
  agent?: AgentChannelView | null;
  territories: AgentTerritoryView[];
  isLoading: boolean;
  channelSlug: string;
}) {
  const { agent, territories, isLoading, channelSlug } = options;
  const useMockData = !isLoading && !agent;

  const mockAgent: AgentChannelView | null = useMockData
    ? {
        id: "00000000-0000-0000-0000-000000000001",
        profile_id: "00000000-0000-0000-0000-000000000002",
        public_name: "Portal Nordeste",
        slug: channelSlug,
        description:
          "Portal de noticias e comunicacao territorial do Nordeste de Amaralina. Conectando comunidades, informando moradores e fortalecendo a identidade local.",
        channel_kind: "portal" as const,
        verification_status: "verified" as const,
        reliability_score: 95,
        status: "active" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contact_email: "contato@portalnordeste.com.br",
        contact_phone: null,
        website_url: "https://portalnordeste.com.br",
        metadata: {
          social_links: {
            instagram: "@portalnordeste",
            facebook: "portalnordeste",
          },
          mock_stats: {
            followers: 12500,
            views: 45200,
            engagement: 3800,
          },
        },
      }
    : agent;

  const mockTerritories: AgentTerritoryView[] = useMockData
    ? [
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
          },
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
          },
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
          },
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
          },
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
            name: "Calabetao",
            full_name: "Calabetao, Salvador, BA",
            slug: "calabetao",
            type: "neighborhood" as const,
            parent_id: null,
          },
        },
      ] as AgentTerritoryView[]
    : territories;

  return {
    useMockData,
    displayAgent: mockAgent,
    displayTerritories: mockTerritories,
  };
}
