import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import type { AdminNotificationRecord } from "@/core/admin/services/AdminNotificationsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  formatNotificationType,
  getPriorityBadge,
} from "./AdminNotifications.helpers";

interface AdminNotificationDetailDialogProps {
  notification: AdminNotificationRecord | null;
  onClose: () => void;
}

export function AdminNotificationDetailDialog({
  notification,
  onClose,
}: AdminNotificationDetailDialogProps) {
  return (
    <Dialog open={Boolean(notification)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhe da notificacao</DialogTitle>
        </DialogHeader>

        {notification ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <DetailField label="Tipo" value={formatNotificationType(notification.type)} />
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Prioridade
                </p>
                <div className="mt-1">{getPriorityBadge(notification.priority)}</div>
              </div>
              <DetailField
                label="Usuario"
                value={
                  notification.profile?.display_name ||
                  notification.profile?.name ||
                  notification.user_id
                }
              />
              <DetailField
                label="Criada em"
                value={
                  notification.created_at
                    ? format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })
                    : "-"
                }
              />
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Mensagem
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {notification.message || "Sem mensagem"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Payload
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(notification.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
