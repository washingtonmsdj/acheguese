/**
 * TouristPointCard — Card de ponto turístico para listagem
 */

import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { TouristPoint } from '../types';
import { PRICE_TYPE_LABELS } from '../types';

interface TouristPointCardProps {
  point: TouristPoint;
  detailUrl: string;
}

export function TouristPointCard({ point, detailUrl }: TouristPointCardProps) {
  const coverMedia = point.media?.find((m) => m.is_cover) ?? point.media?.[0];

  return (
    <Link to={detailUrl} className="block group">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all border-border hover:border-primary/30 group-hover:border-primary/30">
        {/* Cover image */}
        {coverMedia && (
          <div className="relative h-44 overflow-hidden bg-muted">
            <img
              src={coverMedia.url}
              alt={coverMedia.alt_text ?? point.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {point.is_featured && (
              <div className="absolute top-2 right-2 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Destaque
              </div>
            )}
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-background/85 text-foreground backdrop-blur-sm text-xs border-0">
                {PRICE_TYPE_LABELS[point.price_type]}
              </Badge>
            </div>
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {!coverMedia && (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {point.title}
                </h3>
                {point.is_featured && !coverMedia && (
                  <Star className="h-3.5 w-3.5 text-warning fill-warning flex-shrink-0" />
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                {point.summary}
              </p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {point.address_text && (
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {point.address_text}
                  </span>
                )}
                {point.opening_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {point.opening_hours}
                  </span>
                )}
                {!coverMedia && (
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {PRICE_TYPE_LABELS[point.price_type]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
