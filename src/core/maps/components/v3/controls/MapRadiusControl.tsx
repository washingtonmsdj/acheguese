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
  /** Raio inicial em km */
  initialRadius?: number;
  /** Raio mínimo em km */
  minRadius?: number;
  /** Raio máximo em km */
  maxRadius?: number;
  /** Callback para preview do raio (mostra círculo sem buscar) */
  onRadiusPreview?: (radiusKm: number) => void;
  /** Callback quando raio é aplicado (executa busca) */
  onRadiusChange?: (radiusKm: number) => void;
  /** Callback quando filtro é desativado */
  onDisable?: () => void;
  /** Mostrar controle */
  visible?: boolean;
  /** Filtro está ativo */
  isActive?: boolean;
  /** Contadores por tipo */
  counts?: {
    businesses?: number;
    events?: number;
    alerts?: number;
    touristPoints?: number;
    classifieds?: number;
  };
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Controle de raio de busca no mapa
 *
 * COMPORTAMENTO:
 * - Usuário escolhe o raio em um dropdown/botões
 * - Clica em "Buscar" para ativar
 * - Evita múltiplas requisições durante ajuste
 *
 * @example
 * ```tsx
 * <MapRadiusControl
 *   initialRadius={2}
 *   minRadius={1}
 *   maxRadius={10}
 *   onRadiusChange={(radius) => {
 *     logger.debug(`Buscar em raio de ${radius} km`);
 *   }}
 * />
 * ```
 */
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
    (option) => option >= minRadius && option <= maxRadius,
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
    <Card
      className={`border-territory-border bg-territory-surface p-4 text-territory-ink shadow-lg ${className}`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium text-territory-ink">
            Raio de busca
          </Label>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full border border-territory-brand/20 bg-territory-brand/10 px-2 py-0.5 text-xs font-medium text-territory-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-territory-brand" />
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
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedRadius === option
                      ? 'bg-territory-brand text-territory-on-image shadow-md'
                      : 'bg-territory-raised text-territory-ink hover:bg-territory-brand/10'
                  }`}
                >
                  {option} km
                </button>
              ))}
            </div>

            <button
              onClick={handleApply}
              className="w-full rounded-lg bg-territory-brand px-4 py-2.5 text-sm font-medium text-territory-on-image shadow-sm transition-colors hover:bg-territory-brand/90"
            >
              Aplicar busca em {selectedRadius} km
            </button>
          </div>
        )}

        {isActive && (
          <div className="space-y-3">
            <div className="space-y-2 rounded-lg border border-territory-brand/20 bg-territory-brand/[0.06] px-3 py-2">
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