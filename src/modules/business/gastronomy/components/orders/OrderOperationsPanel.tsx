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
  PackageCheck,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
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
  const primaryAction = useMemo(() => getPrimaryAction(order), [order]);
  const canCancel = !TERMINAL_STATUSES.includes(order.status);

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
      const result = await OrderService.cancelOrder(order.id, reason, activeProfile?.id);
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

  const isBusy = updateStatusMutation.isPending || cancelMutation.isPending;
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
