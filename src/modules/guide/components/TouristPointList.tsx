/**
 * TouristPointList — Grid de cards de pontos turísticos
 */

import { Loader2, Star } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { TouristPointCard } from './TouristPointCard';
import { TouristPointEmptyState } from './TouristPointEmptyState';
import type { TouristPoint } from '../types';

interface TouristPointListProps {
  points: TouristPoint[];
  isLoading: boolean;
  getDetailUrl: (slug: string) => string;
  territoryName?: string;
}

export function TouristPointList({
  points,
  isLoading,
  getDetailUrl,
  territoryName,
}: TouristPointListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!points.length) {
    return <TouristPointEmptyState territoryName={territoryName} />;
  }

  const featured = points.filter((p) => p.is_featured);
  const regular  = points.filter((p) => !p.is_featured);

  return (
    <div className="space-y-10">
      {featured.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-warning fill-warning" />
            <h2 className="text-base font-bold text-foreground">Destaques</h2>
            <Badge variant="secondary" className="text-xs">{featured.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((point) => (
              <TouristPointCard
                key={point.id}
                point={point}
                detailUrl={getDetailUrl(point.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {regular.length > 0 && (
        <section>
          {featured.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-foreground">Todos os pontos</h2>
              <Badge variant="secondary" className="text-xs">{regular.length}</Badge>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regular.map((point) => (
              <TouristPointCard
                key={point.id}
                point={point}
                detailUrl={getDetailUrl(point.slug)}
              />
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {points.length} ponto{points.length !== 1 ? 's' : ''} turístico{points.length !== 1 ? 's' : ''}
        {territoryName ? ` em ${territoryName}` : ''}
      </p>
    </div>
  );
}
