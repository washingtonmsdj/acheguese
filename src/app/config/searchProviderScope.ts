import type {
  SearchBucket,
  SearchDocumentType,
} from "@/core/search/contracts";
import { SEARCH_PROVIDER_BUCKET_ORDER } from "@/core/search/providers/searchProviders";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

const SEARCH_BUCKET_PRODUCT_MODULE: Record<
  SearchBucket,
  ProductModuleKey
> = {
  communities: "community",
  businesses: "business",
  professionals: "services",
  opportunities: "jobs",
  classifieds: "classifieds",
  events: "events",
  posts: "community",
};

const SEARCH_DOCUMENT_BUCKET: Record<
  SearchDocumentType,
  SearchBucket | null
> = {
  community: "communities",
  business: "businesses",
  professional: "professionals",
  opportunity: "opportunities",
  classified: "classifieds",
  event: "events",
  post: "posts",
  coupon: null,
};

export function getActiveSearchProviderBuckets(): SearchBucket[] {
  if (!isPlatformCapabilityEnabled("search")) return [];

  return SEARCH_PROVIDER_BUCKET_ORDER.filter((bucket) =>
    isProductModuleEnabled(SEARCH_BUCKET_PRODUCT_MODULE[bucket]),
  );
}

export function isSearchDocumentTypeEnabled(
  type: SearchDocumentType,
  activeBuckets: readonly SearchBucket[],
): boolean {
  const bucket = SEARCH_DOCUMENT_BUCKET[type];
  return bucket !== null && activeBuckets.includes(bucket);
}
