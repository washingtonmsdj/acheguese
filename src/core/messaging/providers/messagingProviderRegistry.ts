import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "@/app/config/lifecycleRegistry";
import type {
  MessagingInboxProvider,
  MessagingProviderId,
} from "../inboxTypes";
import { businessMessagingProvider } from "./BusinessMessagingProvider";

type MessagingProviderDefinition = {
  provider: MessagingInboxProvider;
  isDomainEnabled: () => boolean;
};

const MESSAGING_PROVIDER_REGISTRY: Record<
  MessagingProviderId,
  MessagingProviderDefinition | null
> = {
  business: {
    provider: businessMessagingProvider,
    isDomainEnabled: () => isProductModuleEnabled("business"),
  },
  classifieds: null,
  community: null,
};

export function getMessagingProvider(
  providerId: MessagingProviderId,
): MessagingInboxProvider | null {
  if (!isPlatformCapabilityEnabled("messaging")) return null;

  const definition = MESSAGING_PROVIDER_REGISTRY[providerId];
  if (!definition || !definition.isDomainEnabled()) return null;
  return definition.provider;
}

export function getActiveMessagingProviders(): MessagingInboxProvider[] {
  if (!isPlatformCapabilityEnabled("messaging")) return [];

  return Object.values(MESSAGING_PROVIDER_REGISTRY)
    .filter(
      (definition): definition is MessagingProviderDefinition =>
        Boolean(definition) && definition.isDomainEnabled(),
    )
    .map((definition) => definition.provider);
}

export function isMessagingProviderId(
  value: string | undefined,
): value is MessagingProviderId {
  return (
    value === "business" ||
    value === "classifieds" ||
    value === "community"
  );
}
