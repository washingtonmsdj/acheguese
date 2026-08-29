import { ChevronRight, Navigation } from 'lucide-react';
import { LAUNCH_URLS } from '@/core/routing/config/territory';
import { buildBusinessPublicListingUrl } from '@/core/business/utils/businessPublicUrls';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';
import { NearbyBusinessCard } from '../components/cards';
import type { EmpresaProximasSectionProps } from './types';

export function EmpresaProximasSection({
  nearbyBusinesses,
  currentBusinessId,
  currentBusinessGeographicPath,
  embedded = false,
  maxItems = 4,
  layout = "column",
  navigate,
}: EmpresaProximasSectionProps) {
  const buildBusinessesHubUrl = () => {
    const [state, city, district] = normalizePublicTerritoryPath(
      currentBusinessGeographicPath || '',
    ).split('/').filter(Boolean);

    if (state && city) {
      return buildBusinessPublicListingUrl({ state, city, district });
    }

    return LAUNCH_URLS.business;
  };

  const filteredBusinesses = nearbyBusinesses
    .filter((business) => business.id !== currentBusinessId)
    .slice(0, maxItems);

  if (filteredBusinesses.length === 0) return null;

  const content = (
    <div
      className={
        embedded
          ? layout === "row"
            ? 'grid grid-cols-[230px_minmax(0,1fr)] items-center gap-3 rounded-[24px] border border-white/10 bg-[#0c151c]/96 p-3 [@media(max-height:1100px)]:grid-cols-[190px_minmax(0,1fr)] [@media(max-height:1100px)]:gap-2 [@media(max-height:1100px)]:rounded-[22px] [@media(max-height:1100px)]:p-[0.5625rem]'
            : 'rounded-[26px] border border-white/10 bg-[#0c151c]/96 p-[1.125rem] sm:p-5 [@media(max-height:1100px)]:rounded-[24px] [@media(max-height:1100px)]:p-3'
          : ''
      }
    >
        <div className={layout === "row" ? 'flex min-w-0 flex-col items-start gap-1' : 'mb-2.5 flex items-center justify-between [@media(max-height:1100px)]:mb-1.5'}>
          <div className={layout === "row" ? 'flex min-w-0 items-center gap-2' : 'flex items-center gap-2'}>
            <Navigation className={layout === "row" ? 'h-[18px] w-[18px] text-teal-300' : 'h-5 w-5 text-teal-300'} />
            <h2 className={layout === "row" ? 'whitespace-nowrap text-[0.96rem] font-semibold text-white [@media(max-height:1100px)]:text-[0.9rem]' : 'text-lg font-semibold text-white'}>Empresas proximas</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate?.(buildBusinessesHubUrl())}
            className={layout === "row" ? 'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-teal-200 hover:text-teal-100' : 'inline-flex items-center gap-1 text-xs font-medium text-teal-200 hover:text-teal-100'}
          >
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          className={
            embedded
              ? layout === "row"
                ? 'grid grid-cols-3 gap-2 [@media(max-height:1100px)]:gap-1.5'
                : 'grid grid-cols-1 gap-[0.3125rem] [@media(max-height:1100px)]:gap-1'
              : 'grid grid-cols-1 gap-2.5 sm:grid-cols-2'
          }
        >
          {filteredBusinesses.map((business) => (
            <NearbyBusinessCard
              key={business.id}
              business={business}
              compact={embedded && layout === "row"}
              onClick={() => navigate?.(business.canonicalUrl ?? buildBusinessesHubUrl())}
            />
          ))}
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="mx-auto mt-8 hidden w-full max-w-[1400px] px-4 pb-8 sm:px-6 lg:block xl:px-8 2xl:max-w-[1480px] 2xl:px-10">
      {content}
    </section>
  );
}
