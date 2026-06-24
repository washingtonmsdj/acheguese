/**
 * OSMTileProvider - Provider de tiles OpenStreetMap.
 *
 * Implementacao de MapTileProvider para OpenStreetMap.
 * Usa tiles publicos do OpenFreeMap via MapLibre.
 *
 * @module integrations/maps/providers
 */

import type { MapTileProvider, TileStyle, TileProviderConfig } from '@/core/maps/types';
import { MAP_TILE_STYLES } from '@/shared/config/mapDefaults';

/**
 * Estilos disponiveis para OSM.
 *
 * O estilo `liberty` foi removido do fluxo padrao porque o upstream passou
 * a entregar expressoes com `null` que quebram o parse do worker do MapLibre.
 * Enquanto isso, `positron` vira o baseline seguro para estilos claros.
 */
const OSM_STYLES = MAP_TILE_STYLES satisfies Record<TileStyle, TileProviderConfig>;

/**
 * Provider de tiles OpenStreetMap.
 */
export class OSMTileProvider implements MapTileProvider {
  getTileConfig(style: TileStyle): TileProviderConfig {
    switch (style) {
      case 'streets':
        return OSM_STYLES.streets;
      case 'light':
        return OSM_STYLES.light;
      case 'dark':
        return OSM_STYLES.dark;
      case 'satellite':
        return OSM_STYLES.satellite;
      case 'hybrid':
        return OSM_STYLES.hybrid;
      case 'terrain':
        return OSM_STYLES.terrain;
      default:
        return OSM_STYLES.streets;
    }
  }

  getAvailableStyles(): TileStyle[] {
    return ['streets', 'light', 'dark'];
  }

  async validate(): Promise<boolean> {
    // OSM e publico, sempre valido
    return true;
  }
}

/**
 * Instancia singleton.
 */
export const osmTileProvider = new OSMTileProvider();
