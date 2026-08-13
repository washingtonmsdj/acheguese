export type WorkOpportunityType =
  | "looking_for_work"
  | "offering_work"
  | "freelance"
  | "quick_job"
  | "service_availability";

export type WorkOpportunityStatus =
  | "active"
  | "paused"
  | "filled"
  | "expired"
  | "cancelled";

export type WorkOpportunityVisibility =
  | "public_listed"
  | "public_unlisted"
  | "private";

export type WorkOpportunityUrgency = "hoje" | "24h" | "semana" | "flexivel";

export type WorkOpportunityReach = "street" | "neighborhood" | "city";

export interface WorkOpportunity {
  id: string;
  author_profile_id: string;
  author_user_id?: string | null;
  professional_id?: string | null;
  opportunity_type: WorkOpportunityType;
  headline: string;
  description: string;
  professional_category: string;
  territory_location_id: string;
  reach: WorkOpportunityReach;
  urgency: WorkOpportunityUrgency;
  availability_notes?: string | null;
  compensation_notes?: string | null;
  contact_notes?: string | null;
  visibility: WorkOpportunityVisibility;
  status: WorkOpportunityStatus;
  post_id?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  closed_at?: string | null;
}

export interface WorkOpportunityCreateInput {
  authorProfileId: string;
  professionalId?: string | null;
  opportunityType: WorkOpportunityType;
  title: string;
  description: string;
  professionalCategory: string;
  territoryLocationId: string;
  urgency: WorkOpportunityUrgency;
  availabilityNotes?: string;
  compensationNotes?: string;
  contactNotes?: string;
  reach?: WorkOpportunityReach;
  visibility?: WorkOpportunityVisibility;
  distributionChannels?: string[];
  sourceContext?: string;
}

export interface WorkOpportunityFilters {
  territoryLocationId?: string;
  /** Conjunto territorial já resolvido (cidade com descendentes ou grupo). */
  territoryLocationIds?: readonly string[];
  professionalCategory?: string;
  opportunityType?: WorkOpportunityType;
  urgency?: WorkOpportunityUrgency;
  search?: string;
  territory?: string;
  availability?: string;
  visibility?: WorkOpportunityVisibility;
  limit?: number;
}

export interface OwnedProfessionalProfileSummary {
  id: string;
  professional_name: string | null;
  service_category: string | null;
  location_id: string | null;
  is_accepting_clients: boolean;
  visibility: WorkOpportunityVisibility;
  slug: string | null;
}

export interface WorkOpportunityCard {
  id: string;
  author_profile_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  professional_id: string | null;
  opportunity_type: WorkOpportunityType;
  headline: string;
  description: string;
  professional_category: string;
  territory_location_id: string;
  territory_name: string | null;
  urgency: WorkOpportunityUrgency;
  availability_notes: string | null;
  compensation_notes: string | null;
  contact_notes: string | null;
  visibility: WorkOpportunityVisibility;
  status: WorkOpportunityStatus;
  post_id: string | null;
  created_at: string;
  published_at: string | null;
  professional_slug: string | null;
  professional_name: string | null;
  service_category: string | null;
  lifecycle_state?: "active" | "expiring_soon" | "expired" | "resolved";
  is_recent?: boolean;
  hours_since_publish?: number;
  expires_at_estimated?: string | null;
  quality_score?: number;
  quality_factors?: {
    proximity: number;
    reputation: number;
    availability: number;
    recency: number;
  };
}

export interface WorkOpportunityProfessionalDetail {
  id: string;
  slug: string | null;
  public_url: string | null;
  professional_name: string | null;
  service_category: string | null;
  description: string | null;
  availability_notes: string | null;
  is_accepting_clients: boolean;
  visibility: WorkOpportunityVisibility;
  rating: number | null;
  total_reviews: number;
  portfolio_images: string[];
  portfolio_items: Array<{
    url: string;
    caption?: string;
    media_type?: "image" | "video" | "document";
    is_cover?: boolean;
  }>;
}

export interface WorkOpportunityRecentItem {
  id: string;
  professional_id: string | null;
  professional_name: string | null;
  professional_category: string;
  headline: string;
  opportunity_type: WorkOpportunityType;
  urgency: WorkOpportunityUrgency;
  status: WorkOpportunityStatus;
  visibility: WorkOpportunityVisibility;
  availability_notes: string | null;
  territory_location_id: string;
  territory_name: string | null;
  created_at: string;
  published_at: string | null;
}

export interface WorkOpportunityDetail extends WorkOpportunityCard {
  professional: WorkOpportunityProfessionalDetail | null;
  recent_opportunities: WorkOpportunityRecentItem[];
}
