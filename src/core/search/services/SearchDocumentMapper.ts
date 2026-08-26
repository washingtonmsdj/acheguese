import { BusinessUrlService } from "@/core/business";
import type { Business } from "@/core/business/types/Business";
import type { ClassifiedData } from "@/core/classifieds/services";
import type { CommunitySearchResult } from "@/core/community-experience/types";
import type { Post } from "@/core/posts/types";
import type { Professional } from "@/core/professional/types";
import { buildCommunityPortalUrl } from "@/core/routing/policies";
import type { PublicEvent } from "@/core/community-events";
import type { SearchDocument } from "./SearchService";

export type ProfessionalSearchDocumentInput = Professional & {
  target_url?: string | null;
};

export type ClassifiedSearchDocumentInput = Pick<
  ClassifiedData,
  | "id"
  | "title"
  | "description"
  | "price"
  | "category"
  | "photos"
  | "public_id"
  | "created_at"
> & {
  territory: Pick<ClassifiedData["territory"], "name">;
  condition?: ClassifiedData["condition"];
  target_url?: string | null;
};

export type EventSearchDocumentInput = PublicEvent & {
  target_url: string;
};

export type PostSearchDocumentInput = Post & {
  target_url?: string | null;
};

export interface OpportunitySearchDocumentInput {
  id: string;
  headline: string;
  professional_category: string;
  opportunity_type: string;
  territory_name: string | null;
  urgency: string;
  availability_notes: string | null;
  professional_id: string | null;
  target_url: string;
  published_at?: string | null;
  created_at?: string | null;
}

function safeBusinessUrl(business: Business): string | null {
  if (!business.slug || !business.geographic_path) return null;

  try {
    return BusinessUrlService.getCanonicalUrl({
      id: business.profile_id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
  } catch {
    return null;
  }
}

export function truncateSearchDescription(
  value: string | null | undefined,
  maxLength = 180,
): string | null {
  const text = value?.trim();
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

export function communityToSearchDocument(
  community: CommunitySearchResult,
): SearchDocument {
  return {
    id: community.id,
    type: "community",
    title: community.name,
    subtitle: "Comunidade",
    description: community.headline ?? community.description,
    url: buildCommunityPortalUrl(community.public_alias ?? community.slug),
    metadata: {
      status: community.status,
      territory_type: community.territory_type,
      territory_id: community.territory_id,
      is_featured: community.is_featured,
    },
  };
}

export function businessToSearchDocument(business: Business): SearchDocument {
  return {
    id: business.id,
    type: "business",
    title: business.name,
    subtitle: business.category,
    description: truncateSearchDescription(business.description),
    imageUrl: business.logo_url,
    url: safeBusinessUrl(business),
    territoryLabel: business.location?.name ?? business.business_city ?? business.business_state,
    createdAt: business.created_at,
    metadata: {
      rating: business.rating,
      total_reviews: business.total_reviews,
      is_premium: business.is_premium,
      is_verified: business.is_verified,
    },
  };
}

export function professionalToSearchDocument(
  professional: ProfessionalSearchDocumentInput,
): SearchDocument {
  return {
    id: professional.professional_data_id,
    type: "professional",
    title: professional.name,
    subtitle: professional.category,
    description: truncateSearchDescription(professional.description),
    imageUrl: professional.logo_url,
    url: professional.target_url ?? null,
    territoryLabel: professional.neighborhood ?? professional.city,
    createdAt: professional.created_at,
    metadata: {
      rating: professional.rating,
      total_reviews: professional.total_reviews,
      is_verified: professional.is_verified,
      is_accepting_clients: professional.is_accepting_clients,
    },
  };
}

export function opportunityToSearchDocument(
  opportunity: OpportunitySearchDocumentInput,
): SearchDocument {
  return {
    id: opportunity.id,
    type: "opportunity",
    title: opportunity.headline,
    subtitle: opportunity.professional_category,
    description: opportunity.availability_notes,
    url: opportunity.target_url,
    territoryLabel: opportunity.territory_name,
    createdAt: opportunity.published_at ?? opportunity.created_at,
    metadata: {
      opportunity_type: opportunity.opportunity_type,
      urgency: opportunity.urgency,
      professional_id: opportunity.professional_id,
    },
  };
}

export function classifiedToSearchDocument(
  classified: ClassifiedSearchDocumentInput,
): SearchDocument {
  return {
    id: classified.id,
    type: "classified",
    title: classified.title,
    subtitle: classified.category,
    description: truncateSearchDescription(classified.description),
    imageUrl: classified.photos[0] ?? null,
    url: classified.target_url ?? null,
    territoryLabel: classified.territory.name,
    createdAt: classified.created_at,
    metadata: {
      price: classified.price,
      condition: classified.condition,
      public_id: classified.public_id,
    },
  };
}

export function eventToSearchDocument(event: EventSearchDocumentInput): SearchDocument {
  return {
    id: event.id,
    type: "event",
    title: event.title,
    subtitle: event.category,
    description: truncateSearchDescription(event.description),
    imageUrl: event.image_url,
    url: event.target_url,
    territoryLabel: event.neighborhood ?? event.city ?? event.location,
    createdAt: event.published_at ?? event.created_at,
    metadata: {
      date: event.date,
      status: event.status,
      is_free: event.is_free,
      current_participants: event.current_participants,
    },
  };
}

export function postToSearchDocument(post: PostSearchDocumentInput): SearchDocument {
  return {
    id: post.id,
    type: "post",
    title: truncateSearchDescription(post.content, 80) ?? "Post",
    subtitle: post.type,
    description: truncateSearchDescription(post.content),
    imageUrl: post.image_url,
    url: post.target_url ?? null,
    territoryLabel: post.location?.name,
    createdAt: post.created_at,
    metadata: {
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      reach: post.reach,
    },
  };
}
