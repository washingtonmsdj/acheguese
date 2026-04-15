/**
 * OrderStatsWidget — Widget com estatísticas de pedidos
 */

import { useOrderStats } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Package, Clock, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';

interface OrderStatsWidgetProps {
  businessId: string;
  dateFrom?: string;
  dateTo?: string;
}

export function OrderStatsWidget({ businessId, dateFrom, dateTo }: OrderStatsWidgetProps) {
  const {
    stats,
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
          <p className="text-center text-muted-foreground">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas de Pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" />
              Total
            </p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pendentes
            </p>
            <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Concluídos
            </p>
            <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Cancelados
            </p>
            <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Receita
            </p>
            <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Ticket Médio
            </p>
            <p className="text-2xl font-bold">R$ {averageOrderValue.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
