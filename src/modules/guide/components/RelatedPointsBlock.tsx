/**
 * RelatedPointsBlock — Lugares relacionados
 *
 * Mostra outros pontos turísticos da mesma região ou categoria.
 */

import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types/categories';
import type { TouristPointDisplay } from '../types/presentation';

interface RelatedPointsBlockProps {
  points: TouristPointDisplay[];
  currentPointId: string;
  category?: string;
  neighborhood?: string;
  buildDetailUrl: (slug: string) => string;
}

export function RelatedPointsBlock({
  points,
  currentPointId,
  category,
  neighborhood,
  buildDetailUrl,
}: RelatedPointsBlockProps) {
  // Get related points: same category or neighborhood, excluding current
  const related = points
    .filter((p) => p.id !== currentPointId)
    .filter((p) => p.category === category || p.neighborhood === neighborhood)
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h2 className="text-lg font-bold text-foreground mb-1">Lugares relacionados</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Outros pontos turísticos que você pode gostar
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((point) => (
          <RelatedPointCard key={point.id} point={point} detailUrl={buildDetailUrl(point.slug)} />
        ))}
      </div>
    </div>
  );
}

function RelatedPointCard({ point, detailUrl }: { point: TouristPointDisplay; detailUrl: string }) {
  const coverUrl = point.media?.[0]?.url;
  const catLabel = CATEGORY_LABELS[point.category] ?? point.category;
  const CategoryIcon = CATEGORY_ICONS[point.category] ?? MapPin;

  return (
    <Link
      to={detailUrl}
      className="group flex gap-3 rounded-xl border border-border bg-card p-2.5 hover:shadow-md transition-all"
    >
      {coverUrl && (
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={coverUrl}
            alt={point.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {point.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <CategoryIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{catLabel}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          {point.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-warning">
              <Star className="h-3 w-3 fill-current" />
              {point.rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {point.location?.name ?? point.neighborhood}
          </span>
          {point.is_free && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-600">
              Gratuito
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
