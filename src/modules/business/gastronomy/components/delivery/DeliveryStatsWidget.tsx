/**
 * DeliveryStatsWidget — Widget de estatísticas de entregas
 *
 * Exibe estatísticas de entregas.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useDeliveryStats } from '@/modules/business/gastronomy/hooks';
import { Package, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

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
  const { data: stats, isLoading } = useDeliveryStats(businessId, dateFrom, dateTo);

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
          <p className="text-sm text-muted-foreground">
            Nenhuma estatística disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const deliveryRate =
    stats.total_requests > 0
      ? ((stats.delivered_requests / stats.total_requests) * 100).toFixed(1)
      : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas de Entregas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total de Entregas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total de Entregas</span>
          </div>
          <span className="text-2xl font-bold">{stats.total_requests}</span>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pendentes</span>
            <span className="font-medium">{stats.pending_requests}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Em Andamento</span>
            <span className="font-medium">{stats.in_progress_requests}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Entregues</span>
            <span className="font-medium text-green-600">{stats.delivered_requests}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Canceladas/Falhas</span>
            <span className="font-medium text-red-600">
              {stats.cancelled_requests + stats.failed_requests}
            </span>
          </div>
        </div>

        {/* Taxa de Sucesso */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
          </div>
          <span className="text-lg font-bold text-green-600">{deliveryRate}%</span>
        </div>

        {/* Receita de Entregas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Receita de Entregas</span>
          </div>
          <span className="text-lg font-bold">
            R$ {stats.total_delivery_fees.toFixed(2)}
          </span>
        </div>

        {/* Tempo Médio */}
        {stats.average_delivery_time_minutes > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tempo Médio</span>
            </div>
            <span className="text-lg font-bold">
              {stats.average_delivery_time_minutes} min
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
