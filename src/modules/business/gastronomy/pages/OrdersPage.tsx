/**
 * OrdersPage - pagina de gestao de pedidos.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, RefreshCw } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOrders } from '../hooks';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderStatsWidget } from '../components/orders/OrderStatsWidget';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { Order, OrderStatus } from '@/modules/business/gastronomy/services/OrderService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export default function OrdersPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const { orders, isLoading, refetch, isRealtimeConnected, lastRealtimeEventAt } = useOrders(
    businessId!,
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  );

  const handleViewDetails = (order: Order) => {
    navigate(businessManagementRoutes.gastronomyPedidoDetalhe(businessId!, order.id));
  };

  if (!businessId) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">ID do negocio nao encontrado</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Package className="w-7 h-7 sm:w-8 sm:h-8" />
            Pedidos
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe fila, preparo, entrega e finalizacao dos pedidos.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${
                isRealtimeConnected ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isRealtimeConnected ? 'Tempo real ativo' : 'Reconectando tempo real'}
            </span>
            {lastRealtimeEventAt && (
              <span className="text-muted-foreground">
                Ultima atualizacao ha{' '}
                {formatDistanceToNowStrict(new Date(lastRealtimeEventAt), {
                  addSuffix: false,
                  locale: ptBR,
                })}
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading} className="w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <OrderStatsWidget businessId={businessId} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:max-w-xs">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="preparing">Em preparo</SelectItem>
            <SelectItem value="ready">Prontos</SelectItem>
            <SelectItem value="out_for_delivery">Saiu para entrega</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="completed">Concluidos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4" aria-label="Carregando pedidos">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg px-4">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground">
            {statusFilter !== 'all'
              ? 'Nao ha pedidos com este status.'
              : 'Aguardando o primeiro pedido da operacao.'}
          </p>
        </div>
      )}
    </div>
  );
}
