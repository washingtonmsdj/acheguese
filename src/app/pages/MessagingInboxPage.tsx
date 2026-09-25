import { MensagensPage } from "@/modules/messaging";
import { getActiveMessagingProviderIds } from "@/app/config/messagingProviderScope";

export default function MessagingInboxPage() {
  return <MensagensPage providerIds={getActiveMessagingProviderIds()} />;
}
