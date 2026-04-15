/**
 * MapProvider - SSOT de configuracao de mapa.
 *
 * Centraliza:
 * - Engine oficial: MapLibre GL JS
 * - Tiles provider: OpenStreetMap via tiles.openfreemap.org (gratuito, sem token)
 * - Estilo padrao: Positron, por ser o estilo upstream mais estavel no runtime atual
 * - Defaults de camera para Salvador/BA
 *
 * Para trocar de provider de tiles (ex: Maptiler, Stadia), mude apenas aqui.
 */

import type { TileProviderConfig, MapCamera } from './types';

/** Style URL compativel com MapLibre GL - OpenFreeMap (OSM, sem token) */
export const DEFAULT_TILE_STYLE: TileProviderConfig = {
  styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
};

/** Camera padrao: Salvador, BA */
export const DEFAULT_CAMERA: MapCamera = {
  center: [-38.476, -12.975], // MapLibre usa [lng, lat]
  zoom: 14,
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
