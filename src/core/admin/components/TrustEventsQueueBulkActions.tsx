import { Button } from "@/shared/components/ui/button";
import { TRUST_ADMIN_ACTION_TYPES, TRUST_EVENT_STATUSES } from "@/core/trust";
import type {
  TrustAdminActionType,
  TrustEventStatus,
} from "@/core/trust";

interface ConfirmBulkActionInput {
  title: string;
  description: string;
  confirmLabel: string;
  run: () => Promise<void>;
}

interface TrustEventsQueueBulkActionsProps {
  selectedEventsCount: number;
  selectedClassifiedEventsCount: number;
  reviewingId: string | null;
  onBulkReview: (status: TrustEventStatus) => Promise<void>;
  onBulkAdminAction: (actionType: TrustAdminActionType, durationDays?: number) => Promise<void>;
  onConfirmBulkAction: (input: ConfirmBulkActionInput) => void;
}

export function TrustEventsQueueBulkActions({
  selectedEventsCount,
  selectedClassifiedEventsCount,
  reviewingId,
  onBulkReview,
  onBulkAdminAction,
  onConfirmBulkAction,
}: TrustEventsQueueBulkActionsProps) {
  if (selectedEventsCount === 0) return null;

  return (
    <div className="sticky top-3 z-20 mb-4 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">
          {selectedEventsCount} selecionados
          {selectedClassifiedEventsCount > 0
            ? ` (${selectedClassifiedEventsCount} classificados)`
            : ""}
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={reviewingId === "bulk"}
            onClick={() => onBulkReview(TRUST_EVENT_STATUSES.UNDER_REVIEW)}
          >
            Em analise
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={reviewingId === "bulk"}
            onClick={() => onBulkReview(TRUST_EVENT_STATUSES.CONFIRMED)}
          >
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reviewingId === "bulk"}
            onClick={() =>
              onConfirmBulkAction({
                title: "Penalizar eventos em lote?",
                description:
                  "Esta acao altera o status dos eventos selecionados para penalizado.",
                confirmLabel: "Penalizar em lote",
                run: () => onBulkReview(TRUST_EVENT_STATUSES.PENALIZED),
              })
            }
          >
            Penalizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={reviewingId === "bulk"}
            onClick={() => onBulkAdminAction(TRUST_ADMIN_ACTION_TYPES.WARNING)}
          >
            Aviso
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reviewingId === "bulk"}
            onClick={() =>
              onConfirmBulkAction({
                title: "Aplicar restricao de 7 dias?",
                description:
                  "Todos os perfis selecionados receberao restricao temporaria de 7 dias.",
                confirmLabel: "Restringir 7 dias",
                run: () =>
                  onBulkAdminAction(TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION, 7),
              })
            }
          >
            Restr. 7d
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reviewingId === "bulk"}
            onClick={() =>
              onConfirmBulkAction({
                title: "Aplicar restricao de 30 dias?",
                description:
                  "Todos os perfis selecionados receberao restricao temporaria de 30 dias.",
                confirmLabel: "Restringir 30 dias",
                run: () =>
                  onBulkAdminAction(TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION, 30),
              })
            }
          >
            Restr. 30d
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={reviewingId === "bulk"}
            onClick={() =>
              onConfirmBulkAction({
                title: "Remover restricoes em lote?",
                description:
                  "Esta acao remove restricoes ativas dos perfis selecionados.",
                confirmLabel: "Desbloquear em lote",
                run: () => onBulkAdminAction(TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION),
              })
            }
          >
            Desbloquear
          </Button>
        </div>
      </div>
    </div>
  );
}
