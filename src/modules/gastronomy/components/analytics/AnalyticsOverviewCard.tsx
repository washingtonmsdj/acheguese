/**
 * AnalyticsOverviewCard — Card de visão geral de analytics
 *
 * Exibe métricas principais de forma resumida.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAnalyticsMetrics } from '@/modules/gastronomy/hooks';
import { Eye, QrCode, ShoppingCart, TrendingUp, DollarSign, Bike } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface AnalyticsOverviewCardProps {
  businessId: string;
  dateFrom?: string;
  dateTo?: string;
}

export function AnalyticsOverviewCard({
  businessId,
  dateFrom,
  dateTo,
}: AnalyticsOverviewCardProps) {
  const { data: metrics, isLoading } = useAnalyticsMetrics(
    'business',
    businessId,
    dateFrom,
    dateTo
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma métrica disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: Eye,
      label: 'Visualizações',
      value: metrics.total_views,
      subValue: `${metrics.unique_views} únicas`,
      color: 'text-blue-600',
    },
    {
      icon: QrCode,
      label: 'Scans de QR',
      value: metrics.qr_scans,
      subValue: `${metrics.unique_qr_scans} únicos`,
      color: 'text-purple-600',
    },
    {
      icon: ShoppingCart,
      label: 'Pedidos',
      value: metrics.orders_completed,
      subValue: `${metrics.orders_started} iniciados`,
      color: 'text-green-600',
    },
    {
      icon: DollarSign,
      label: 'Receita',
      value: `R$ ${metrics.total_order_value.toFixed(2)}`,
      subValue: `${metrics.orders_completed} pedidos`,
      color: 'text-emerald-600',
    },
    {
      icon: Bike,
      label: 'Entregas',
      value: metrics.deliveries_completed,
      subValue: `R$ ${metrics.total_delivery_fees.toFixed(2)} em taxas`,
      color: 'text-indigo-600',
    },
    {
      icon: TrendingUp,
      label: 'Conversão',
      value: `${metrics.conversion_rate.toFixed(2)}%`,
      subValue: 'views → pedidos',
      color: 'text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card"
              >
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
