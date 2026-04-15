/**
 * Maps Integration
 * 
 * Camada de integração com serviços geoespaciais externos.
 * 
 * Responsabilidades:
 * - Providers de tiles (OSM, Mapbox, etc)
 * - Providers de geocoding (Nominatim, Google, etc)
 * - Providers de routing (OSRM, Valhalla, etc)
 * - Adaptação de APIs externas para contratos internos
 * 
 * @see docs/GEOGRAPHIC_FOUNDATION.md
 */

// ============================================
// PROVIDERS
// ============================================
export { osmTileProvider, OSMTileProvider } from './providers/OSMTileProvider';
export {
  nominatimGeocodingProvider,
  NominatimGeocodingProvider,
} from './providers/NominatimGeocodingProvider';
export { mockRoutingProvider, MockRoutingProvider } from './providers/MockRoutingProvider';

// ============================================
// PROVIDER SETUP
// ============================================
export { setupDefaultProviders } from './setup';

