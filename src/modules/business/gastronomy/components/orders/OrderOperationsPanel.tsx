/**
 * OrderOperationsPanel - acoes operacionais da loja sobre o pedido SSOT.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Check,
  ChefHat,
  ClipboardCheck,
  DollarSign,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { useSessionContext } from '@/core/session';
import {
  OrderService,
  type OrderStatus,
  type OrderWithItems,
} from '@/modules/business/gastronomy/services/OrderService';

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

const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'completed', 'cancelled'];

const CANCELLATION_REASONS = [
  {
    code: 'merchant_item_unavailable',
    label: 'Item indisponivel / problema da loja',
    helper: 'Registra apenas auditoria do pedido, sem penalizar cliente.',
  },
  {
    code: 'merchant_emergency',
    label: 'Emergencia operacional da loja',
    helper: 'Registra apenas auditoria do pedido, sem penalizar cliente.',
  },
  {
    code: 'customer_requested_before_preparation',
    label: 'Cliente solicitou antes do preparo',
    helper: 'Cancelamento comum, sem evento de risco para o cliente.',
  },
  {
    code: 'customer_requested_late_cancel',
    label: 'Cliente solicitou depois do preparo/pronto',
    helper: 'Se o pedido ja estava em preparo, pronto ou saiu para entrega, cria evento privado de confianca para admin.',
  },
  {
    code: 'payment_or_fraud_issue',
    label: 'Pagamento, fraude ou seguranca',
    helper: 'Registra motivo sensivel para auditoria operacional.',
  },
] as const;

function getPrimaryAction(order: OrderWithItems): OrderAction | null {
  switch (order.status) {
    case 'pending':
      return {
        status: 'confirmed',
        label: 'Aceitar pedido',
        description: 'Confirma que a loja recebeu o pedido e vai iniciar a operacao.',
        icon: ClipboardCheck,
      };
    case 'confirmed':
      return {
        status: 'preparing',
        label: 'Iniciar preparo',
        description: 'Move o pedido para a fila de cozinha/preparo.',
        icon: ChefHat,
      };
    case 'preparing':
      return {
        status: 'ready',
        label: 'Marcar pronto',
        description: 'Informa que o pedido esta pronto para retirada ou coleta do motoboy.',
        icon: PackageCheck,
      };
    case 'ready':
      return order.order_type === 'delivery'
        ? {
            status: 'out_for_delivery',
            label: 'Marcar saiu para entrega',
            description: 'Use apenas para entrega propria/manual; se houver motoboy vinculado, ele tambem atualiza este status.',
            icon: Truck,
          }
        : {
            status: 'delivered',
            label: 'Marcar retirado',
            description: 'Finaliza retirada/consumo local quando o cliente recebeu o pedido.',
            icon: Check,
          };
    case 'out_for_delivery':
      return {
        status: 'delivered',
        label: 'Marcar entregue',
        description: 'Confirma que o pedido foi entregue ao cliente.',
        icon: Check,
      };
    default:
      return null;
  }
}

export function OrderOperationsPanel({ order, businessId }: OrderOperationsPanelProps) {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonCode, setCancelReasonCode] = useState(CANCELLATION_REASONS[0].code);
  const primaryAction = useMemo(() => getPrimaryAction(order), [order]);
  const canCancel = !TERMINAL_STATUSES.includes(order.status);
  const canConfirmPaymentByStatus =
    order.payment_status === 'pending_payment' || order.payment_status === 'not_applicable';
  const canConfirmPayment =
    !!activeProfile?.id &&
    (order.payment_method === 'pix' || order.payment_method === 'payment_link') &&
    canConfirmPaymentByStatus;
  const selectedCancelReason = CANCELLATION_REASONS.find(
    (reason) => reason.code === cancelReasonCode,
  );

  const invalidateOrder = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders', businessId] }),
      queryClient.invalidateQueries({ queryKey: ['order', order.id] }),
      queryClient.invalidateQueries({ queryKey: ['order-stats', businessId] }),
    ]);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (input: { status: OrderStatus; notes?: string }) => {
      const result = await OrderService.updateOrderStatus(
        order.id,
        input.status,
        input.notes,
        activeProfile?.id,
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await invalidateOrder();
      toast.success('Status do pedido atualizado.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar pedido: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      const result = await OrderService.cancelOrder(order.id, reason, activeProfile?.id, {
        reasonCode: cancelReasonCode,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setCancelOpen(false);
      setCancelReason('');
      await invalidateOrder();
      toast.success('Pedido cancelado.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar pedido: ${error.message}`);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const result = await OrderService.confirmOrderPayment(
        order.id,
        activeProfile?.id,
        'Pagamento confirmado pela operacao da loja',
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await invalidateOrder();
      toast.success('Pagamento confirmado.');
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
          Operacao da loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {primaryAction ? (
          <div className="rounded-lg border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{primaryAction.label}</p>
                <p className="text-sm text-muted-foreground">{primaryAction.description}</p>
              </div>
              <Button
                onClick={() =>
                  updateStatusMutation.mutate({
                    status: primaryAction.status,
                    notes: primaryAction.description,
                  })
                }
                disabled={isBusy || !activeProfile?.id}
                className="w-full sm:w-auto"
              >
                <ActionIcon className="mr-2 h-4 w-4" />
                {primaryAction.label}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-4">
            <p className="font-medium">Sem acao operacional pendente</p>
            <p className="text-sm text-muted-foreground">
              Este pedido esta em estado final ou aguardando atualizacao externa do fluxo de entrega.
            </p>
          </div>
        )}

        {canCancel && (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Cancelar pedido</p>
              <p className="text-sm text-muted-foreground">
                Exige motivo operacional e registra auditoria no SSOT de pedidos.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={isBusy || !activeProfile?.id}
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
                Registra o recebimento no SSOT e gera evento na timeline financeira.
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

        {!activeProfile?.id && (
          <p className="text-sm text-destructive">
            Perfil ativo obrigatorio para operar pedidos.
          </p>
        )}
      </CardContent>

      <AlertDialog open={cancelOpen} onOpenChange={(open) => !isBusy && setCancelOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido #{order.order_number}</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo. Ele sera registrado na linha do tempo e usado nas notificacoes operacionais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Select
              value={cancelReasonCode}
              onValueChange={(value) =>
                setCancelReasonCode(value as (typeof CANCELLATION_REASONS)[number]['code'])
              }
              disabled={isBusy}
            >
              <SelectTrigger>
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
              <p className="text-xs text-muted-foreground">{selectedCancelReason.helper}</p>
            )}
          </div>
          <Textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Ex.: item indisponivel, loja fechou emergencia, cliente solicitou cancelamento..."
            disabled={isBusy}
          />
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
