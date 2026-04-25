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

function getExternalVisibility(
  externalVisible: Record<string, boolean> | undefined,
  key: string,
): boolean {
  if (!externalVisible) {
    return true;
  }

  const visibilityEntry = Object.entries(externalVisible).find(
    ([entryKey]) => entryKey === key,
  );
  return visibilityEntry ? visibilityEntry[1] : true;
}

export function MapLayerControl({
  layers: layerKeys,
  layout = 'vertical',
  onLayerToggle,
  visibleLayers: externalVisible,
  className,
}: MapLayerControlProps) {
  // Estado interno — usado apenas quando não há controle externo
  const [internalVisible, setInternalVisible] = useState<Map<string, boolean>>(
    () => new Map((layerKeys as string[]).map((layerKey) => [layerKey, true])),
  );

  const isControlled = externalVisible !== undefined;

  const toggleLayer = useCallback(
    (key: string) => {
      const currentVisibility = isControlled
        ? getExternalVisibility(externalVisible, key)
        : (internalVisible.get(key) ?? true);
      const next = !currentVisibility;
      if (!isControlled) {
        setInternalVisible((prev) => {
          const nextState = new Map(prev);
          nextState.set(key, next);
          return nextState;
        });
      }
      onLayerToggle?.(key, next);
    },
    [externalVisible, internalVisible, isControlled, onLayerToggle],
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
          const isVisible = isControlled
            ? getExternalVisibility(externalVisible, key)
            : (internalVisible.get(key) ?? true);
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
