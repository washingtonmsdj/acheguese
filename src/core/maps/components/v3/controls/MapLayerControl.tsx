/**
 * MapLayerControl - Controle de camadas do mapa
 *
 * Suporta modo controlado (visibleLayers + onLayerToggle) e não-controlado.
 * Usa getLayerConfig (SSOT: markerConfig.ts) para cores e labels.
 */

import { useState, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { getLayerConfig } from '@/core/maps/config/markerConfig';
import type { MapLayerKey } from '@/core/maps/types/core';
import type { LayerControlConfig } from './types';

interface MapLayerControlProps extends LayerControlConfig {
  className?: string;
}

export function MapLayerControl({
  layers: layerKeys,
  layout = 'vertical',
  onLayerToggle,
  visibleLayers: externalVisible,
  className,
}: MapLayerControlProps) {
  // Estado interno — usado apenas quando não há controle externo
  const [internalVisible, setInternalVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries((layerKeys as string[]).map((k) => [k, true])),
  );

  const isControlled = externalVisible !== undefined;
  const visibleLayers = isControlled ? externalVisible : internalVisible;

  const toggleLayer = useCallback(
    (key: string) => {
      const next = !(visibleLayers[key] ?? true);
      if (!isControlled) {
        setInternalVisible((prev) => ({ ...prev, [key]: next }));
      }
      onLayerToggle?.(key, next);
    },
    [visibleLayers, isControlled, onLayerToggle],
  );

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden',
        className,
      )}
      role="group"
      aria-label="Camadas do mapa"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <Layers className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-semibold text-gray-700">Camadas</span>
      </div>

      <div className={cn('p-2', layout === 'horizontal' ? 'flex flex-row gap-1' : 'flex flex-col gap-1')}>
        {(layerKeys as MapLayerKey[]).map((key) => {
          const isVisible = visibleLayers[key] ?? true;
          const cfg = getLayerConfig(key);

          return (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isVisible
                  ? 'bg-blue-50 text-gray-900 border border-blue-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent',
              )}
              aria-pressed={isVisible}
              aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${cfg.label}`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 transition-opacity border border-white"
                style={{ backgroundColor: cfg.color, opacity: isVisible ? 1 : 0.4 }}
              />
              <span className="whitespace-nowrap">{cfg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
