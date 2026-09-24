import {
  hasSearchProvider,
  SEARCH_PROVIDER_BUCKET_ORDER,
} from "@/core/search/providers/searchProviders";
import type { SearchBucket } from "@/core/search/contracts";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

const PROVIDER_PRODUCT_MODULE: Record<SearchBucket, ProductModuleKey> = {
  communities: "community",
  businesses: "business",
  professionals: "services",
  opportunities: "jobs",
  classifieds: "classifieds",
  events: "events",
  posts: "community",
};

export function getActiveSearchProviderBuckets(): SearchBucket[] {
  if (!isPlatformCapabilityEnabled("search")) return [];

  return SEARCH_PROVIDER_BUCKET_ORDER.filter((bucket) => {
    const productModule = PROVIDER_PRODUCT_MODULE[bucket];
    return (
      isProductModuleEnabled(productModule) &&
      hasSearchProvider(bucket)
    );
  });
}
