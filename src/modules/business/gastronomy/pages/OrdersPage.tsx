/**
 * OrdersPage — Página de gestão de pedidos
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderStatsWidget } from '../components/orders/OrderStatsWidget';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Package, RefreshCw } from 'lucide-react';
import type { Order, OrderStatus } from '@/modules/business/gastronomy/services/OrderService';
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
  
  const { orders, isLoading, refetch, isUpdatingStatus } = useOrders(
    businessId!,
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );

  const handleViewDetails = (order: Order) => {
    navigate(`/gastronomy/${businessId}/orders/${order.id}`);
  };

  if (!businessId) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">ID do negócio não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" />
            Pedidos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os pedidos recebidos
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <OrderStatsWidget businessId={businessId} />

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="preparing">Em Preparo</SelectItem>
              <SelectItem value="ready">Prontos</SelectItem>
              <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando pedidos...</p>
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
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground">
            {statusFilter !== 'all'
              ? 'Não há pedidos com este status'
              : 'Aguardando o primeiro pedido'}
          </p>
        </div>
      )}
    </div>
  );
}



