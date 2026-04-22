/**
 * markerConfig — SSOT de configuração visual de marcadores por tipo.
 *
 * Usado por:
 * - MapLibreAdapter (DOM puro para MapLibre GL JS)
 * - MapMarkerPopup (componente React)
 * - MapLayerControl (cores das camadas)
 */

import type { MapEntityType } from '../types/core';

export interface MarkerTypeConfig {
  /** Label legível */
  label: string;
  /** Emoji para o pin no mapa */
  emoji: string;
  /** Cor hex para o pin */
  color: string;
  /** Classe Tailwind para ícone no popup */
  iconClass: string;
}

export const MARKER_TYPE_CONFIG: Record<MapEntityType, MarkerTypeConfig> = {
  business:      { label: 'Negócio',         emoji: '🏪', color: '#3b82f6', iconClass: 'text-blue-500' },
  service:       { label: 'Serviço',          emoji: '🔧', color: '#10b981', iconClass: 'text-emerald-500' },
  classified:    { label: 'Classificado',     emoji: '🏷️', color: '#f59e0b', iconClass: 'text-amber-500' },
  event:         { label: 'Evento',           emoji: '🎉', color: '#8b5cf6', iconClass: 'text-purple-500' },
  alert:         { label: 'Alerta',           emoji: '⚠️', color: '#ef4444', iconClass: 'text-red-500' },
  professional:  { label: 'Profissional',     emoji: '👤', color: '#f97316', iconClass: 'text-orange-500' },
  tourist_point: { label: 'Ponto Turístico',  emoji: '📍', color: '#14b8a6', iconClass: 'text-teal-500' },
  driver:        { label: 'Motorista',        emoji: '🚗', color: '#6b7280', iconClass: 'text-gray-500' },
  ride:          { label: 'Corrida',          emoji: '🚕', color: '#6b7280', iconClass: 'text-gray-500' },
  user_location: { label: 'Você',             emoji: '📌', color: '#10b981', iconClass: 'text-emerald-500' },
};

export function getMarkerConfig(type: MapEntityType): MarkerTypeConfig {
  return MARKER_TYPE_CONFIG[type] ?? MARKER_TYPE_CONFIG.business;
}

// ─── Mapeamento MapLayerKey → MarkerTypeConfig ────────────────────────────────
// Permite que controles de camadas usem o mesmo SSOT de cores/labels.
import type { MapLayerKey } from '../types/core';

const LAYER_KEY_TO_TYPE: Partial<Record<MapLayerKey, MapEntityType>> = {
  businesses:    'business',
  gastronomy:    'business',
  services:      'service',
  classifieds:   'classified',
  events:        'event',
  alerts:        'alert',
  professionals: 'professional',
  tourist_points:'tourist_point',
  mobility:      'driver',
  user_location: 'user_location',
};

const LAYER_CONFIG_OVERRIDES: Partial<Record<MapLayerKey, Partial<MarkerTypeConfig>>> = {
  gastronomy: {
    label: 'Gastronomia',
    color: '#dc2626',
    iconClass: 'text-red-600',
  },
};

export function getLayerConfig(key: MapLayerKey): MarkerTypeConfig {
  const type = LAYER_KEY_TO_TYPE[key];
  const baseConfig = type
    ? MARKER_TYPE_CONFIG[type]
    : { label: key, emoji: '📌', color: '#6b7280', iconClass: 'text-gray-500' };

  const overrides = LAYER_CONFIG_OVERRIDES[key];
  return overrides ? { ...baseConfig, ...overrides } : baseConfig;
}
