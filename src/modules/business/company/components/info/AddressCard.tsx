import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { getCoordinates } from '@/core/business/services/business.helpers';
import { LazyMiniMap } from '@/shared/components/maps/LazyMiniMap';
import type { AddressCardProps } from '../../sections/types';

export function AddressCard({
  business,
  addressText,
  locationText,
  onRoute,
}: AddressCardProps) {
  const addressLine = addressText || locationText || business.name;
  const locationLine =
    locationText ||
    (typeof business.address === 'object' && business.address?.postal_code
      ? `CEP ${business.address.postal_code}`
      : null);
  const coordinates = getCoordinates(business);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5 sm:p-3.5 xl:p-[0.8125rem] [@media(max-height:1100px)]:rounded-[22px] [@media(max-height:1100px)]:sm:p-2.5 [@media(max-height:860px)]:rounded-[22px] [@media(max-height:860px)]:sm:p-2.5">
      <div className="mb-2 flex items-start justify-between gap-3 [@media(max-height:1100px)]:mb-1.5 [@media(max-height:860px)]:mb-1.5">
        <h2 className="text-[1.05rem] font-semibold text-white [@media(max-height:1100px)]:text-[0.96rem] [@media(max-height:860px)]:text-[0.98rem]">Localizacao</h2>
        <button
          type="button"
          onClick={onRoute}
          className="inline-flex items-center gap-1 pt-0.5 text-[13px] font-medium text-teal-200 transition-colors hover:text-teal-100 [@media(max-height:860px)]:text-[12px]"
        >
          Ver no mapa <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 rounded-[20px] border border-white/8 bg-black/20 p-3 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-3 sm:p-3 xl:grid-cols-[188px_minmax(0,1fr)] xl:p-[0.6875rem] [@media(max-height:1100px)]:sm:grid-cols-[144px_minmax(0,1fr)] [@media(max-height:1100px)]:sm:gap-2 [@media(max-height:1100px)]:sm:p-[0.5625rem] [@media(max-height:860px)]:sm:grid-cols-[150px_minmax(0,1fr)] [@media(max-height:860px)]:sm:gap-[0.5625rem] [@media(max-height:860px)]:sm:p-[0.5625rem]">
        <div className="relative h-[6.4rem] overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(7,21,27,0.96))] sm:h-[7.65rem] xl:h-[8.8rem] [@media(max-height:1100px)]:sm:h-[5.8rem] [@media(max-height:860px)]:sm:h-[6.2rem]">
          {coordinates ? (
            <>
              <LazyMiniMap
                latitude={coordinates.latitude}
                longitude={coordinates.longitude}
                title={business.name}
                description={addressLine}
                zoom={15}
                height="100%"
                className="h-full w-full"
                markerColor="#2dd4bf"
                showControls={false}
                interactive={false}
                fallbackClassName="bg-[#0f1d26]"
              />
              <button
                type="button"
                onClick={onRoute}
                className="absolute inset-0 z-10"
                aria-label="Abrir localizacao no mapa"
              />
            </>
          ) : (
            <button
              type="button"
              onClick={onRoute}
              className="group relative flex h-full w-full items-center justify-center"
              aria-label="Abrir localizacao no mapa"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(45,212,191,0.18),transparent_25%),linear-gradient(135deg,transparent_0%,transparent_45%,rgba(45,212,191,0.16)_46%,rgba(45,212,191,0.06)_54%,transparent_55%,transparent_100%)]" />
              <div className="relative flex flex-col items-center gap-1 text-center text-white/56">
                <MapPin className="h-5 w-5 text-teal-300" />
                <span className="text-[10px] font-medium uppercase tracking-[0.14em]">Mapa indisponivel</span>
              </div>
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-1.5 xl:gap-[0.3125rem] [@media(max-height:1100px)]:gap-1 [@media(max-height:860px)]:gap-[0.3125rem]">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[0.93rem] font-medium leading-[1.375rem] text-white xl:text-[0.9rem] [@media(max-height:1100px)]:text-[0.76rem] [@media(max-height:1100px)]:leading-4 [@media(max-height:860px)]:text-[0.85rem] [@media(max-height:860px)]:leading-5">{addressLine}</p>
            {locationLine ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-[1.125rem] text-white/52 xl:text-[10.5px] [@media(max-height:1100px)]:mt-0.5 [@media(max-height:1100px)]:text-[10px] [@media(max-height:1100px)]:leading-4 [@media(max-height:860px)]:text-[10px] [@media(max-height:860px)]:leading-4">{locationLine}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRoute}
              className="inline-flex items-center gap-1 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold text-teal-100 transition-colors hover:bg-teal-400/14 xl:px-[0.8125rem] xl:py-[0.3125rem] [@media(max-height:1100px)]:px-2 [@media(max-height:1100px)]:py-[0.1875rem] [@media(max-height:1100px)]:text-[10px] [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:text-[10px]"
            >
              <Navigation className="h-3.5 w-3.5" /> Abrir no mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
