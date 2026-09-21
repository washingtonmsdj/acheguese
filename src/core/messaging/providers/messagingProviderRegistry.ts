import type {
  MessagingInboxProvider,
  MessagingProviderId,
} from "../inboxTypes";
import { businessMessagingProvider } from "./BusinessMessagingProvider";

const MESSAGING_PROVIDER_REGISTRY: Partial<
  Record<MessagingProviderId, MessagingInboxProvider>
> = {
  business: businessMessagingProvider,
};

export function getMessagingProvider(
  providerId: MessagingProviderId,
): MessagingInboxProvider | null {
  return MESSAGING_PROVIDER_REGISTRY[providerId] ?? null;
}

export function getRegisteredMessagingProviders(): MessagingInboxProvider[] {
  return Object.values(MESSAGING_PROVIDER_REGISTRY).filter(
    (provider): provider is MessagingInboxProvider => Boolean(provider),
  );
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
