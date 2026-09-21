import MensagensPage from "@/modules/messaging/pages/MensagensPage";
import { getActiveMessagingProviderIds } from "@/app/config/messagingProviderScope";

export default function MessagingInboxPage() {
  return <MensagensPage providerIds={getActiveMessagingProviderIds()} />;
}
