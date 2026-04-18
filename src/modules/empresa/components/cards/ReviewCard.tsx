/**
 * ReviewCard
 * 
 * Card de avaliação com avatar, nome, rating, comentário e data.
 * Badge de "Vizinho" para usuários locais.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Star, Home } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { formatDate, getInitials } from '../../utils';
import type { ReviewCardProps } from '../../sections/types';

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
          {getInitials(review.user_name)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">
                {review.user_name}
              </h3>
              {review.isNeighbor && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-primary/30 text-primary"
                >
                  <Home className="h-2.5 w-2.5 mr-0.5" /> Vizinho
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(review.created_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < review.rating
                    ? "text-primary fill-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );
}
