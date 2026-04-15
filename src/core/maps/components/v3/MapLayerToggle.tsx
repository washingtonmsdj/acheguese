/**
 * MapLayerToggle - Controle de visibilidade de camadas
 *
 * Usa getLayerConfig (SSOT: markerConfig.ts) para labels.
 *
 * @module core/maps/components/v3
 */

import React, { useState, useCallback } from 'react';
import { getLayerConfig } from '../../config/markerConfig';
import type { MapLayerKey } from '../../types/core';

export interface MapLayerToggleProps {
  layerKeys?: MapLayerKey[];
  layout?: 'horizontal' | 'vertical';
  renderLayer?: (layerKey: MapLayerKey, isVisible: boolean, toggle: () => void) => React.ReactNode;
  className?: string;
}

const DEFAULT_LAYER_KEYS: MapLayerKey[] = ['businesses', 'events', 'alerts', 'services'];

export function MapLayerToggle({
  layerKeys = DEFAULT_LAYER_KEYS,
  layout = 'vertical',
  renderLayer,
  className,
}: MapLayerToggleProps) {
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(
    () => Object.fromEntries(layerKeys.map((k) => [k, true]))
  );

  const toggleLayer = useCallback((key: MapLayerKey) => {
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div
      className={className}
      data-map-layer-toggle
      data-layout={layout}
      role="group"
      aria-label="Controle de camadas do mapa"
    >
      {layerKeys.map((key) => {
        const isVisible = visibleLayers[key] ?? true;
        const toggle = () => toggleLayer(key);

        if (renderLayer) {
          return <React.Fragment key={key}>{renderLayer(key, isVisible, toggle)}</React.Fragment>;
        }

        return <LayerToggleItem key={key} layerKey={key} isVisible={isVisible} onToggle={toggle} />;
      })}
    </div>
  );
}

interface LayerToggleItemProps {
  layerKey: MapLayerKey;
  isVisible: boolean;
  onToggle: () => void;
}

function LayerToggleItem({ layerKey, isVisible, onToggle }: LayerToggleItemProps) {
  const cfg = getLayerConfig(layerKey);
  const id = `layer-toggle-${layerKey}`;

  return (
    <div data-layer-toggle-item={layerKey}>
      <input
        id={id}
        type="checkbox"
        checked={isVisible}
        onChange={onToggle}
        aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} camada ${cfg.label}`}
      />
      <label htmlFor={id}>{cfg.label}</label>
    </div>
  );
}
