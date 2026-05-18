export interface AgentMockStats {
  followers?: number;
  views?: number;
  engagement?: number;
}

export type AgentChannelView = {
  id: string;
  slug: string;
  public_name: string;
  description?: string;
  metadata?: {
    social_links?: {
      instagram?: string;
      facebook?: string;
    };
    mock_stats?: AgentMockStats;
  } | null;
} & Record<string, unknown>;

export type AgentTerritoryView = Record<string, unknown> & {
  id: string;
  location_id?: string;
  location?: {
    name?: string;
    full_name?: string | null;
  };
};

export type AgentPublicationView = {
  id: string;
  title: string;
  image?: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  views?: number;
  comments?: number;
} & Record<string, unknown>;
