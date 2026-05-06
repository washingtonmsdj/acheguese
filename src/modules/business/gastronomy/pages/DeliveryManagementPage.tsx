/**
 * DeliveryManagementPage - Gestao de entregas (SSOT).
 *
 * SSOT: useDelivery -> RideOperationalService -> ride_requests (ride_mode='motoboy').
 * Esta pagina nao deve consumir delivery_requests legado.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, DollarSign, ExternalLink, Loader2, MapPin, Package, Phone, Plus, User, Clock } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { CreateDeliveryModal } from '@/shared/services/mobilityDelivery';
import { useDelivery } from '@/shared/services/mobilityDelivery';
import { useLocationContext } from '@/core/location/hooks/useLocationContext';
import { useOrders } from '../hooks/useOrders';
import { OrderDeliveryLinkService } from '@/modules/mobility/delivery/services/OrderDeliveryLinkService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

type DeliveryFilterTab = 'all' | 'pending' | 'in_progress' | 'delivered' | 'failed' | 'cancelled';

interface DeliveryRide {
  id: string;
  status: string;
  created_at?: string;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  package_description?: string | null;
  package_size?: string | null;
  payment_method?: string | null;
  suggested_price?: number | null;
  final_price?: number | null;
  origin?: string | null;
  destination?: string | null;
  source_type?: string | null;
  source_id?: string | null;
}

function mapRideStatus(status: string): DeliveryFilterTab {
  if (status === 'delivered') return 'delivered';
  if (status === 'in_delivery') return 'in_progress';
  if (status === 'failed_delivery' || status === 'expired') return 'failed';
  if (status === 'cancelled' || status === 'cancelled_by_passenger' || status === 'cancelled_by_driver') {
    return 'cancelled';
  }

  return 'pending';
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    requested: 'Solicitada',
    searching_driver: 'Buscando motoboy',
    driver_assigned: 'Motoboy atribuido',
    driver_accepted: 'Motoboy aceitou',
    driver_arriving: 'Motoboy a caminho',
    pickup_confirmed: 'Coleta confirmada',
    in_delivery: 'Em entrega',
    delivered: 'Entregue',
    failed_delivery: 'Falha na entrega',
    cancelled: 'Cancelada',
    cancelled_by_passenger: 'Cancelada pelo solicitante',
    cancelled_by_driver: 'Cancelada pelo motoboy',
    expired: 'Expirada',
  };

  return labels[status] || status;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const mapped = mapRideStatus(status);
  if (mapped === 'delivered') return 'outline';
  if (mapped === 'in_progress') return 'default';
  if (mapped === 'failed' || mapped === 'cancelled') return 'destructive';
  return 'secondary';
}

function canCancel(status: string): boolean {
  return [
    'requested',
    'searching_driver',
    'driver_assigned',
    'driver_accepted',
    'driver_arriving',
    'pickup_confirmed',
  ].includes(status);
}

function formatMoney(value?: number | null): string {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `R$ ${safeValue.toFixed(2)}`;
}

export default function DeliveryManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { activeLocation } = useLocationContext();

  const [activeTab, setActiveTab] = useState<DeliveryFilterTab>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { deliveries, isLoading: manualDeliveriesLoading, isSubmitting, createDelivery, cancelDelivery } = useDelivery('gastronomy', businessId);
  const { orders = [], isLoading: ordersLoading } = useOrders(businessId ?? '', { order_type: 'delivery' });

  const linkedDeliveriesQuery = useQuery({
    queryKey: ['gastronomy', 'delivery-rides-by-orders', businessId, orders.map((order) => order.id)],
    queryFn: async () => {
      const rides = await Promise.all(
        orders.map((order) => OrderDeliveryLinkService.getRideRequestByOrderId(order.id)),
      );
      return rides.filter((ride): ride is NonNullable<typeof ride> => Boolean(ride));
    },
    enabled: !!businessId && orders.length > 0,
    refetchInterval: 15000,
  });

  const isLoading = manualDeliveriesLoading || ordersLoading || linkedDeliveriesQuery.isLoading;

  const typedDeliveries = useMemo(() => {
    const byId = new Map<string, DeliveryRide>();
    const manualRides = (deliveries as unknown as DeliveryRide[]).filter((ride) => ride?.id);
    const orderRides = (linkedDeliveriesQuery.data as unknown as DeliveryRide[] | undefined)?.filter((ride) => ride?.id) ?? [];

    for (const ride of [...manualRides, ...orderRides]) {
      byId.set(ride.id, ride);
    }

    return Array.from(byId.values());
  }, [deliveries, linkedDeliveriesQuery.data]);

  const filteredDeliveries = useMemo(() => {
    if (activeTab === 'all') return typedDeliveries;
    return typedDeliveries.filter((ride) => mapRideStatus(ride.status) === activeTab);
  }, [activeTab, typedDeliveries]);

  const stats = useMemo(() => {
    const base = {
      total: typedDeliveries.length,
      pending: 0,
      inProgress: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
      revenue: 0,
    };

    for (const ride of typedDeliveries) {
      const group = mapRideStatus(ride.status);
      if (group === 'pending') base.pending += 1;
      if (group === 'in_progress') base.inProgress += 1;
      if (group === 'delivered') {
        base.delivered += 1;
        const amount = typeof ride.final_price === 'number' ? ride.final_price : ride.suggested_price ?? 0;
        base.revenue += Number.isFinite(amount) ? amount : 0;
      }
      if (group === 'failed') base.failed += 1;
      if (group === 'cancelled') base.cancelled += 1;
    }

    return base;
  }, [typedDeliveries]);

  const handleCancelClick = (id: string) => {
    setSelectedRequestId(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedRequestId) return;

    await cancelDelivery(selectedRequestId, cancellationReason || 'Cancelado pelo estabelecimento');

    setCancelDialogOpen(false);
    setSelectedRequestId(null);
    setCancellationReason('');
  };

  if (!businessId) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">ID da empresa nao encontrado.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestao de Entregas</h1>
          <p className="text-muted-foreground">Painel da rede de motoboys da operacao, integrado aos pedidos.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2 w-full sm:w-auto" disabled={!activeLocation}>
          <Plus className="h-4 w-4" />
          Solicitar Motoboy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Em entrega</p>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Entregues</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Falhas/Canceladas</p>
            <p className="text-2xl font-bold text-destructive">{stats.failed + stats.cancelled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-2xl font-bold">{formatMoney(stats.revenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DeliveryFilterTab)}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="in_progress">Em entrega</TabsTrigger>
          <TabsTrigger value="delivered">Entregues</TabsTrigger>
          <TabsTrigger value="failed">Falhas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {linkedDeliveriesQuery.isError && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-5 flex items-start gap-3 text-sm">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium">Falha ao carregar entregas vinculadas aos pedidos.</p>
                  <p className="text-muted-foreground">
                    As entregas manuais continuam visiveis, mas o acompanhamento de pedidos pode estar incompleto.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDeliveries.length > 0 ? (
            <div className="space-y-4">
              {filteredDeliveries.map((ride) => (
                <Card key={ride.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg">Entrega #{ride.id.slice(0, 8)}</CardTitle>
                          <Badge variant="outline">
                            {ride.source_id && ride.source_id !== businessId ? 'Pedido' : 'Manual'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ride.created_at
                            ? formatDistanceToNow(new Date(ride.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : 'Data nao informada'}
                        </p>
                      </div>
                      <Badge variant={statusVariant(ride.status)}>{statusLabel(ride.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{ride.recipient_name || 'Destinatario nao informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{ride.recipient_phone || 'Sem telefone'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{ride.package_description || `Pacote ${ride.package_size || 'small'}`}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{ride.destination || 'Destino nao informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Pagamento: {ride.payment_method || 'nao informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatMoney(ride.final_price ?? ride.suggested_price ?? 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      {ride.source_id && ride.source_id !== businessId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(businessManagementRoutes.gastronomyPedidoDetalhe(businessId, ride.source_id!))}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir pedido
                        </Button>
                      )}
                      {canCancel(ride.status) && (
                        <Button variant="destructive" size="sm" onClick={() => handleCancelClick(ride.id)}>
                          Cancelar entrega
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Nao ha entregas para este filtro no momento.
              </p>
              {activeTab === 'all' && (
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Solicitar primeiro motoboy
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {activeLocation && (
        <CreateDeliveryModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={createDelivery}
          sourceType="gastronomy"
          sourceId={businessId}
          isSubmitting={isSubmitting}
        />
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar entrega</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta entrega? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="cancellation_reason">Motivo do cancelamento</Label>
            <Input
              id="cancellation_reason"
              placeholder="Ex: Cliente cancelou o pedido"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

