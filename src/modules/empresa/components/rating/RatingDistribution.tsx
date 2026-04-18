/**
 * RatingDistribution
 * 
 * Distribuição de avaliações por estrelas (1-5).
 * Exibe barras de progresso com percentuais.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Star } from 'lucide-react';
import type { RatingDistributionProps } from '../../sections/types';

export function RatingDistribution({ reviews }: RatingDistributionProps) {
  return (
    <div className="flex-1 w-full space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
        
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-3">{star}</span>
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-6 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
