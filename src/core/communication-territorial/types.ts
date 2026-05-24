export type ChannelKind =
  | "tv_bairro"
  | "radio"
  | "portal"
  | "collective"
  | "newspaper"
  | "public_utility"
  | "other";

export type ChannelStatus =
  | "pending_verification"
  | "active"
  | "restricted"
  | "suspended"
  | "rejected";

export type VerificationStatus = "unverified" | "verified" | "revoked";

export type PublicationType =
  | "news"
  | "coverage"
  | "event"
  | "job"
  | "public_utility"
  | "report";

export type PublicationStatus =
  | "draft"
  | "published"
  | "under_review"
  | "removed"
  | "retracted";

export type CommunicationContentFormat = "article" | "update";

export type CommunicationDistributionTarget =
  | "communication_hub"
  | "community_tab"
  | "contextual_feed";

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface CommunicationLocation {
  id: string;
  name: string;
  full_name?: string | null;
  slug: string;
  type: string;
  parent_id?: string | null;
}

export interface CommunicationChannelRequest {
  id: string;
  requester_user_id: string;
  requested_profile_id?: string | null;
  public_name: string;
  channel_kind: ChannelKind;
  description: string;
  website_url?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  requested_location_id: string;
  status: RequestStatus;
  admin_notes?: string | null;
  reviewed_by_user_id?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationChannel {
  id: string;
  profile_id: string;
  public_name: string;
  legal_name?: string | null;
  slug: string;
  channel_kind: ChannelKind;
  description: string;
  website_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status: ChannelStatus;
  verification_status: VerificationStatus;
  reliability_score: number;
  alert_cooldown_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationChannelTerritory {
  id: string;
  channel_id: string;
  location_id: string;
  territory_role: "primary" | "coverage" | "temporary";
  can_publish: boolean;
  can_alert: boolean;
  can_push: boolean;
  approved_by_user_id?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  location?: CommunicationLocation;
}

export interface CommunicationPublication {
  id: string;
  channel_id: string;
  author_profile_id: string;
  location_id: string;
  publication_type: PublicationType;
  content_format: CommunicationContentFormat;
  title: string;
  summary?: string | null;
  body: string;
  source_url?: string | null;
  media: Record<string, unknown>;
  status: PublicationStatus;
  trust_label: string;
  published_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  channel?: CommunicationChannel;
  location?: CommunicationLocation;
}

export interface CommunicationPublicationDistribution {
  id: string;
  publication_id: string;
  channel_id: string;
  location_id: string;
  target_type: CommunicationDistributionTarget;
  is_active: boolean;
  relevance_score: number;
  rank_score: number;
  rank_reason: string;
  created_at: string;
  updated_at: string;
  publication?: CommunicationPublication;
  channel?: CommunicationChannel;
  location?: CommunicationLocation;
}

export interface CommunicationAuditEntry {
  id: string;
  channel_id?: string | null;
  request_id?: string | null;
  actor_user_id?: string | null;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RequestCommunicationChannelInput {
  requested_profile_id?: string | null;
  public_name: string;
  channel_kind: ChannelKind;
  description: string;
  website_url?: string;
  contact_email: string;
  contact_phone?: string;
  requested_location_id: string;
}

export interface CreateCommunicationPublicationInput {
  channel_id: string;
  location_id: string;
  publication_type: PublicationType;
  content_format?: CommunicationContentFormat;
  title: string;
  summary?: string;
  body: string;
  source_url?: string;
  media?: Record<string, unknown>;
}

export interface CommunicationHubData {
  channels: CommunicationChannel[];
  publications: CommunicationPublication[];
  locations: CommunicationLocation[];
  title: string;
}

export const CHANNEL_KIND_LABELS: Record<ChannelKind, string> = {
  tv_bairro: "TV de bairro",
  radio: "Radio",
  portal: "Portal",
  collective: "Coletivo",
  newspaper: "Jornal local",
  public_utility: "Utilidade publica",
  other: "Outro",
};

export const PUBLICATION_TYPE_LABELS: Record<PublicationType, string> = {
  news: "Noticia",
  coverage: "Cobertura",
  event: "Evento",
  job: "Vaga",
  public_utility: "Utilidade publica",
  report: "Denuncia",
};

export const COMMUNICATION_CONTENT_FORMAT_LABELS: Record<CommunicationContentFormat, string> = {
  article: "Materia/reportagem",
  update: "Postagem simples",
};
