/**
 * EventAnalyticsCard
 *
 * Exibe somente metricas sustentadas pelo runtime atual. Metricas de trafego,
 * favoritos, compartilhamentos e receita ficam explicitamente indisponiveis
 * enquanto nao houver instrumentacao/pagamento persistido no owner canonico.
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Users, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/utils/cn';
import type { Event } from '../types';

interface EventAnalyticsCardProps {
  event: Event;
  className?: string;
}

export function EventAnalyticsCard({ event, className }: EventAnalyticsCardProps) {
  const capacityPercentage = event.capacity
    ? Math.min((event.participants_count / event.capacity) * 100, 100)
    : null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics do evento
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            Dados persistidos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              delay={0.1}
              icon={<Users className="h-5 w-5 text-green-600" />}
              iconClassName="bg-green-500/10"
              value={event.participants_count.toLocaleString('pt-BR')}
              label="Participantes confirmados"
            >
              {capacityPercentage !== null ? (
                <div className="mt-2">
                  <Progress value={capacityPercentage} className="h-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {capacityPercentage.toFixed(0)}% da capacidade informada
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Limite de participantes nao informado.
                </p>
              )}
            </MetricCard>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Metricas adicionais
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Visualizacoes, favoritos, compartilhamentos e receita so serao
                exibidos quando houver fontes persistidas e, para receita,
                confirmacao real de pagamento.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  children,
  delay,
  icon,
  iconClassName,
  label,
  value,
}: {
  children?: ReactNode;
  delay: number;
  icon: ReactNode;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', iconClassName)}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {children}
      </div>
    </motion.div>
  );
}
