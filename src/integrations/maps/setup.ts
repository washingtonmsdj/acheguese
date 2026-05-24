/**
 * Provider Setup
 *
 * Inicialização do sistema de mapas.
 * O estilo de tiles vem de DEFAULT_TILE_STYLE e o geocoding público de mapas
 * passa pelo MapGeocodingAdapter, que consome o SSOT de location.
 */

export function setupDefaultProviders(): void {
  // Configuração centralizada em:
  // - DEFAULT_TILE_STYLE (src/core/maps/providers/MapProvider.ts)
  // - MapGeocodingAdapter (src/core/maps/services/MapGeocodingAdapter.ts)
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_GEO === "true") {
    console.debug(
      "[Maps] Default providers configured: {tiles: 'osm', geocoding: 'location-ssot', routing: 'osrm'}",
    );
  }
}
