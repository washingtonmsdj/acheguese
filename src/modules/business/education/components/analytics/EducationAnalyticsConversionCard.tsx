/**
 * EducationAnalyticsConversionCard
 *
 * Card com análise de conversão do pipeline de leads.
 *
 * @version 1.0.0
 */

import { Filter, Users, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';

interface PipelineStage {
  status: string;
  label: string;
  count: number;
  color: string;
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
  avgDaysToConversion: number;
  isLoading?: boolean;
}

export function EducationAnalyticsConversionCard({
  pipeline,
  conversionRate,
  avgDaysToConversion,
  isLoading = false,
}: EducationAnalyticsConversionCardProps) {
  const stages: PipelineStage[] = [
    { status: 'new', label: 'Novos', count: pipeline.new, color: 'bg-blue-500' },
    { status: 'contacted', label: 'Contactados', count: pipeline.contacted, color: 'bg-purple-500' },
    { status: 'visitScheduled', label: 'Visita Agendada', count: pipeline.visitScheduled, color: 'bg-orange-500' },
    { status: 'proposalSent', label: 'Proposta Enviada', count: pipeline.proposalSent, color: 'bg-cyan-500' },
    { status: 'enrolled', label: 'Matriculados', count: pipeline.enrolled, color: 'bg-green-500' },
  ];

  const total = stages.reduce((sum, stage) => sum + stage.count, 0) + pipeline.lost;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Pipeline de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Pipeline de Conversão
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              {conversionRate}% conversão
            </span>
            <span className="text-gray-500">
              {avgDaysToConversion} dias médios
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
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="font-medium text-gray-700">{stage.label}</span>
                  {!isLast && (
                    <span className="text-gray-400">
                      →
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{stage.count}</span>
                  <span className="text-xs text-gray-500">({percentage}%)</span>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        
        {/* Perdidos */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">Perdidos</span>
            </div>
            <span className="font-semibold">{pipeline.lost}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EducationAnalyticsConversionCard;
