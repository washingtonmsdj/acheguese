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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: GraduationCap,
      label: 'Programas',
      value: programs.total,
      change: `${programs.active} ativos`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Calendar,
      label: 'Eventos',
      value: events.total,
      change: `${events.upcoming} próximos`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: TrendingUp,
      label: 'Taxa de Conversão',
      value: `${leads.conversionRate}%`,
      change: `${leads.enrolled} matriculados`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">
          Visão Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.label}</p>
              <p className="text-xs text-gray-400">{metric.change}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default EducationAnalyticsOverviewCard;
