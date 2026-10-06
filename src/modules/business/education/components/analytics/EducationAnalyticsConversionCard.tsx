/**
 * EducationAnalyticsConversionCard
 *
 * Card com análise de conversão do pipeline de leads.
 *
 * @version 1.0.0
 */

import { Filter, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface PipelineStage {
  status: string;
  label: string;
  count: number;
  dotClassName: string;
  barClassName: string;
}

interface EducationAnalyticsConversionCardProps {
  pipeline: {
    new: number;
    contacted: number;
    visitScheduled: number;
    proposalSent: number;
    enrolled: number;
    lost: number;
  };
  conversionRate: number;
  avgDaysToFirstContact: number | null;
  isLoading?: boolean;
}

export function EducationAnalyticsConversionCard({
  pipeline,
  conversionRate,
  avgDaysToFirstContact,
  isLoading = false,
}: EducationAnalyticsConversionCardProps) {
  const stages: PipelineStage[] = [
    {
      status: 'new',
      label: 'Novos',
      count: pipeline.new,
      dotClassName: 'bg-territory-info',
      barClassName: 'bg-territory-info',
    },
    {
      status: 'contacted',
      label: 'Contactados',
      count: pipeline.contacted,
      dotClassName: 'bg-territory-brand',
      barClassName: 'bg-territory-brand',
    },
    {
      status: 'visitScheduled',
      label: 'Visita Agendada',
      count: pipeline.visitScheduled,
      dotClassName: 'bg-territory-warning',
      barClassName: 'bg-territory-warning',
    },
    {
      status: 'proposalSent',
      label: 'Proposta Enviada',
      count: pipeline.proposalSent,
      dotClassName: 'bg-territory-sun',
      barClassName: 'bg-territory-sun',
    },
    {
      status: 'enrolled',
      label: 'Matriculados',
      count: pipeline.enrolled,
      dotClassName: 'bg-territory-success',
      barClassName: 'bg-territory-success',
    },
  ];

  const total = stages.reduce((sum, stage) => sum + stage.count, 0) + pipeline.lost;

  if (isLoading) {
    return (
      <Card className="border-territory-border bg-territory-surface text-territory-ink">
        <CardHeader>
          <CardTitle className="font-heading text-sm font-medium text-territory-muted">
            Distribuição do pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 rounded bg-territory-raised motion-safe:animate-pulse"
              aria-hidden="true"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-territory-border bg-territory-surface text-territory-ink">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 font-heading text-sm font-medium text-territory-muted">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Pipeline de Conversão
          </CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-1 text-territory-success">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              {conversionRate}% conversão
            </span>
            <span className="text-territory-muted">
              {avgDaysToFirstContact == null
                ? 'Sem contatos medidos'
                : `${avgDaysToFirstContact} dias até o 1º contato`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage, index) => {
          const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.status} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={`h-3 w-3 shrink-0 rounded-full ${stage.dotClassName}`}
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium text-territory-ink">{stage.label}</span>
                  {!isLast ? (
                    <span className="text-territory-muted" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-territory-ink">{stage.count}</span>
                  <span className="text-xs text-territory-muted">({percentage}%)</span>
                </div>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-territory-raised"
                role="progressbar"
                aria-label={`${stage.label}: ${percentage}% do pipeline`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
              >
                <div
                  className={`h-full rounded-full transition-[width] ${stage.barClassName}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="border-t border-territory-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-territory-error">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">Perdidos</span>
            </div>
            <span className="font-semibold text-territory-ink">{pipeline.lost}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EducationAnalyticsConversionCard;
