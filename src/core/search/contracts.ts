import type { Business } from "@/core/business/types/Business";
import type { ClassifiedData } from "@/core/classifieds/services";
import type {
  CommunityEntityType,
  CommunitySearchResult,
} from "@/core/community-experience/types";
import type { TerritoryFilter } from "@/core/location/types";
import type { Post } from "@/core/posts/types";
import type { Professional } from "@/core/professional/types";
import type { PublicEvent } from "@/core/verticals/events";

export type SearchCategory =
  | "all"
  | "communities"
  | "businesses"
  | "professionals"
  | "opportunities"
  | "classifieds"
  | "events"
  | "posts"
  | "coupons";

export type SearchBucket = Exclude<SearchCategory, "all" | "coupons">;

export type SearchDocumentType =
  | "community"
  | "business"
  | "professional"
  | "opportunity"
  | "classified"
  | "event"
  | "post"
  | "coupon";

export interface SearchFilters {
  category?: SearchCategory;
  city?: string;
  neighborhood?: string;
  minRating?: number;
  territoryFilter?: TerritoryFilter;
  communityId?: string | null;
}

export interface SearchRequestOptions {
  signal?: AbortSignal;
}

export type SearchHistoryScope =
  | "global"
  | `community:${string}`
  | `territory:${string}`;

export interface SearchDocument {
  id: string;
  type: SearchDocumentType;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  territoryLabel?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WorkOpportunitySearchResult {
  id: string;
  headline: string;
  professional_category: string;
  opportunity_type: string;
  territory_name: string | null;
  urgency: string;
  availability_notes: string | null;
  professional_id: string | null;
  professional_name: string | null;
  post_id: string | null;
  source_kind: "work_opportunity" | "vaga";
  target_url: string;
  company_name?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}

export type ProfessionalSearchResult = Professional & {
  target_url: string | null;
};

export type ClassifiedSearchResult = ClassifiedData & {
  target_url: string | null;
};

export type EventSearchResult = PublicEvent & {
  target_url: string;
};

export type PostSearchResult = Post & {
  target_url: string | null;
};

export interface SearchResults {
  documents: SearchDocument[];
  communities: CommunitySearchResult[];
  businesses: Business[];
  professionals: ProfessionalSearchResult[];
  opportunities: WorkOpportunitySearchResult[];
  classifieds: ClassifiedSearchResult[];
  events: EventSearchResult[];
  posts: PostSearchResult[];
  coupons: Record<string, unknown>[];
  total: number;
}

export type SearchLinkedEntityType = Extract<
  CommunityEntityType,
  "business" | "professional" | "classified" | "event" | "post"
>;

export type CommunityLinkedEntityIds = Partial<
  Record<SearchLinkedEntityType, ReadonlySet<string>>
>;

export type SearchProviderPayload = Partial<
  Pick<SearchResults, SearchBucket>
>;

export interface SearchProviderInput {
  query: string;
  filters: SearchFilters;
  linkedEntityIds: CommunityLinkedEntityIds;
  signal?: AbortSignal;
}

export interface SearchProviderResult {
  bucket: SearchBucket;
  documents: SearchDocument[];
  payload: SearchProviderPayload;
}

export interface SearchProvider {
  bucket: SearchBucket;
  linkedEntityTypes: readonly SearchLinkedEntityType[];
  isEnabled(): boolean;
  search(input: SearchProviderInput): Promise<SearchProviderResult>;
}
