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

function getProviderProductModule(bucket: SearchBucket): ProductModuleKey {
  switch (bucket) {
    case "communities":
      return PROVIDER_PRODUCT_MODULE.communities;
    case "businesses":
      return PROVIDER_PRODUCT_MODULE.businesses;
    case "professionals":
      return PROVIDER_PRODUCT_MODULE.professionals;
    case "opportunities":
      return PROVIDER_PRODUCT_MODULE.opportunities;
    case "classifieds":
      return PROVIDER_PRODUCT_MODULE.classifieds;
    case "events":
      return PROVIDER_PRODUCT_MODULE.events;
    case "posts":
      return PROVIDER_PRODUCT_MODULE.posts;
  }
}

export function getActiveSearchProviderBuckets(): SearchBucket[] {
  if (!isPlatformCapabilityEnabled("search")) return [];

  return SEARCH_PROVIDER_BUCKET_ORDER.filter((bucket) => {
    const productModule = getProviderProductModule(bucket);
    return (
      isProductModuleEnabled(productModule) &&
      hasSearchProvider(bucket)
    );
  });
}
