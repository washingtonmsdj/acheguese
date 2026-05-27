/**
 * TouristPointDiscoveryCard — Card enriquecido para experiência item-first
 *
 * Mostra: foto, nome, categoria, bairro, gratuito/pago, horário, avaliação.
 */

import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, DollarSign, Accessibility, Baby } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types/categories';
import { PRICE_TYPE_LABELS } from '../types';
import type { TouristPointDisplay } from '../types/presentation';

interface Props {
  point: TouristPointDisplay;
  detailUrl: string;
  variant?: 'card' | 'compact';
}

export function TouristPointDiscoveryCard({ point, detailUrl, variant = 'card' }: Props) {
  const coverMedia = point.media?.find((m) => m.is_cover) ?? point.media?.[0];
  const categoryLabel = CATEGORY_LABELS[point.category] ?? point.category;
  const CategoryIcon = CATEGORY_ICONS[point.category] ?? MapPin;

  if (variant === 'compact') {
    return (
      <Link to={detailUrl} className="block group">
        <Card className="overflow-hidden hover:shadow-md transition-all border-border hover:border-primary/30">
          <div className="flex gap-4 p-3">
            {coverMedia && (
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={coverMedia.url}
                  alt={coverMedia.alt_text ?? point.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-1.5 mb-1">
                <CategoryIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {categoryLabel}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {point.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{point.summary}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {point.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    {point.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {point.location?.name ?? point.neighborhood}
                </span>
                {point.is_free && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Gratuito</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={detailUrl} className="block group">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all border-border hover:border-primary/30 group-hover:border-primary/30">
        {/* Cover image */}
        {coverMedia && (
          <div className="relative h-48 overflow-hidden bg-muted">
            <img
              src={coverMedia.url}
              alt={coverMedia.alt_text ?? point.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Featured badge */}
            {point.is_featured && (
              <div className="absolute top-2 right-2 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Destaque
              </div>
            )}
            {/* Category badge */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-background/85 text-foreground backdrop-blur-sm text-xs border-0 gap-1">
                <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {categoryLabel}
              </Badge>
            </div>
            {/* Price badge */}
            <div className="absolute bottom-2 left-2">
              <Badge
                className={`backdrop-blur-sm text-xs border-0 ${
                  point.is_free
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-background/85 text-foreground'
                }`}
              >
                {point.is_free ? 'Gratuito' : PRICE_TYPE_LABELS[point.price_type]}
              </Badge>
            </div>
            {/* Rating */}
            {point.rating > 0 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/85 backdrop-blur-sm rounded-full px-2 py-1">
                <Star className="h-3 w-3 text-warning fill-warning" />
                <span className="text-xs font-semibold text-foreground">{point.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
            {point.title}
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {point.summary}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {point.location?.name ?? point.neighborhood}
            </span>
            {point.opening_hours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[100px]">{point.opening_hours}</span>
              </span>
            )}
          </div>

          {/* Feature pills */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {point.is_accessible && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                <Accessibility className="h-2.5 w-2.5" /> Acessível
              </Badge>
            )}
            {point.is_family_friendly && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                <Baby className="h-2.5 w-2.5" /> Família
              </Badge>
            )}
            {point.review_count > 0 && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {point.review_count.toLocaleString('pt-BR')} avaliações
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
