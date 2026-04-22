/**
 * AnalyticsChartCard — Card com gráfico de métricas diárias
 *
 * Exibe evolução de métricas ao longo do tempo.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useDailyMetrics } from '@/modules/business/gastronomy/hooks';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnalyticsChartCardProps {
  businessId: string;
  dateFrom?: string;
  dateTo?: string;
}

export function AnalyticsChartCard({
  businessId,
  dateFrom,
  dateTo,
}: AnalyticsChartCardProps) {
  const { data: dailyMetrics, isLoading } = useDailyMetrics(
    'business',
    businessId,
    dateFrom,
    dateTo
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!dailyMetrics || dailyMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Formata dados para o gráfico
  const chartData = dailyMetrics.map((metric) => ({
    date: format(new Date(metric.date), 'dd/MM', { locale: ptBR }),
    fullDate: format(new Date(metric.date), 'dd/MM/yyyy', { locale: ptBR }),
    views: metric.total_views,
    uniqueViews: metric.unique_views,
    qrScans: metric.qr_scans,
    orders: metric.orders_completed,
    revenue: metric.total_order_value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução de Métricas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate;
                }
                return label;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Visualizações"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="qrScans"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Scans QR"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="Pedidos"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
