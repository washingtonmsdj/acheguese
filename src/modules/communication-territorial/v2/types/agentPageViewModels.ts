import type {
  CommunicationChannel,
  CommunicationChannelTerritory,
  CommunicationPublication,
} from "../../types";

export interface AgentMockStats {
  followers?: number;
  views?: number;
  engagement?: number;
}

export type AgentChannelView = CommunicationChannel & {
  metadata?: {
    social_links?: {
      instagram?: string;
      facebook?: string;
    };
    mock_stats?: AgentMockStats;
  } | null;
};

export type AgentTerritoryView = CommunicationChannelTerritory;

export type AgentPublicationView = CommunicationPublication & {
  image?: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  views?: number;
  comments?: number;
};

