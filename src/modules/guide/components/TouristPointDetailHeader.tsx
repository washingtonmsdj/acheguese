/**
 * TouristPointDetailHeader — Cabeçalho da página de detalhe
 */

import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import type { TouristPoint } from '../types';
import { PRICE_TYPE_LABELS } from '../types';

interface TouristPointDetailHeaderProps {
  point: TouristPoint;
}

export function TouristPointDetailHeader({ point }: TouristPointDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex-1">
          {point.title}
        </h1>
        {point.is_featured && (
          <Badge className="bg-warning/15 text-warning border-warning/30 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Destaque
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {point.summary}
      </p>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {PRICE_TYPE_LABELS[point.price_type]}
          {point.price_text ? ` — ${point.price_text}` : ''}
        </Badge>

        {point.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {point.location.full_name}
          </span>
        )}
      </div>
    </div>
  );
}
