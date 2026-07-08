import { Home, Star } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { formatDate, getInitials } from '../../utils';
import type { ReviewCardProps } from '../../sections/types';

export function ReviewCard({ review, compact = false }: ReviewCardProps) {
  return (
    <div
      className={[
        'rounded-[22px] border border-white/10 bg-white/[0.03]',
        compact ? 'p-3 xl:p-2.5 [@media(max-height:1100px)]:p-[0.4375rem]' : 'p-4 [@media(max-height:1100px)]:p-3.5',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 [@media(max-height:1100px)]:gap-[0.5625rem]">
        <div
          className={[
            'flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-teal-500/12 text-sm font-bold text-teal-100',
              compact ? 'h-10 w-10 [@media(max-height:1100px)]:h-[1.875rem] [@media(max-height:1100px)]:w-[1.875rem]' : 'h-11 w-11',
          ].join(' ')}
        >
          {review.avatar ? (
            <img src={review.avatar} alt="" aria-hidden="true" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            getInitials(review.user_name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2 [@media(max-height:1100px)]:mb-[0.3125rem]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-white [@media(max-height:1100px)]:text-[13px]">{review.user_name}</h3>
                {review.isNeighbor ? (
                  <Badge className="border border-teal-400/20 bg-teal-400/10 text-[10px] text-teal-100">
                    <Home className="mr-1 h-2.5 w-2.5" /> Vizinho
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs text-white/42">{formatDate(review.created_at)}</span>
            </div>

            <div className="flex items-center gap-0.5 rounded-full border border-white/8 bg-black/20 px-2 py-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={
                    index < review.rating
                      ? 'h-3.5 w-3.5 fill-amber-300 text-amber-300'
                      : 'h-3.5 w-3.5 text-white/18'
                  }
                />
              ))}
            </div>
          </div>

          <p
            className={[
              'text-white/66',
              compact ? 'text-[13px] leading-5 line-clamp-2 xl:line-clamp-1 [@media(max-height:1100px)]:text-[11px] [@media(max-height:1100px)]:leading-4 [@media(max-height:1100px)]:line-clamp-2' : 'text-sm leading-6 [@media(max-height:1100px)]:line-clamp-3',
            ].join(' ')}
          >
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );
}
