import { ChevronRight, MapPin, Star } from 'lucide-react';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import type { NearbyBusinessCardProps } from '../../sections/types';

export function NearbyBusinessCard({
  business,
  onClick,
  compact = false,
}: NearbyBusinessCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full border border-territory-on-image/10 bg-territory-image-overlay/18 text-left transition-all duration-200 hover:border-territory-action-on-image/24 hover:bg-territory-on-image/[0.05]',
        compact
          ? 'rounded-[18px] px-2.5 py-2 [@media(max-height:1100px)]:rounded-[16px] [@media(max-height:1100px)]:px-2 [@media(max-height:1100px)]:py-1.5'
          : 'rounded-[20px] p-2.5 [@media(max-height:1100px)]:rounded-[16px] [@media(max-height:1100px)]:p-1.5',
      ].join(' ')}
    >
      <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-2.5 [@media(max-height:1100px)]:gap-2'}>
        <div
          className={[
            'flex shrink-0 items-center justify-center overflow-hidden border border-territory-on-image/10 bg-territory-image-overlay/92 shadow-territory-highlight',
            compact
              ? 'h-11 w-11 rounded-[12px] [@media(max-height:1100px)]:h-9 [@media(max-height:1100px)]:w-9 [@media(max-height:1100px)]:rounded-[10px]'
              : 'h-12 w-12 rounded-[14px] [@media(max-height:1100px)]:h-[2.125rem] [@media(max-height:1100px)]:w-[2.125rem] [@media(max-height:1100px)]:rounded-[10px]',
          ].join(' ')}
        >
          {business.imageUrl ? (
            <img
              src={business.imageUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          ) : (
            <BusinessLogo
              name={business.name}
              logoUrl={business.logoUrl}
              alt={business.name}
              className="object-contain p-2.5"
              initialsClassName="text-xl text-territory-action-on-image"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className={compact ? 'flex items-center justify-between gap-3' : 'mb-1 flex items-start justify-between gap-3 [@media(max-height:1100px)]:mb-0.5'}>
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-semibold text-territory-on-image transition-colors group-hover:text-territory-action-on-image [@media(max-height:1100px)]:text-[12px]">
                {business.name}
              </h3>
              <div className={compact ? 'mt-0.5 flex items-center gap-1.5 text-[11px] text-territory-on-image/48 [@media(max-height:1100px)]:text-[10px]' : 'mt-0.5 flex items-center gap-1.5 text-[11px] text-territory-on-image/48 [@media(max-height:1100px)]:mt-0 [@media(max-height:1100px)]:text-[9px]'}>
                <span className="truncate">{business.category}</span>
                {business.distance ? <span className="text-territory-on-image/26">/</span> : null}
                {business.distance ? <span className="truncate text-territory-action-on-image">{business.distance}</span> : null}
              </div>
            </div>

            {business.rating > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-territory-on-image/10 bg-territory-on-image/[0.03] px-2 py-0.5 text-[11px] font-medium text-territory-on-image/72">
                <Star className="h-3 w-3 fill-territory-sun text-territory-sun" />
                {business.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          {!compact ? (
            <div className="flex items-center gap-2 text-[11px] [@media(max-height:1100px)]:text-[9px]">
              {business.locationLabel ? (
                <span className="flex min-w-0 items-center gap-1 text-territory-on-image/52">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-territory-action-on-image [@media(max-height:1100px)]:h-3 [@media(max-height:1100px)]:w-3" />
                  <span className="truncate">{business.locationLabel}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {!compact ? (
          <div className="flex shrink-0 items-center gap-2">
            <ChevronRight className="h-4 w-4 text-territory-on-image/34 transition-colors group-hover:text-territory-action-on-image" />
          </div>
        ) : null}
      </div>
    </button>
  );
}
