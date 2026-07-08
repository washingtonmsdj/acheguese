import { Star } from 'lucide-react';
import type { RatingSummaryProps } from '../../sections/types';

export function RatingSummary({ rating, totalReviews }: RatingSummaryProps) {
  return (
    <div className="shrink-0 text-center lg:text-left">
      <p className="text-[2.8rem] font-semibold leading-none text-white xl:text-[2.45rem] [@media(max-height:1100px)]:text-[1.9rem]">
        {rating.toFixed(1)}
      </p>
      <div className="mt-1.5 flex items-center justify-center gap-0.5 lg:justify-start">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-[18px] w-[18px] xl:h-4 xl:w-4 [@media(max-height:1100px)]:h-[0.9375rem] [@media(max-height:1100px)]:w-[0.9375rem] ${
              index < Math.floor(rating) ? 'fill-teal-300 text-teal-300' : 'text-white/18'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-[13px] text-white/58 xl:text-[12px] [@media(max-height:1100px)]:text-[11px]">{totalReviews} avaliacoes</p>
    </div>
  );
}
