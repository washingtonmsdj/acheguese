import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services";
import { nordesteAgents, portalNordesteMock } from "../v2/mocks";
import type {
  DashboardChannelView,
  DashboardPublicationView,
  DashboardTerritoryView,
} from "../v2/types/agentDashboardViewModels";

export function useCommunicationAgentDashboardData(channelSlug?: string) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const { data: channels, isLoading: channelsLoading } = useQuery<DashboardChannelView[]>({
    queryKey: ["communication-dashboard-v2", "channels"],
    queryFn: async () => {
      const realChannels = await communicationTerritorialGateway.listManagedChannels();
      if (!realChannels || realChannels.length === 0) {
        return nordesteAgents.map((agent): DashboardChannelView => ({
          id: agent.id,
          public_name: agent.name,
          name: agent.name,
          slug: agent.id,
          description: agent.description,
          verification_status: agent.verified ? "verified" : "unverified",
        }));
      }
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
    queryKey: ["communication-dashboard-v2", "channel", selectedChannelId],
    queryFn: () => {
      if (!selectedChannelId) return null;
      const channel = channels?.find((c) => c.id === selectedChannelId);
      if (!channel) return null;
      return communicationTerritorialGateway.getChannelPublicPage(channel.slug);
    },
    enabled: !!selectedChannelId && !!channels,
  });

  const { data: territories } = useQuery<DashboardTerritoryView[]>({
    queryKey: ["communication-dashboard-v2", "territories", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const realTerritories = await communicationTerritorialGateway.listAuthorizedTerritories(selectedChannelId);
      if (!realTerritories || realTerritories.length === 0) {
        return portalNordesteMock.coverageAreas.map((area): DashboardTerritoryView => ({
          id: area.id,
          name: area.name,
          city: "",
          state: "",
        }));
      }
      return realTerritories.map(
        (territory): DashboardTerritoryView => ({
          id: territory.id,
          name: territory.location?.name,
          city: "",
          state: "",
        }),
      );
    },
    enabled: !!selectedChannelId,
  });

  const { data: publications } = useQuery<DashboardPublicationView[]>({
    queryKey: ["communication-dashboard-v2", "publications", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const realPubs = await communicationTerritorialGateway.listPublications({
        channelId: selectedChannelId,
        status: "published",
        limit: 50,
      });
      if (!realPubs || realPubs.length === 0) {
        return portalNordesteMock.allPublications
          .filter((pub) => pub.author.id === selectedChannelId)
          .map((pub): DashboardPublicationView => ({
            id: pub.id,
            title: pub.title,
            content: pub.excerpt,
            media_url: pub.image,
            created_at: pub.publishedAt,
            updated_at: pub.publishedAt,
            status: "published",
          }));
      }
      return realPubs.map(
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
    queryKey: ["communication-dashboard-v2", "drafts", selectedChannelId],
    queryFn: async () => {
      const rawDrafts = await communicationTerritorialGateway.listPublications({
        channelId: selectedChannelId!,
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

  const selectedChannel = channels?.find((c) => c.id === selectedChannelId);
  const isLoading = channelsLoading || channelLoading;

  useEffect(() => {
    if (!channels || channels.length === 0) return;

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
