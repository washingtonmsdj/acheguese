/**
 * AnalyticsEngagementCard — Card de métricas de engajamento
 *
 * Exibe cliques, compartilhamentos e favoritos.
 * Consome hooks (SSOT).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAnalyticsMetrics } from '@/modules/gastronomy/hooks';
import { Phone, MessageCircle, MapPin, Share2, Heart } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface AnalyticsEngagementCardProps {
  businessId: string;
  dateFrom?: string;
  dateTo?: string;
}

export function AnalyticsEngagementCard({
  businessId,
  dateFrom,
  dateTo,
}: AnalyticsEngagementCardProps) {
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
          <CardTitle>Engajamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma métrica disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const engagementStats = [
    {
      icon: Phone,
      label: 'Cliques no Telefone',
      value: metrics.clicks_phone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: MessageCircle,
      label: 'Cliques no WhatsApp',
      value: metrics.clicks_whatsapp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: MapPin,
      label: 'Cliques em Direções',
      value: metrics.clicks_directions,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: Share2,
      label: 'Compartilhamentos',
      value: metrics.shares,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Heart,
      label: 'Favoritos',
      value: metrics.favorites_added,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  const totalEngagement = engagementStats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engajamento</CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalEngagement} interações totais
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {engagementStats.map((stat) => {
          const Icon = stat.icon;
          const percentage =
            totalEngagement > 0 ? ((stat.value / totalEngagement) * 100).toFixed(1) : '0';

          return (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{percentage}% do total</p>
                </div>
              </div>
              <span className="text-lg font-bold">{stat.value}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
