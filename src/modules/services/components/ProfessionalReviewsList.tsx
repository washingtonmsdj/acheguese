// @ts-nocheck
import { Star } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProfessionalReview } from "@/modules/services/hooks/useProfessionalReviews";

interface ProfessionalReviewsListProps {
  reviews: ProfessionalReview[];
  totalReviews: number;
}

export function ProfessionalReviewsList({
  reviews,
  totalReviews,
}: ProfessionalReviewsListProps) {
  return (
    <div>
      <h3 className="text-base font-bold font-display mb-2">
        Avaliações ({totalReviews})
      </h3>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma avaliação ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={review.reviewer?.avatar_url} />
                  <AvatarFallback>
                    {review.reviewer?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>

                <span className="text-sm font-medium">
                  {review.reviewer?.name || "Anônimo"}
                </span>

                <div className="flex gap-0.5 ml-auto">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 text-warning fill-warning"
                    />
                  ))}
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(review.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
