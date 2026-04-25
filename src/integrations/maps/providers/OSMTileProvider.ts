/**
 * OSMTileProvider - Provider de tiles OpenStreetMap.
 *
 * Implementacao de MapTileProvider para OpenStreetMap.
 * Usa tiles publicos do OpenFreeMap via MapLibre.
 *
 * @module integrations/maps/providers
 */

import type { MapTileProvider, TileStyle, TileProviderConfig } from '@/core/maps/types';

/**
 * Estilos disponiveis para OSM.
 *
 * O estilo `liberty` foi removido do fluxo padrao porque o upstream passou
 * a entregar expressoes com `null` que quebram o parse do worker do MapLibre.
 * Enquanto isso, `positron` vira o baseline seguro para estilos claros.
 */
const OSM_STYLES: Record<TileStyle, TileProviderConfig> = {
  streets: {
    name: 'osm-streets',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '&copy; OpenStreetMap contributors',
  },
  light: {
    name: 'osm-light',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '&copy; OpenStreetMap contributors',
  },
  dark: {
    name: 'osm-dark',
    styleUrl: 'https://tiles.openfreemap.org/styles/dark-matter',
    attribution: '&copy; OpenStreetMap contributors',
  },
  // Fallback para estilos nao suportados
  satellite: {
    name: 'osm-streets',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '&copy; OpenStreetMap contributors',
  },
  hybrid: {
    name: 'osm-streets',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '&copy; OpenStreetMap contributors',
  },
  terrain: {
    name: 'osm-streets',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '&copy; OpenStreetMap contributors',
  },
};

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
