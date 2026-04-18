/**
 * NearbyBusinessCard
 * 
 * Card de empresa próxima com nome, categoria, distância e rating.
 * Indicador de status (aberto/fechado).
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Store, MapPin, Star, ChevronRight } from 'lucide-react';
import type { NearbyBusinessCardProps } from '../../sections/types';

export function NearbyBusinessCard({ business, onClick }: NearbyBusinessCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg transition-all text-left group w-full"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
          <Store className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            {business.isOpen ? (
              <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="shrink-0 h-2 w-2 rounded-full bg-muted-foreground/40" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-1.5">
            {business.category}
          </p>
          
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-primary font-semibold">
              <MapPin className="h-3 w-3" /> {business.distance}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" /> {business.rating}
            </span>
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-1 shrink-0" />
      </div>
    </button>
  );
}
