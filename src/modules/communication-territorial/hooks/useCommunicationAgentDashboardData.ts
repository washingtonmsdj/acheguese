import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services";
import { nordesteAgents, portalNordesteMock } from "../v2/mocks";

export function useCommunicationAgentDashboardData(channelSlug?: string) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["communication-dashboard-v2", "channels"],
    queryFn: async () => {
      const realChannels = await communicationTerritorialGateway.listManagedChannels();
      if (!realChannels || realChannels.length === 0) {
        return nordesteAgents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          slug: agent.id,
          type: agent.type,
          territory: agent.territory,
          verified: agent.verified,
          followers: agent.followers,
          avatar: agent.avatar,
          description: agent.description,
          socialLinks: agent.socialLinks,
        }));
      }
      return realChannels;
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

  const { data: territories } = useQuery({
    queryKey: ["communication-dashboard-v2", "territories", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const realTerritories = await communicationTerritorialGateway.listAuthorizedTerritories(selectedChannelId);
      if (!realTerritories || realTerritories.length === 0) {
        return portalNordesteMock.coverageAreas.map((area) => ({
          id: area.id,
          name: area.name,
          type: area.type,
          description: area.description,
        }));
      }
      return realTerritories;
    },
    enabled: !!selectedChannelId,
  });

  const { data: publications } = useQuery({
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
          .map((pub) => ({
            ...pub,
            status: "published",
            channelId: selectedChannelId,
          }));
      }
      return realPubs;
    },
    enabled: !!selectedChannelId,
  });

  const { data: drafts } = useQuery({
    queryKey: ["communication-dashboard-v2", "drafts", selectedChannelId],
    queryFn: () =>
      communicationTerritorialGateway.listPublications({
        channelId: selectedChannelId!,
        status: "draft",
        limit: 20,
      }),
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

