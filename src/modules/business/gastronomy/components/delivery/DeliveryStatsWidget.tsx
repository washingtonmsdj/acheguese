/**
 * DeliveryStatsWidget — Widget de estatísticas de entregas
 *
 * Exibe estatísticas operacionais com base em pedidos (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useOrderStats } from '@/modules/business/gastronomy/hooks';
import { Package, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatBrl } from '../../utils/currency';

interface DeliveryStatsWidgetProps {
  businessId: string;
  dateFrom?: string;
  dateTo?: string;
}

export function DeliveryStatsWidget({
  businessId,
  dateFrom,
  dateTo,
}: DeliveryStatsWidgetProps) {
  const { stats, isLoading } = useOrderStats(businessId, dateFrom, dateTo);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma estatística disponível</p>
        </CardContent>
      </Card>
    );
  }

  const totalOrders = stats.total_orders ?? 0;
  const completedOrders = stats.completed_orders ?? 0;
  const pendingOrders = stats.pending_orders ?? 0;
  const cancelledOrders = stats.cancelled_orders ?? 0;
  const inProgressOrders = Math.max(0, totalOrders - pendingOrders - completedOrders - cancelledOrders);
  const successRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas de Entregas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total de Pedidos</span>
          </div>
          <span className="text-2xl font-bold">{totalOrders}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pendentes</span>
            <span className="font-medium">{pendingOrders}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Em Andamento</span>
            <span className="font-medium">{inProgressOrders}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Concluídos</span>
            <span className="font-medium text-green-600">{completedOrders}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cancelados</span>
            <span className="font-medium text-red-600">{cancelledOrders}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
          </div>
          <span className="text-lg font-bold text-green-600">{successRate}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <span className="text-lg font-bold">{formatBrl(stats.total_revenue ?? 0)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ticket Médio</span>
          </div>
          <span className="text-lg font-bold">{formatBrl(stats.average_order_value ?? 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
