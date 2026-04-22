/**
 * FacilitiesCard
 * 
 * Card de facilidades com ícones e labels.
 * Usa constantes do SSOT para ícones e labels.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Store } from 'lucide-react';
import { getFacilityIcon, getFacilityLabel } from '@/core/business/constants';
import type { FacilitiesCardProps } from '../../sections/types';

export function FacilitiesCard({ facilidades }: FacilitiesCardProps) {
  if (!facilidades || facilidades.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-base font-bold text-foreground mb-3">Facilidades</h2>
      <div className="space-y-2.5">
        {facilidades.map((fac, idx) => {
          const Icon = getFacilityIcon(fac) || Store;
          const label = getFacilityLabel(fac) || fac.replace(/_/g, " ");
          
          return (
            <div
              key={idx}
              className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2.5"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
