/**
 * OrderStatsWidget - Widget com estatisticas de pedidos
 */

import { useOrderStats } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Package, Clock, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import { formatBrl } from '../../utils/currency';

interface OrderStatsWidgetProps {
  businessId: string;
  dateFrom?: string;
  dateTo?: string;
}

export function OrderStatsWidget({ businessId, dateFrom, dateTo }: OrderStatsWidgetProps) {
  const {
    isLoading,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue,
  } = useOrderStats(businessId, dateFrom, dateTo);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando estatisticas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatisticas de pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" />
              Total
            </p>
            <p className="text-xl font-bold sm:text-2xl">{totalOrders}</p>
          </div>

          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pendentes
            </p>
            <p className="text-xl font-bold text-yellow-600 sm:text-2xl">{pendingOrders}</p>
          </div>

          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Concluidos
            </p>
            <p className="text-xl font-bold text-green-600 sm:text-2xl">{completedOrders}</p>
          </div>

          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Cancelados
            </p>
            <p className="text-xl font-bold text-red-600 sm:text-2xl">{cancelledOrders}</p>
          </div>

          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Receita
            </p>
            <p className="text-xl font-bold sm:text-2xl">{formatBrl(totalRevenue)}</p>
          </div>

          <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Ticket medio
            </p>
            <p className="text-xl font-bold sm:text-2xl">{formatBrl(averageOrderValue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
