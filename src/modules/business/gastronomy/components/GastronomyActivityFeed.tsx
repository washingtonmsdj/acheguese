/**
 * GastronomyActivityFeed - Feed publico de reviews dos vizinhos
 *
 * Exibe atividades recentes de gastronomia filtradas por territorio.
 *
 * Regra de privacidade:
 * - Somente reviews publicas entram neste feed.
 */

import { motion } from 'framer-motion';
import { Heart, Loader2, MapPin, ShoppingBag, Star, Users, type LucideIcon } from 'lucide-react';
import { useGastronomyActivity } from '../hooks/useGastronomyActivity';
import type { TerritoryFilter } from '@/core/location/types';
import type { GastronomyActivity } from '../types/gastronomy';

interface GastronomyActivityFeedProps {
  territoryFilter?: TerritoryFilter;
  limit?: number;
  className?: string;
}

const ACTIVITY_ICONS: Record<GastronomyActivity['type'], LucideIcon> = {
  review: Star,
  favorite: Heart,
  order: ShoppingBag,
  visit: MapPin,
};

/**
 * Item individual de atividade
 */
function ActivityItem({
  activity,
  index,
}: {
  activity: GastronomyActivity;
  index: number;
}) {
  const ActivityIcon = ACTIVITY_ICONS[activity.type] ?? Users;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex min-w-[280px] shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm transition-colors hover:border-teal-300"
      role="listitem"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <ActivityIcon className="h-4 w-4" aria-hidden="true" />
      </span>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-950">
          <span className="font-semibold">{activity.user_name}</span>{' '}
          <span className="text-slate-700">{activity.action_label}</span>{' '}
          <span className="font-semibold text-teal-700">{activity.business_name}</span>
        </p>
        <p className="text-xs text-slate-600">{activity.time_ago}</p>
      </div>
    </motion.div>
  );
}

/**
 * Loading skeleton
 */
function ActivityFeedSkeleton() {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
      role="list"
      aria-label="Atividades recentes de gastronomia"
      tabIndex={0}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 min-w-[280px] shrink-0 animate-pulse"
        >
          <div className="w-6 h-6 bg-muted rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state
 */
function ActivityFeedEmpty() {
  return (
    <div className="text-center py-8 px-4">
      <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">
        Nenhuma atividade recente nesta região ainda.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Seja o primeiro a avaliar um estabelecimento!
      </p>
    </div>
  );
}

/**
 * Error state
 */
function ActivityFeedError() {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar as atividades.
      </p>
    </div>
  );
}

/**
 * Componente principal do feed de atividades
 */
export function GastronomyActivityFeed({
  territoryFilter,
  limit = 5,
  className = '',
}: GastronomyActivityFeedProps) {
  const { data: activities, isLoading, isError } = useGastronomyActivity(
    {
      territoryFilter,
      limit,
    },
    {
      enabled: true,
      staleTime: 1000 * 60 * 2, // 2 minutos
    }
  );

  // Não renderizar nada se estiver carregando pela primeira vez
  if (isLoading) {
    return (
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2 w-full ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground font-heading">
            Atividade dos Vizinhos
          </h2>
        </div>
        <ActivityFeedSkeleton />
      </section>
    );
  }

  // Não renderizar se houver erro
  if (isError) {
    return (
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2 w-full ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground font-heading">
            Atividade dos Vizinhos
          </h2>
        </div>
        <ActivityFeedError />
      </section>
    );
  }

  // Não renderizar se não houver atividades
  if (!activities || activities.length === 0) {
    // Em produção, ocultar seção completamente se vazia
    if (import.meta.env.PROD) {
      return null;
    }

    // Em desenvolvimento, mostrar empty state
    return (
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2 w-full ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground font-heading">
            Atividade dos Vizinhos
          </h2>
        </div>
        <ActivityFeedEmpty />
      </section>
    );
  }

  // Renderizar feed com atividades
  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2 w-full ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground font-heading">
          Atividade dos Vizinhos
        </h2>
      </div>

      {/* Lista de atividades com scroll horizontal */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        role="list"
        aria-label="Atividades recentes de gastronomia"
        tabIndex={0}
      >
        {activities.map((activity, index) => (
          <ActivityItem key={activity.id} activity={activity} index={index} />
        ))}
      </div>
    </section>
  );
}

