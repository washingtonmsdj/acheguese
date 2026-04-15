/**
 * MapRadiusControl - Controle de raio de busca no mapa
 * 
 * Permite ao usuário filtrar entidades por distância.
 * 
 * @module core/maps/components/v3/controls
 */

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
 *     console.log(`Buscar em raio de ${radius} km`);
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

  // Opções de raio predefinidas (estilo Facebook)
  const radiusOptions = [1, 2, 5, 10, 15, 20, 30, 50];

  if (!visible) {
    return null;
  }

  const handleRadiusSelect = (radius: number) => {
    setSelectedRadius(radius);
    // Mostrar preview do círculo imediatamente (sem buscar)
    onRadiusPreview?.(radius);
  };

  const handleApply = () => {
    // Aplicar busca com o raio selecionado
    onRadiusChange?.(selectedRadius);
  };

  const handleDisable = () => {
    onDisable?.();
  };

  return (
    <Card className={`p-4 bg-white shadow-lg ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium text-gray-700">
            Raio de busca
          </Label>
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Ativo
            </span>
          )}
        </div>

        {/* Seletor de raio (estilo Facebook) */}
        {!isActive && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleRadiusSelect(option)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-lg transition-all
                    ${selectedRadius === option
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {option} km
                </button>
              ))}
            </div>

            {/* Botão de aplicar */}
            <button
              onClick={handleApply}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              Aplicar busca em {selectedRadius} km
            </button>
          </div>
        )}

        {/* Informações quando ativo */}
        {isActive && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-2">
              <p className="text-xs text-blue-700">
                📍 Mostrando resultados em <strong>{selectedRadius} km</strong>
              </p>
              
              {/* Contadores por tipo */}
              {counts && (
                <div className="flex flex-wrap gap-2">
                  {counts.businesses !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      🏢 {counts.businesses}
                    </span>
                  )}
                  {counts.events !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      📅 {counts.events}
                    </span>
                  )}
                  {counts.alerts !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      ⚠️ {counts.alerts}
                    </span>
                  )}
                  {counts.touristPoints !== undefined && counts.touristPoints > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      🏛️ {counts.touristPoints}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Botão de desativar */}
            <button
              onClick={handleDisable}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Desativar filtro
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
