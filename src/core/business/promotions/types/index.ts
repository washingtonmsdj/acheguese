/**
 * Canonical sponsored ads types.
 *
 * Sponsored ads are targeted by canonical location_id values. Business identity
 * stays in business_data; campaigns only reference it through owner_business_id.
 */

export type AdCampaignStatus = "active" | "paused" | "ended";

export type AdCampaignReviewStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "archived";

export type AdCampaignBillingStatus =
  | "unpaid"
  | "authorized"
  | "paid"
  | "refunded"
  | "failed";

export type AdCampaignSource =
  | "self_service"
  | "admin"
  | "migration"
  | "platform";

export type AdTargetScope = "district" | "city" | "neighborhood";

export type AdPlacementKey =
  | "feed_sponsored"
  | "sidebar_widget"
  | "banner_top"
  | "banner_bottom";

export interface AdCampaign {
  id: string;
  owner_business_id?: string | null;
  created_by_profile_id?: string | null;
  advertiser_name: string;
  advertiser_contact?: string | null;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  status: AdCampaignStatus;
  review_status?: AdCampaignReviewStatus;
  billing_status?: AdCampaignBillingStatus;
  source?: AdCampaignSource;
  placement_key: AdPlacementKey;
  priority?: number;
  starts_at?: string;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdTarget {
  campaign_id: string;
  location_id: string;
  target_scope: AdTargetScope;
}

export interface AdCampaignWithTargets extends AdCampaign {
  targets: AdTarget[];
}

export interface AdEligibilityContext {
  active_location_id: string | null;
  active_location_type: "district" | "neighborhood" | "city" | null;
  parent_city_id: string | null;
  fallback_location_id: string | null;
}

export interface AdResolutionResult {
  campaign: AdCampaignWithTargets | null;
  resolution_source: "district" | "neighborhood" | "city" | "fallback" | "generic" | "none";
}
