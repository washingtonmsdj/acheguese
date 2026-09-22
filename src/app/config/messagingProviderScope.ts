import {
  getMessagingProvider,
  type MessagingProviderId,
} from "@/core/messaging";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";

const PROVIDER_PRODUCT_MODULE: Record<
  MessagingProviderId,
  "business" | "classifieds" | "community"
> = {
  business: "business",
  classifieds: "classifieds",
  community: "community",
};

const PROVIDER_ORDER: readonly MessagingProviderId[] = [
  "business",
  "classifieds",
  "community",
];

export function getActiveMessagingProviderIds(): MessagingProviderId[] {
  if (!isPlatformCapabilityEnabled("messaging")) return [];

  return PROVIDER_ORDER.filter((providerId) => {
    const productModule = PROVIDER_PRODUCT_MODULE[providerId];
    return (
      isProductModuleEnabled(productModule) &&
      getMessagingProvider(providerId) !== null
    );
  });
}
