/**
 * MapProvider - SSOT de configuracao de mapa.
 *
 * Centraliza:
 * - Engine oficial: MapLibre GL JS
 * - Tiles provider: OpenStreetMap via tiles.openfreemap.org (gratuito, sem token)
 * - Estilo padrao: Positron, por ser o estilo upstream mais estavel no runtime atual
 * - Defaults de camera vindos da configuração central de mapas
 *
 * Para trocar de provider de tiles (ex: Maptiler, Stadia), mude apenas aqui.
 */

import type { TileProviderConfig } from '../types/providers';
import {
  DEFAULT_TILE_STYLE as SHARED_DEFAULT_TILE_STYLE,
  MAP_DEFAULT_CENTER_LNGLAT,
  MAP_DEFAULT_ZOOM,
} from '@/shared/config/mapDefaults';

interface MapCamera {
  center: [number, number];
  zoom: number;
}

/** Style URL compativel com MapLibre GL - OpenFreeMap (OSM, sem token) */
export const DEFAULT_TILE_STYLE: TileProviderConfig = SHARED_DEFAULT_TILE_STYLE;

export const DEFAULT_CAMERA: MapCamera = {
  center: MAP_DEFAULT_CENTER_LNGLAT,
  zoom: MAP_DEFAULT_ZOOM,
};

/** Paleta de cores para multiplos bairros */
export const NEIGHBORHOOD_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
] as const;
