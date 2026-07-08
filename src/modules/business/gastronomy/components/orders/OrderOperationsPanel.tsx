/**
 * OrderOperationsPanel - acoes operacionais da loja sobre o pedido SSOT.
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Check,
  ChefHat,
  ClipboardCheck,
  DollarSign,
  PackageCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useSessionContext } from "@/core/session";
import {
  type Order,
  OrderService,
  type OrderStatus,
  type OrderWithItems,
} from "@/modules/business/gastronomy/services/OrderService";

interface OrderOperationsPanelProps {
  order: OrderWithItems;
  businessId: string;
}

interface OrderAction {
  status: OrderStatus;
  label: string;
  description: string;
  icon: typeof Check;
}

const TERMINAL_STATUSES: OrderStatus[] = [
  "delivered",
  "completed",
  "cancelled",
];

const CANCELLATION_REASONS = [
  {
    code: "merchant_item_unavailable",
    label: "Item indisponivel / problema da loja",
    helper: "Registra apenas auditoria do pedido, sem penalizar cliente.",
  },
  {
    code: "merchant_emergency",
    label: "Emergencia operacional da loja",
    helper: "Registra apenas auditoria do pedido, sem penalizar cliente.",
  },
  {
    code: "customer_requested_before_preparation",
    label: "Cliente solicitou antes do preparo",
    helper: "Cancelamento comum, sem evento de risco para o cliente.",
  },
  {
    code: "customer_requested_late_cancel",
    label: "Cliente solicitou depois do preparo/pronto",
    helper:
      "Se o pedido ja estava em preparo, pronto ou saiu para entrega, cria evento privado de confianca para admin.",
  },
  {
    code: "payment_or_fraud_issue",
    label: "Pagamento, fraude ou seguranca",
    helper: "Registra motivo sensivel para auditoria operacional.",
  },
] as const;
type CancellationReasonCode = (typeof CANCELLATION_REASONS)[number]["code"];

function getPrimaryAction(order: OrderWithItems): OrderAction | null {
  switch (order.status) {
    case "pending":
      return {
        status: "confirmed",
        label: "Aceitar pedido",
        description:
          "Confirma que a loja recebeu o pedido e vai iniciar a operacao.",
        icon: ClipboardCheck,
      };
    case "confirmed":
      return {
        status: "preparing",
        label: "Iniciar preparo",
        description: "Move o pedido para a fila de cozinha/preparo.",
        icon: ChefHat,
      };
    case "preparing":
      return {
        status: "ready",
        label: "Marcar pronto",
        description:
          "Informa que o pedido esta pronto para retirada ou coleta da entrega.",
        icon: PackageCheck,
      };
    case "ready":
      return order.order_type === "delivery"
        ? {
            status: "out_for_delivery",
            label: "Marcar saiu para entrega",
            description:
              "Use para entrega propria/manual; se houver entrega vinculada, o responsavel tambem atualiza este status.",
            icon: Truck,
          }
        : {
            status: "delivered",
            label: "Marcar retirado",
            description:
              "Finaliza retirada/consumo local quando o cliente recebeu o pedido.",
            icon: Check,
          };
    case "out_for_delivery":
      return {
        status: "delivered",
        label: "Marcar entregue",
        description: "Confirma que o pedido foi entregue ao cliente.",
        icon: Check,
      };
    default:
      return null;
  }
}

export function OrderOperationsPanel({
  order,
  businessId,
}: OrderOperationsPanelProps) {
  const queryClient = useQueryClient();
  const { user, activeProfile } = useSessionContext();
  const [optimisticOrder, setOptimisticOrder] = useState(order);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonCode, setCancelReasonCode] =
    useState<CancellationReasonCode>(CANCELLATION_REASONS[0].code);

  useEffect(() => {
    setOptimisticOrder(order);
  }, [order]);

  const primaryAction = useMemo(() => getPrimaryAction(optimisticOrder), [optimisticOrder]);
  const actingProfileId = optimisticOrder.merchant_profile_id || activeProfile?.id;
  const canOperate = Boolean(user?.id && actingProfileId);
  const canCancel = !TERMINAL_STATUSES.includes(optimisticOrder.status);
  const canConfirmPaymentByStatus =
    optimisticOrder.payment_status === "pending_payment" ||
    optimisticOrder.payment_status === "not_applicable";
  const canConfirmPayment =
    canOperate &&
    (optimisticOrder.payment_method === "pix" ||
      optimisticOrder.payment_method === "payment_link") &&
    canConfirmPaymentByStatus;
  const selectedCancelReason = CANCELLATION_REASONS.find(
    (reason) => reason.code === cancelReasonCode,
  );

  const syncOrderCaches = (updatedOrder: Order | null | undefined) => {
    if (!updatedOrder) return;

    setOptimisticOrder((current) => ({
      ...current,
      ...updatedOrder,
    }));

    queryClient.setQueryData(
      ["order", optimisticOrder.id],
      (current: OrderWithItems | undefined) =>
        current
          ? { ...current, ...updatedOrder }
          : ({
              ...updatedOrder,
              items: [],
              status_history: [],
            } as OrderWithItems),
    );
    queryClient.setQueriesData(
      { queryKey: ["orders", businessId] },
      (current: Order[] | undefined) =>
        Array.isArray(current)
          ? current.map((entry) =>
              entry.id === updatedOrder.id
                ? { ...entry, ...updatedOrder }
                : entry,
            )
          : current,
    );
  };

  const refreshOrderViews = () => {
    void queryClient.invalidateQueries({ queryKey: ["orders", businessId] });
    void queryClient.invalidateQueries({ queryKey: ["order", optimisticOrder.id] });
    void queryClient.invalidateQueries({
      queryKey: ["order-stats", businessId],
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (input: { status: OrderStatus; notes?: string }) => {
      const result = await OrderService.updateOrderStatus(
        optimisticOrder.id,
        input.status,
        input.notes,
        actingProfileId,
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onMutate: (input) => {
      setOptimisticOrder((current) => ({
        ...current,
        status: input.status,
      }));
    },
    onSuccess: (updatedOrder) => {
      syncOrderCaches(updatedOrder);
      refreshOrderViews();
      toast.success("Status do pedido atualizado.");
    },
    onError: (error: Error) => {
      setOptimisticOrder(order);
      refreshOrderViews();
      toast.error(`Erro ao atualizar pedido: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      const result = await OrderService.cancelOrder(
        optimisticOrder.id,
        reason,
        actingProfileId,
        {
          reasonCode: cancelReasonCode,
        },
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (updatedOrder) => {
      setCancelOpen(false);
      setCancelReason("");
      syncOrderCaches(updatedOrder);
      refreshOrderViews();
      toast.success("Pedido cancelado.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar pedido: ${error.message}`);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const result = await OrderService.confirmOrderPayment(
        optimisticOrder.id,
        actingProfileId,
        "Pagamento confirmado pela operacao da loja",
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (updatedOrder) => {
      syncOrderCaches(updatedOrder);
      refreshOrderViews();
      toast.success("Pagamento confirmado.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao confirmar pagamento: ${error.message}`);
    },
  });

  const isBusy =
    updateStatusMutation.isPending ||
    cancelMutation.isPending ||
    confirmPaymentMutation.isPending;
  const normalizedReason = cancelReason.trim();
  const ActionIcon = primaryAction?.icon ?? Check;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Operação da loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {primaryAction ? (
          <div className="rounded-lg border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{primaryAction.label}</p>
                <p className="text-sm text-muted-foreground">
                  {primaryAction.description}
                </p>
              </div>
              <Button
                onClick={() =>
                  updateStatusMutation.mutate({
                    status: primaryAction.status,
                    notes: primaryAction.description,
                  })
                }
                disabled={isBusy || !canOperate}
                className="w-full sm:w-auto"
              >
                <ActionIcon className="mr-2 h-4 w-4" />
                {primaryAction.label}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-4">
            <p className="font-medium">Sem ação operacional pendente</p>
            <p className="text-sm text-muted-foreground">
              Este pedido está em estado final ou aguardando atualização externa
              do fluxo de entrega.
            </p>
          </div>
        )}

        {canCancel && (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Cancelar pedido</p>
              <p className="text-sm text-muted-foreground">
                Exige motivo operacional e registra auditoria no SSOT de
                pedidos.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={isBusy || !canOperate}
              className="w-full sm:w-auto"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}

        {canConfirmPayment && (
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Confirmar pagamento</p>
              <p className="text-sm text-muted-foreground">
                Registra o recebimento no SSOT e gera evento na timeline
                financeira.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => confirmPaymentMutation.mutate()}
              disabled={isBusy}
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 sm:w-auto"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Marcar pagamento confirmado
            </Button>
          </div>
        )}

        {!canOperate && (
          <p className="text-sm text-destructive">
            Sessao autenticada e perfil da empresa sao obrigatorios para operar pedidos.
          </p>
        )}
      </CardContent>

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => !isBusy && setCancelOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>
              Cancelar pedido #{optimisticOrder.order_number}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo. Ele será registrado na linha do tempo e usado
              nas notificações operacionais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="order-cancel-reason-code">Motivo estruturado</Label>
            <Select
              value={cancelReasonCode}
              onValueChange={(value) =>
                setCancelReasonCode(value as CancellationReasonCode)
              }
              disabled={isBusy}
            >
              <SelectTrigger
                id="order-cancel-reason-code"
                aria-label="Selecionar motivo estruturado do cancelamento"
              >
                <SelectValue placeholder="Motivo estruturado" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCancelReason && (
              <p className="text-xs text-muted-foreground">
                {selectedCancelReason.helper}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-cancel-reason-text">
              Detalhes do cancelamento
            </Label>
            <Textarea
              id="order-cancel-reason-text"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ex.: item indisponivel, loja fechou emergencia, cliente solicitou cancelamento..."
              disabled={isBusy}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy || normalizedReason.length < 5}
              onClick={(event) => {
                event.preventDefault();
                cancelMutation.mutate(normalizedReason);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
