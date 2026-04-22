/**
 * SuspensionHistoryDialog
 * 
 * Dialog com histórico de suspensões
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  History,
  Loader2,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldX,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { SuspensionHistoryDialogProps } from "../../sections/types";
import { formatDateTime } from "../../utils";

export function SuspensionHistoryDialog({
  open,
  onOpenChange,
  history,
  loading,
}: SuspensionHistoryDialogProps) {
  const actionMeta: Record<
    SuspensionHistoryDialogProps["history"][number]["action"],
    {
      label: string;
      icon: typeof CheckCircle;
      cardClass: string;
    }
  > = {
    approved: {
      label: "Cadastro aprovado",
      icon: ShieldCheck,
      cardClass: "bg-emerald-500/5 border-emerald-500",
    },
    rejected: {
      label: "Cadastro rejeitado",
      icon: ShieldX,
      cardClass: "bg-rose-500/5 border-rose-500",
    },
    suspended: {
      label: "Suspenso",
      icon: XCircle,
      cardClass: "bg-red-500/5 border-red-500",
    },
    reactivated: {
      label: "Reativado",
      icon: CheckCircle,
      cardClass: "bg-green-500/5 border-green-500",
    },
    set_online: {
      label: "Marcado online",
      icon: ToggleRight,
      cardClass: "bg-cyan-500/5 border-cyan-500",
    },
    set_offline: {
      label: "Marcado offline",
      icon: ToggleLeft,
      cardClass: "bg-zinc-500/5 border-zinc-500",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Histórico de Suspensões
          </DialogTitle>
          <DialogDescription>
            Registro completo de todas as suspensões e reativações deste motorista
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <History className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              Nenhum histórico de suspensão encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {history.map((entry) => {
              const meta = actionMeta[entry.action];
              const Icon = meta.icon;
              return (
              <div
                key={entry.id}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  meta.cardClass
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-foreground" />
                      <span className="font-semibold">{meta.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Por: {entry.admin_name}
                    </p>
                    {entry.reason && (
                      <p className="text-sm mt-2 p-2 rounded bg-secondary/50">
                        <span className="font-medium">Motivo:</span> {entry.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
