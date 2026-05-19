export interface AgentMockStats {
  followers?: number;
  views?: number;
  engagement?: number;
}

export type AgentChannelView = {
  id: string;
  profile_id: string;
  slug: string;
  public_name: string;
  description?: string | null;
  channel_kind: string;
  status: string;
  verification_status: string;
  reliability_score: number;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    social_links?: {
      instagram?: string;
      facebook?: string;
    };
    mock_stats?: AgentMockStats;
  } | null;
};

export type AgentTerritoryView = {
  id: string;
  channel_id?: string;
  location_id?: string;
  territory_role?: string;
  can_publish?: boolean;
  can_alert?: boolean;
  can_push?: boolean;
  approved_by_user_id?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
  location?: {
    id?: string;
    name?: string;
    full_name?: string | null;
    slug?: string;
    type?: string;
    parent_id?: string | null;
  };
};

export type AgentPublicationView = {
  id: string;
  title: string;
  image?: string;
  excerpt?: string;
  summary?: string | null;
  body?: string | null;
  category?: string;
  publication_type?: string | null;
  publishedAt?: string;
  published_at?: string | null;
  views?: number;
  comments?: number;
  created_at?: string;
  updated_at?: string;
};
