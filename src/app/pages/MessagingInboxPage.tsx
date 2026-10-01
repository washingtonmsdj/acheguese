import { MensagensPage } from "@/modules/messaging";
import { getActiveMessagingProviderIds } from "@/app/config/messagingProviderScope";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";

export default function MessagingInboxPage() {
  return (
    <div className="light pt-page messaging-shell">
      <PublicBrandHeader urls={LAUNCH_URLS} accountHref={ACCOUNT_PATHS.home} />
      <MensagensPage providerIds={getActiveMessagingProviderIds()} />
    </div>
  );
}
