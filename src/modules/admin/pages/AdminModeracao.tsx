import {
  CommunityRpcOperationsPanel,
  TrustEventsQueue,
} from "@/core/admin/components";
import { CommunityContentModerationQueue } from "@/core/community/moderation";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { FederatedModerationQueue } from "@/modules/admin/components/moderation/FederatedModerationQueue";
import { TrustAdminActionsLog } from "@/modules/admin/components/moderation/TrustAdminActionsLog";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";

export default function AdminModeracao() {
  const { canModerate, isChecking } = useAdminGuard();

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="font-display text-2xl font-bold">Moderação</h1>
        <p className="text-sm text-muted-foreground">
          Fila canônica de conteúdo, eventos de confiança e trilha de auditoria
          administrativa.
        </p>
      </div>

      <CommunityRpcOperationsPanel />
      <FederatedModerationQueue />
      <CommunityContentModerationQueue />
      <TrustEventsQueue />
      <TrustAdminActionsLog />
    </div>
  );
}
