/**
 * MapRadiusControl - Controle de raio de busca no mapa
 *
 * Permite ao usuário filtrar entidades por distância.
 *
 * @module core/maps/components/v3/controls
 */
import { logger } from '@/shared/utils/logger';
import React, { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Card } from '@/shared/components/ui/card';
export interface MapRadiusControlProps {
  initialRadius?: number;
  minRadius?: number;
  maxRadius?: number;
  onRadiusPreview?: (radiusKm: number) => void;
  onRadiusChange?: (radiusKm: number) => void;
  onDisable?: () => void;
  visible?: boolean;
  isActive?: boolean;
  counts?: {
    businesses?: number;
    events?: number;
    alerts?: number;
    touristPoints?: number;
    classifieds?: number;
  };
  className?: string;
}

export function MapRadiusControl({
  initialRadius = 5,
  minRadius = 1,
  maxRadius = 50,
  onRadiusPreview,
  onRadiusChange,
  onDisable,
  visible = true,
  isActive = false,
  counts,
  className = '',
}: MapRadiusControlProps) {
  const [selectedRadius, setSelectedRadius] = useState(initialRadius);
  const radiusOptions = [1, 2, 5, 10, 15, 20, 30, 50].filter(
    (radius) => radius >= minRadius && radius <= maxRadius,
  );

  if (!visible) {
    return null;
  }

  const handleRadiusSelect = (radius: number) => {
    setSelectedRadius(radius);
    onRadiusPreview?.(radius);
  };

  const handleApply = () => {
    onRadiusChange?.(selectedRadius);
  };

  const handleDisable = () => {
    onDisable?.();
  };

  return (
    <Card className={`bg-territory-surface p-4 shadow-lg ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium text-territory-ink">
            Raio de busca
          </Label>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full border border-territory-brand/25 bg-territory-brand/10 px-2 py-0.5 text-xs font-medium text-territory-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-territory-brand"></span>
              Ativo
            </span>
          )}
        </div>

        {!isActive && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleRadiusSelect(option)}
                  className={`
                    rounded-lg px-3 py-2 text-sm font-medium transition-all
                    ${selectedRadius === option
                      ? 'bg-territory-brand text-territory-on-image shadow-md'
                      : 'bg-territory-raised text-territory-ink hover:bg-territory-brand/10'
                    }
                  `}
                >
                  {option} km
                </button>
              ))}
            </div>

            <button
              onClick={handleApply}
              className="w-full rounded-lg bg-territory-brand px-4 py-2.5 text-sm font-medium text-territory-on-image shadow-sm transition-colors hover:bg-territory-brand-strong"
            >
              Aplicar busca em {selectedRadius} km
            </button>
          </div>
        )}

        {isActive && (
          <div className="space-y-3">
            <div className="space-y-2 rounded-lg border border-territory-brand/25 bg-territory-brand/10 px-3 py-2">
              <p className="text-xs text-territory-brand">
                📍 Mostrando resultados em <strong>{selectedRadius} km</strong>
              </p>

              {counts && (
                <div className="flex flex-wrap gap-2">
                  {counts.businesses !== undefined && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-territory-border bg-territory-surface px-2 py-0.5 text-xs font-medium text-territory-ink">
                      🏢 {counts.businesses}
                    </span>
                  )}
                  {counts.events !== undefined && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-territory-border bg-territory-surface px-2 py-0.5 text-xs font-medium text-territory-ink">
                      📅 {counts.events}
                    </span>
                  )}
                  {counts.alerts !== undefined && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-territory-border bg-territory-surface px-2 py-0.5 text-xs font-medium text-territory-ink">
                      ⚠️ {counts.alerts}
                    </span>
                  )}
                  {counts.touristPoints !== undefined && counts.touristPoints > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-territory-border bg-territory-surface px-2 py-0.5 text-xs font-medium text-territory-ink">
                      🏛️ {counts.touristPoints}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleDisable}
              className="w-full rounded-lg bg-territory-raised px-3 py-2 text-sm font-medium text-territory-ink transition-colors hover:bg-territory-brand/10"
            >
              Desativar filtro
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
