/**
 * RatingSummary
 * 
 * Resumo de rating com nota geral e total de avaliações.
 * Exibe estrelas visuais.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Star } from 'lucide-react';
import type { RatingSummaryProps } from '../../sections/types';

export function RatingSummary({ rating, totalReviews }: RatingSummaryProps) {
  return (
    <div className="text-center shrink-0">
      <p className="text-5xl font-bold text-foreground">
        {rating.toFixed(1)}
      </p>
      <div className="flex items-center gap-0.5 mt-2 justify-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < Math.floor(rating)
                ? "text-primary fill-primary"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {totalReviews} avaliações
      </p>
    </div>
  );
}
