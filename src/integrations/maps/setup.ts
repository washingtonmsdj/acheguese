/**
 * Provider Setup
 *
 * Inicialização do sistema de mapas.
 * O estilo de tiles e geocoding são configurados via DEFAULT_TILE_STYLE
 * e GeocodingService — não requerem registro explícito de providers.
 */

export function setupDefaultProviders(): void {
  // Configuração centralizada em:
  // - DEFAULT_TILE_STYLE (src/core/maps/providers/MapProvider.ts)
  // - GeocodingService (src/core/maps/services/GeocodingService.ts)
  if (import.meta.env.DEV) {
    console.log('[Maps] Default providers configured: {tiles: \'osm\', geocoding: \'nominatim\', routing: \'mock (temporary)\'}');
  }
}
