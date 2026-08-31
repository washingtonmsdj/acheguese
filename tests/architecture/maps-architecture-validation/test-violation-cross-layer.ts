/**
 * TESTE DE VIOLAÇÃO 2: import cross-layer modules → integrations/maps
 *
 * Este fixture permanece fora de `src` para não quebrar o lint normal.
 * O validator o executa via stdin com um filename virtual em `src/modules/`,
 * porque `maps/no-cross-layer-import` usa a camada do arquivo consumidor como
 * parte da regra.
 *
 * Este arquivo DEVE falhar no lint explícito com:
 * - Exit code 1
 * - Regra: maps/no-cross-layer-import
 * - Mensagem de blindagem Maps para modules → integrations/maps
 */

// ❌ VIOLAÇÃO: um consumidor em modules importa provider de integrations/maps.
import { NominatimGeocodingProvider } from '@/integrations/maps/providers/NominatimGeocodingProvider';

export function testViolation() {
  const provider = new NominatimGeocodingProvider();
  return provider;
}
