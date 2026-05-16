/**
 * EVENT ANALYTICS CARD
 * 
 * Card com analytics detalhados de um evento
 * Gráficos, métricas e insights
 * 
 * @version 1.0.0
 */

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  DollarSign,
  Calendar,
  MapPin,
  Share2,
  Heart,
  MessageCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
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
  // Mock analytics data
  const analytics = {
    views: {
      total: event.views_count,
      trend: 12,
      lastWeek: Math.floor(event.views_count * 0.3),
    },
    participants: {
      total: event.participants_count,
      trend: 8,
      capacity: event.capacity || 0,
      percentage: event.capacity ? (event.participants_count / event.capacity) * 100 : 0,
    },
    engagement: {
      likes: Math.floor(event.views_count * 0.15),
      shares: Math.floor(event.views_count * 0.05),
      comments: Math.floor(event.views_count * 0.03),
    },
    revenue: {
      total: event.is_free ? 0 : event.tickets.reduce((sum, t) => sum + (t.quantity_sold * t.price), 0),
      trend: 15,
      ticketsSold: event.tickets.reduce((sum, t) => sum + t.quantity_sold, 0),
    },
    traffic: {
      direct: 45,
      social: 30,
      search: 15,
      referral: 10,
    },
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics do Evento
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            Últimos 30 dias
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Main Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Views */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  analytics.views.trend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {analytics.views.trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(analytics.views.trend)}%
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {analytics.views.total.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">Visualizações</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  +{analytics.views.lastWeek} esta semana
                </p>
              </div>
            </motion.div>

            {/* Participants */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  analytics.participants.trend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {analytics.participants.trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(analytics.participants.trend)}%
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {analytics.participants.total.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">Participantes</p>
                {event.capacity > 0 && (
                  <div className="mt-2">
                    <Progress value={analytics.participants.percentage} className="h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {analytics.participants.percentage.toFixed(0)}% da capacidade
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Engagement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {analytics.engagement.likes.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">Curtidas</p>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {analytics.engagement.shares}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {analytics.engagement.comments}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Revenue */}
            {!event.is_free && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    analytics.revenue.trend > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {analytics.revenue.trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(analytics.revenue.trend)}%
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    R$ {analytics.revenue.total.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {analytics.revenue.ticketsSold} ingressos vendidos
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Traffic Sources */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <PieChart className="h-4 w-4" />
              Origem do Tráfego
            </h4>
            <div className="space-y-3">
              {Object.entries(analytics.traffic).map(([source, percentage]) => (
                <div key={source}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">
                      {source === 'direct' ? 'Direto' : 
                       source === 'social' ? 'Redes Sociais' :
                       source === 'search' ? 'Busca' : 'Referência'}
                    </span>
                    <span className="font-medium text-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Sales Breakdown */}
          {!event.is_free && event.tickets.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4" />
                Vendas por Tipo de Ingresso
              </h4>
              <div className="space-y-3">
                {event.tickets.map((ticket) => {
                  const soldPercentage = (ticket.quantity_sold / ticket.quantity_available) * 100;
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
                        <span>R$ {ticket.price.toFixed(2)}</span>
                        <span>
                          R$ {(ticket.quantity_sold * ticket.price).toLocaleString('pt-BR')}
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
