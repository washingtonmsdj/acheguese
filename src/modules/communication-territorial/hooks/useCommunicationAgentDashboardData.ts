import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services";
import type {
  DashboardChannelView,
  DashboardPublicationView,
  DashboardTerritoryView,
} from "../types/agentDashboardViewModels";

const communicationDashboardQueryKey = "communication-dashboard";

export function useCommunicationAgentDashboardData(channelSlug?: string) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const { data: channels, isLoading: channelsLoading } = useQuery<DashboardChannelView[]>({
    queryKey: [communicationDashboardQueryKey, "channels"],
    queryFn: async () => {
      const realChannels = await communicationTerritorialGateway.listManagedChannels();
      return realChannels.map(
        (channel): DashboardChannelView => ({
          id: channel.id,
          slug: channel.slug,
          public_name: channel.public_name,
          verification_status: channel.verification_status,
          description: channel.description,
        }),
      );
    },
  });

  const { data: channelData, isLoading: channelLoading } = useQuery({
    queryKey: [communicationDashboardQueryKey, "channel", selectedChannelId],
    queryFn: () => {
      if (!selectedChannelId) return null;
      const channel = channels?.find((item) => item.id === selectedChannelId);
      if (!channel) return null;
      return communicationTerritorialGateway.getChannelPublicPage(channel.slug);
    },
    enabled: !!selectedChannelId && !!channels,
  });

  const { data: territories } = useQuery<DashboardTerritoryView[]>({
    queryKey: [communicationDashboardQueryKey, "territories", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const realTerritories = await communicationTerritorialGateway.listAuthorizedTerritories(selectedChannelId);
      return realTerritories.map(
        (territory): DashboardTerritoryView => ({
          id: territory.id,
          name: territory.location?.name ?? "Território",
          city: "",
          state: "",
        }),
      );
    },
    enabled: !!selectedChannelId,
  });

  const { data: publications } = useQuery<DashboardPublicationView[]>({
    queryKey: [communicationDashboardQueryKey, "publications", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const realPublications = await communicationTerritorialGateway.listPublications({
        channelId: selectedChannelId,
        status: "published",
        limit: 50,
      });
      return realPublications.map(
        (publication): DashboardPublicationView => ({
          id: publication.id,
          title: publication.title,
          content: publication.body,
          created_at: publication.created_at,
          updated_at: publication.updated_at,
          status: publication.status,
        }),
      );
    },
    enabled: !!selectedChannelId,
  });

  const { data: drafts } = useQuery<DashboardPublicationView[]>({
    queryKey: [communicationDashboardQueryKey, "drafts", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const rawDrafts = await communicationTerritorialGateway.listPublications({
        channelId: selectedChannelId,
        status: "draft",
        limit: 20,
      });
      return rawDrafts.map(
        (draft): DashboardPublicationView => ({
          id: draft.id,
          title: draft.title,
          content: draft.body,
          created_at: draft.created_at,
          updated_at: draft.updated_at,
          status: draft.status,
        }),
      );
    },
    enabled: !!selectedChannelId,
  });

  const selectedChannel = channels?.find((channel) => channel.id === selectedChannelId);
  const isLoading = channelsLoading || channelLoading;

  useEffect(() => {
    if (!channels || channels.length === 0) {
      setSelectedChannelId(null);
      return;
    }

    if (!selectedChannelId && channelSlug) {
      const matchedChannel = channels.find((channel) => channel.slug === channelSlug);
      if (matchedChannel) {
        setSelectedChannelId(matchedChannel.id);
        return;
      }
    }

    const selectedStillExists = selectedChannelId
      ? channels.some((channel) => channel.id === selectedChannelId)
      : false;

    if (!selectedStillExists) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, channelSlug, selectedChannelId]);

  return {
    channels,
    channelsLoading,
    channelData,
    territories,
    publications,
    drafts,
    selectedChannel,
    selectedChannelId,
    setSelectedChannelId,
    isLoading,
  };
}
