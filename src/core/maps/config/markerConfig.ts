/**
 * markerConfig - SSOT de configuracao visual de marcadores por tipo.
 *
 * Usado por:
 * - MapLibreAdapter (DOM puro para MapLibre GL JS)
 * - MapMarkerPopup (componente React)
 * - MapLayerControl (cores das camadas)
 */

import type { MapEntityType, MapLayerKey } from "../types/core";

export interface MarkerTypeConfig {
  label: string;
  emoji: string;
  color: string;
  iconClass: string;
}

export const MARKER_TYPE_CONFIG: Record<MapEntityType, MarkerTypeConfig> = {
  business: { label: "Negocio", emoji: "🏪", color: "#3b82f6", iconClass: "text-blue-500" },
  service: { label: "Servico", emoji: "🔧", color: "#10b981", iconClass: "text-emerald-500" },
  classified: { label: "Classificado", emoji: "🏷️", color: "#f59e0b", iconClass: "text-amber-500" },
  event: { label: "Evento", emoji: "🎉", color: "#8b5cf6", iconClass: "text-purple-500" },
  alert: { label: "Alerta", emoji: "⚠️", color: "#ef4444", iconClass: "text-red-500" },
  professional: { label: "Profissional", emoji: "👤", color: "#f97316", iconClass: "text-orange-500" },
  tourist_point: { label: "Ponto Turistico", emoji: "📍", color: "#14b8a6", iconClass: "text-teal-500" },
  driver: { label: "Motorista", emoji: "🚗", color: "#6b7280", iconClass: "text-gray-500" },
  ride: { label: "Corrida", emoji: "🚕", color: "#6b7280", iconClass: "text-gray-500" },
  user_location: { label: "Voce", emoji: "📌", color: "#10b981", iconClass: "text-emerald-500" },
};

export function getMarkerConfig(type: MapEntityType): MarkerTypeConfig {
  switch (type) {
    case "business":
      return MARKER_TYPE_CONFIG.business;
    case "service":
      return MARKER_TYPE_CONFIG.service;
    case "classified":
      return MARKER_TYPE_CONFIG.classified;
    case "event":
      return MARKER_TYPE_CONFIG.event;
    case "alert":
      return MARKER_TYPE_CONFIG.alert;
    case "professional":
      return MARKER_TYPE_CONFIG.professional;
    case "tourist_point":
      return MARKER_TYPE_CONFIG.tourist_point;
    case "driver":
      return MARKER_TYPE_CONFIG.driver;
    case "ride":
      return MARKER_TYPE_CONFIG.ride;
    case "user_location":
      return MARKER_TYPE_CONFIG.user_location;
    default:
      return MARKER_TYPE_CONFIG.business;
  }
}

const LAYER_KEY_TO_TYPE: Partial<Record<MapLayerKey, MapEntityType>> = {
  businesses: "business",
  gastronomy: "business",
  services: "service",
  classifieds: "classified",
  events: "event",
  alerts: "alert",
  professionals: "professional",
  tourist_points: "tourist_point",
  mobility: "driver",
  user_location: "user_location",
};

const LAYER_CONFIG_OVERRIDES: Partial<Record<MapLayerKey, Partial<MarkerTypeConfig>>> = {
  gastronomy: {
    label: "Gastronomia",
    color: "#dc2626",
    iconClass: "text-red-600",
  },
};

function getLayerEntityType(key: MapLayerKey): MapEntityType | undefined {
  switch (key) {
    case "businesses":
      return LAYER_KEY_TO_TYPE.businesses;
    case "gastronomy":
      return LAYER_KEY_TO_TYPE.gastronomy;
    case "services":
      return LAYER_KEY_TO_TYPE.services;
    case "classifieds":
      return LAYER_KEY_TO_TYPE.classifieds;
    case "events":
      return LAYER_KEY_TO_TYPE.events;
    case "alerts":
      return LAYER_KEY_TO_TYPE.alerts;
    case "professionals":
      return LAYER_KEY_TO_TYPE.professionals;
    case "tourist_points":
      return LAYER_KEY_TO_TYPE.tourist_points;
    case "mobility":
      return LAYER_KEY_TO_TYPE.mobility;
    case "user_location":
      return LAYER_KEY_TO_TYPE.user_location;
    default:
      return undefined;
  }
}

export function getLayerConfig(key: MapLayerKey): MarkerTypeConfig {
  const type = getLayerEntityType(key);
  const baseConfig = type
    ? getMarkerConfig(type)
    : { label: key, emoji: "📌", color: "#6b7280", iconClass: "text-gray-500" };

  const overrides = key === "gastronomy" ? LAYER_CONFIG_OVERRIDES.gastronomy : undefined;
  return overrides ? { ...baseConfig, ...overrides } : baseConfig;
}
