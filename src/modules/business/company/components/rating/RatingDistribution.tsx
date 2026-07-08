import { Star } from 'lucide-react';
import type { RatingDistributionProps } from '../../sections/types';

export function RatingDistribution({
  reviews,
  ratingBreakdown,
  totalReviews,
}: RatingDistributionProps) {
  return (
    <div className="w-full flex-1 space-y-2 xl:space-y-1.5 [@media(max-height:1100px)]:space-y-[0.275rem]">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = ratingBreakdown?.[star as keyof typeof ratingBreakdown]
          ?? reviews.filter((review) => review.rating === star).length;
        const denominator = totalReviews && totalReviews > 0 ? totalReviews : reviews.length;
        const pct = denominator > 0 ? (count / denominator) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2 xl:gap-1.5 [@media(max-height:1100px)]:gap-[0.275rem]">
            <span className="w-3 text-xs text-white/48 xl:text-[11px] [@media(max-height:1100px)]:text-[10px]">{star}</span>
            <Star className="h-3.5 w-3.5 fill-teal-300 text-teal-300 xl:h-3 xl:w-3 [@media(max-height:1100px)]:h-[0.6875rem] [@media(max-height:1100px)]:w-[0.6875rem]" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8 xl:h-[0.3125rem] [@media(max-height:1100px)]:h-1">
              <div
                className="h-full rounded-full bg-teal-300 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs text-white/48 xl:text-[11px] [@media(max-height:1100px)]:text-[10px]">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
