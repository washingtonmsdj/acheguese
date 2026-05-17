import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";

export type CommunityMainTab = "feed" | "grupos";
export type CommunityFeedSortType = "recent" | "popular" | "most_commented";
export type CommunityFeedComposerActionId = "text" | "media" | "poll" | "alert" | "file";
export type CommunityFeedQueryTab =
  | "para_voce"
  | "alertas"
  | "empresas"
  | "eventos"
  | "oportunidades"
  | "vagas";

export type CommunityDiscoveryTab = CommunityMainTab | CommunityFeedQueryTab;

export interface CommunityFeedHeaderFilterOption {
  id: TerritorialFeedChannel;
  label: string;
}

export interface CommunityFeedSortFilterOption {
  id: CommunityFeedSortType;
  label: string;
}

export interface CommunityFeedComposerActionOption {
  id: CommunityFeedComposerActionId;
  label: string;
}

export const COMMUNITY_FEED_HEADER_FILTERS: readonly CommunityFeedHeaderFilterOption[] = [
  { id: "para_voce", label: "Para voce" },
  { id: "alertas", label: "Alertas" },
  { id: "empresas", label: "Empresas" },
  { id: "eventos", label: "Eventos" },
  { id: "oportunidades", label: "Oportunidades" },
] as const;

export const COMMUNITY_FEED_SORT_FILTERS: readonly CommunityFeedSortFilterOption[] = [
  { id: "recent", label: "Recentes" },
  { id: "popular", label: "Em alta" },
  { id: "most_commented", label: "Comentados" },
] as const;

export const COMMUNITY_FEED_COMPOSER_ACTIONS: readonly CommunityFeedComposerActionOption[] = [
  { id: "text", label: "Texto" },
  { id: "media", label: "Foto/video" },
  { id: "poll", label: "Enquete" },
  { id: "alert", label: "Aviso" },
  { id: "file", label: "Arquivo" },
] as const;

const COMMUNITY_TAB_TO_CHANNEL: Partial<Record<CommunityDiscoveryTab, TerritorialFeedChannel>> = {
  para_voce: "para_voce",
  alertas: "alertas",
  empresas: "empresas",
  eventos: "eventos",
  oportunidades: "oportunidades",
  vagas: "oportunidades",
};

export function resolveCommunityFeedChannelFromTab(
  tab: string | null | undefined,
): TerritorialFeedChannel {
  if (!tab) return "para_voce";
  return COMMUNITY_TAB_TO_CHANNEL[tab as CommunityDiscoveryTab] ?? "para_voce";
}

export function resolveCommunityFeedQueryTabFromChannel(
  channel: TerritorialFeedChannel,
): CommunityFeedQueryTab | null {
  if (channel === "para_voce") return null;
  if (channel === "alertas") return "alertas";
  if (channel === "empresas") return "empresas";
  if (channel === "eventos") return "eventos";
  if (channel === "oportunidades" || channel === "vagas") return "oportunidades";
  return null;
}
