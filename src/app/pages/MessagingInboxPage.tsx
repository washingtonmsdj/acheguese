import { MensagensPage } from "@/modules/messaging";
import { getActiveMessagingProviderIds } from "@/app/config/messagingProviderScope";

/**
 * Horizontal Messaging surface.
 *
 * Shell ownership belongs to AppLayoutSidebar. The inbox participates in the
 * normal authenticated product shell, while an opened thread may be rendered
 * by that shell in focused conversation mode.
 */
export default function MessagingInboxPage() {
  return <MensagensPage providerIds={getActiveMessagingProviderIds()} />;
}
