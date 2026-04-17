/**
 * DeliveryManagementPage â€” PÃ¡gina de gestÃ£o de entregas
 *
 * Gerencia solicitaÃ§Ãµes de entrega da rede de motoboys.
 * Consome hooks (SSOT).
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  useDeliveryRequests,
  useUpdateDeliveryStatus,
  useCancelDeliveryRequest,
} from '@/modules/gastronomy/hooks';
import { DeliveryRequestCard } from '@/modules/gastronomy/components/delivery/DeliveryRequestCard';
import { DeliveryStatsWidget } from '@/modules/gastronomy/components/delivery/DeliveryStatsWidget';
import { DeliveryRequestStatus } from '@/modules/gastronomy/services/DeliveryService';
import { Package, Loader2 } from 'lucide-react';
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

export default function DeliveryManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [activeTab, setActiveTab] = useState<'all' | DeliveryRequestStatus>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const updateStatusMutation = useUpdateDeliveryStatus();
  const cancelMutation = useCancelDeliveryRequest();

  // Queries por status
  const allQuery = useDeliveryRequests(businessId!, {});
  const pendingQuery = useDeliveryRequests(businessId!, { status: 'pending' });
  const acceptedQuery = useDeliveryRequests(businessId!, { status: 'accepted' });
  const inProgressQuery = useDeliveryRequests(businessId!, {
    status: 'picked_up',
  });
  const deliveredQuery = useDeliveryRequests(businessId!, { status: 'delivered' });

  const queries = {
    all: allQuery,
    pending: pendingQuery,
    accepted: acceptedQuery,
    picked_up: inProgressQuery,
    in_transit: inProgressQuery,
    delivered: deliveredQuery,
    failed: allQuery,
    cancelled: allQuery,
  };

  const currentQuery = queries[activeTab];

  const handleUpdateStatus = async (id: string, status: DeliveryRequestStatus) => {
    await updateStatusMutation.mutateAsync({ requestId: id, status });
  };

  const handleCancelClick = (id: string) => {
    setSelectedRequestId(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedRequestId) return;

    await cancelMutation.mutateAsync({
      requestId: selectedRequestId,
      reason: cancellationReason || 'Cancelado pelo estabelecimento',
    });

    setCancelDialogOpen(false);
    setSelectedRequestId(null);
    setCancellationReason('');
  };

  if (!businessId) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">ID da empresa nÃ£o encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GestÃ£o de Entregas</h1>
          <p className="text-muted-foreground">
            Gerencie as entregas da rede de motoboys
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EstatÃ­sticas */}
        <div className="lg:col-span-1">
          <DeliveryStatsWidget businessId={businessId} />
        </div>

        {/* Lista de Entregas */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes
                {pendingQuery.data && pendingQuery.data.length > 0 && (
                  <span className="ml-1 text-xs">({pendingQuery.data.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted">Aceitas</TabsTrigger>
              <TabsTrigger value="picked_up">Em Andamento</TabsTrigger>
              <TabsTrigger value="delivered">Entregues</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {currentQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : currentQuery.data && currentQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {currentQuery.data
                    .filter((req) => {
                      if (activeTab === 'all') return true;
                      if (activeTab === 'picked_up')
                        return req.status === 'picked_up' || req.status === 'in_transit';
                      return req.status === activeTab;
                    })
                    .map((request) => (
                      <DeliveryRequestCard
                        key={request.id}
                        request={request}
                        onUpdateStatus={handleUpdateStatus}
                        onCancel={handleCancelClick}
                      />
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {activeTab === 'pending'
                      ? 'NÃ£o hÃ¡ entregas aguardando aceite no momento.'
                      : activeTab === 'accepted'
                      ? 'NÃ£o hÃ¡ entregas aceitas no momento.'
                      : activeTab === 'picked_up'
                      ? 'NÃ£o hÃ¡ entregas em andamento no momento.'
                      : activeTab === 'delivered'
                      ? 'Nenhuma entrega foi concluÃ­da ainda.'
                      : 'Nenhuma solicitaÃ§Ã£o de entrega foi criada ainda.'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Entrega</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta entrega? Esta aÃ§Ã£o nÃ£o pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="cancellation_reason">Motivo do Cancelamento</Label>
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
              Cancelar Entrega
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

