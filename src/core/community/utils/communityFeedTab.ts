import { isLaunchCommunityFeedChannelEnabled } from "@/app/config/launchScope";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";

export type CommunityMainTab = "feed" | "grupos";
export type CommunityFeedSortType = "recent" | "popular" | "most_commented";
export type CommunityFeedComposerActionId =
  | "text"
  | "media"
  | "poll"
  | "alert"
  | "file";
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

const RAW_COMMUNITY_FEED_HEADER_FILTERS: readonly CommunityFeedHeaderFilterOption[] =
  [
    { id: "para_voce", label: "Para voce" },
    { id: "empresas", label: "Empresas" },
  ] as const;

export const COMMUNITY_FEED_HEADER_FILTERS: readonly CommunityFeedHeaderFilterOption[] =
  RAW_COMMUNITY_FEED_HEADER_FILTERS.filter(({ id }) =>
    isLaunchCommunityFeedChannelEnabled(id),
  );

export const COMMUNITY_FEED_SORT_FILTERS: readonly CommunityFeedSortFilterOption[] =
  [
    { id: "popular", label: "Melhores" },
    { id: "recent", label: "Recentes" },
    { id: "most_commented", label: "Comentados" },
  ] as const;

const RAW_COMMUNITY_FEED_COMPOSER_ACTIONS: readonly CommunityFeedComposerActionOption[] =
  [
    { id: "text", label: "Texto" },
    { id: "media", label: "Foto/video" },
    { id: "poll", label: "Enquete" },
    { id: "alert", label: "Aviso" },
    { id: "file", label: "Arquivo" },
  ] as const;

export const COMMUNITY_FEED_COMPOSER_ACTIONS: readonly CommunityFeedComposerActionOption[] =
  RAW_COMMUNITY_FEED_COMPOSER_ACTIONS.filter(({ id }) =>
    id === "alert" ? isLaunchCommunityFeedChannelEnabled("alertas") : true,
  );

const COMMUNITY_TAB_TO_CHANNEL: Partial<
  Record<CommunityDiscoveryTab, TerritorialFeedChannel>
> = {
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
  const channel =
    COMMUNITY_TAB_TO_CHANNEL[tab as CommunityDiscoveryTab] ?? "para_voce";
  return isLaunchCommunityFeedChannelEnabled(channel) ? channel : "para_voce";
}

export function resolveCommunityFeedQueryTabFromChannel(
  channel: TerritorialFeedChannel,
): CommunityFeedQueryTab | null {
  if (!isLaunchCommunityFeedChannelEnabled(channel)) return null;
  if (channel === "para_voce") return null;
  if (channel === "alertas") return "alertas";
  if (channel === "empresas") return "empresas";
  if (channel === "eventos") return "eventos";
  if (channel === "oportunidades" || channel === "vagas")
    return "oportunidades";
  return null;
}
