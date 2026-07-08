import { Store } from 'lucide-react';
import { getFacilityIcon, getFacilityLabel } from '@/core/business/constants';
import type { FacilitiesCardProps } from '../../sections/types';

export function FacilitiesCard({ facilidades }: FacilitiesCardProps) {
  if (!facilidades || facilidades.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-white">Facilidades</h2>
      <div className="space-y-2">
        {facilidades.map((facility, index) => {
          const Icon = getFacilityIcon(facility) || Store;
          const label = getFacilityLabel(facility) || facility.replace(/_/g, ' ');

          return (
            <div
              key={`${facility}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-[0.5625rem]"
            >
              <Icon className="h-4 w-4 shrink-0 text-teal-300" />
              <span className="text-sm font-medium text-white/78">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
