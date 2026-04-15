/**
 * NearbyBusinessCard — Card de estabelecimento próximo (modo Ao redor)
 */

import { MapPin, Star, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

export interface NearbyBusiness {
  id: string;
  name: string;
  type: NearbyBusinessType;
  category: string;
  distance: string;
  description: string;
  rating: number;
  review_count: number;
  price_range: string;
  opening_hours: string;
  is_open: boolean;
  image_url: string;
  address: string;
  neighborhood: string;
}

export type NearbyBusinessType =
  | 'restaurante'
  | 'cafe'
  | 'loja'
  | 'servico'
  | 'bar'
  | 'hotel'
  | 'experiencia';

const TYPE_CONFIG: Record<NearbyBusinessType, { label: string; emoji: string; color: string }> = {
  restaurante: { label: 'Restaurante', emoji: '🍽️', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  cafe: { label: 'Café', emoji: '☕', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  loja: { label: 'Loja', emoji: '🛍️', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  servico: { label: 'Serviço', emoji: '🔧', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  bar: { label: 'Bar', emoji: '🍸', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  hotel: { label: 'Hospedagem', emoji: '🏨', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  experiencia: { label: 'Experiência', emoji: '🎯', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

interface NearbyBusinessCardProps {
  business: NearbyBusiness;
  variant?: 'card' | 'compact';
}

export function NearbyBusinessCard({ business, variant = 'card' }: NearbyBusinessCardProps) {
  const config = TYPE_CONFIG[business.type];

  if (variant === 'compact') {
    return (
      <Card className="group hover:shadow-md transition-all cursor-pointer overflow-hidden">
        <div className="flex gap-3 p-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={business.image_url}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                {config.emoji} {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {business.distance}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {business.name}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{business.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-0.5 text-xs text-warning">
                <Star className="h-3 w-3 fill-current" />
                {business.rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground">{business.price_range}</span>
              <span className={`text-[10px] font-medium ${business.is_open ? 'text-green-500' : 'text-destructive'}`}>
                {business.is_open ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={business.image_url}
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge className={`text-xs ${config.color} backdrop-blur-sm`}>
            {config.emoji} {config.label}
          </Badge>
          <Badge variant="outline" className="text-xs bg-background/70 backdrop-blur-sm">
            {business.distance}
          </Badge>
        </div>
        {business.is_open && (
          <Badge className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] backdrop-blur-sm">
            Aberto
          </Badge>
        )}
      </div>
      <CardContent className="p-3.5">
        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
          {business.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{business.description}</p>

        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border">
          <span className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            <span className="font-semibold text-foreground">{business.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({business.review_count})</span>
          </span>
          <span className="text-xs text-muted-foreground">{business.price_range}</span>
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground ml-auto">
            <MapPin className="h-3 w-3" />
            {business.neighborhood}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
