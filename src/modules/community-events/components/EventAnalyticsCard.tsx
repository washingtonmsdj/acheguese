/**
 * EventAnalyticsCard
 *
 * Exibe apenas métricas persistidas no modelo de evento.
 * Dados ainda não instrumentados aparecem como estado vazio explícito.
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  Users,
  Eye,
  DollarSign,
  Calendar,
  Share2,
  Heart,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/utils/cn';
import { formatBrl } from '@/shared/utils/currency';
import type { Event } from '../types';

interface EventAnalyticsCardProps {
  event: Event;
  className?: string;
}

export function EventAnalyticsCard({ event, className }: EventAnalyticsCardProps) {
  const ticketsSold = event.tickets.reduce((sum, ticket) => sum + ticket.quantity_sold, 0);
  const revenueTotal = event.is_free
    ? 0
    : event.tickets.reduce((sum, ticket) => sum + ticket.quantity_sold * ticket.price, 0);
  const capacityPercentage = event.capacity
    ? Math.min((event.participants_count / event.capacity) * 100, 100)
    : 0;

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
            Dados reais
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              delay={0.1}
              icon={<Eye className="h-5 w-5 text-blue-600" />}
              iconClassName="bg-blue-500/10"
              value={event.views_count.toLocaleString('pt-BR')}
              label="Visualizações"
            />

            <MetricCard
              delay={0.2}
              icon={<Users className="h-5 w-5 text-green-600" />}
              iconClassName="bg-green-500/10"
              value={event.participants_count.toLocaleString('pt-BR')}
              label="Participantes"
            >
              {event.capacity ? (
                <div className="mt-2">
                  <Progress value={capacityPercentage} className="h-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {capacityPercentage.toFixed(0)}% da capacidade
                  </p>
                </div>
              ) : null}
            </MetricCard>

            <MetricCard
              delay={0.3}
              icon={<Heart className="h-5 w-5 text-pink-600" />}
              iconClassName="bg-pink-500/10"
              value={event.favorites_count.toLocaleString('pt-BR')}
              label="Favoritos"
            >
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  {event.shares_count.toLocaleString('pt-BR')} compartilhamentos
                </span>
              </div>
            </MetricCard>

            {!event.is_free ? (
              <MetricCard
                delay={0.4}
                icon={<DollarSign className="h-5 w-5 text-amber-600" />}
                iconClassName="bg-amber-500/10"
                value={formatBrl(revenueTotal)}
                label="Receita total"
              >
                <p className="mt-1 text-xs text-muted-foreground">
                  {ticketsSold.toLocaleString('pt-BR')} ingressos vendidos
                </p>
              </MetricCard>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <PieChart className="h-4 w-4" />
              Origem do tráfego
            </h4>
            <p className="text-sm text-muted-foreground">
              A origem do tráfego será exibida quando o tracking de eventos estiver ativo para este evento.
            </p>
          </div>

          {!event.is_free && event.tickets.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4" />
                Vendas por tipo de ingresso
              </h4>
              <div className="space-y-3">
                {event.tickets.map((ticket) => {
                  const soldPercentage = ticket.quantity_available
                    ? Math.min((ticket.quantity_sold / ticket.quantity_available) * 100, 100)
                    : 0;
                  return (
                    <div key={ticket.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{ticket.name}</span>
                        <span className="text-muted-foreground">
                          {ticket.quantity_sold}/{ticket.quantity_available}
                        </span>
                      </div>
                      <Progress value={soldPercentage} className="h-2" />
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatBrl(ticket.price)}</span>
                        <span>
                          {formatBrl(ticket.quantity_sold * ticket.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
