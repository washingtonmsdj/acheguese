/**
 * EducationAnalyticsOverviewCard
 *
 * Card com visão geral de métricas do módulo Education.
 *
 * @version 1.0.0
 */

import { Users, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface EducationAnalyticsOverviewCardProps {
  leads: {
    total: number;
    new: number;
    enrolled: number;
    conversionRate: number;
  };
  programs: {
    total: number;
    active: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
  isLoading?: boolean;
}

export function EducationAnalyticsOverviewCard({
  leads,
  programs,
  events,
  isLoading = false,
}: EducationAnalyticsOverviewCardProps) {
  if (isLoading) {
    return (
      <Card className="border-territory-border bg-territory-surface text-territory-ink">
        <CardHeader>
          <CardTitle className="font-heading text-sm font-medium text-territory-muted">
            Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-territory-raised"
              aria-hidden="true"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      icon: Users,
      label: 'Total de Leads',
      value: leads.total,
      change: `+${leads.new} novos`,
      iconClassName: 'text-territory-info',
      iconSurfaceClassName: 'bg-territory-info/10',
    },
    {
      icon: GraduationCap,
      label: 'Programas',
      value: programs.total,
      change: `${programs.active} ativos`,
      iconClassName: 'text-territory-success',
      iconSurfaceClassName: 'bg-territory-success/10',
    },
    {
      icon: Calendar,
      label: 'Eventos',
      value: events.total,
      change: `${events.upcoming} próximos`,
      iconClassName: 'text-territory-warning',
      iconSurfaceClassName: 'bg-territory-warning/10',
    },
    {
      icon: TrendingUp,
      label: 'Taxa de Conversão',
      value: `${leads.conversionRate}%`,
      change: `${leads.enrolled} matriculados`,
      iconClassName: 'text-territory-brand',
      iconSurfaceClassName: 'bg-territory-brand/10',
    },
  ];

  return (
    <Card className="border-territory-border bg-territory-surface text-territory-ink">
      <CardHeader>
        <CardTitle className="font-heading text-sm font-medium text-territory-muted">
          Visão Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.iconSurfaceClassName}`}
            >
              <metric.icon
                className={`h-5 w-5 ${metric.iconClassName}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-2xl font-bold text-territory-ink">{metric.value}</p>
              <p className="text-sm text-territory-muted">{metric.label}</p>
              <p className="text-xs text-territory-muted">{metric.change}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default EducationAnalyticsOverviewCard;
