/**
 * TESTE DE VIOLAÇÃO 2: Import direto de provider de maps
 * 
 * Este arquivo DEVE falhar no lint com:
 * - Exit code 1
 * - Regra: maps/no-direct-provider-import
 * - Mensagem: "❌ MAPS BLINDAGEM: Não importe '...' diretamente..."
 * 
 * NOTA: A regra no-cross-layer-import é específica para arquivos em src/modules/.
 * Este arquivo testa a regra no-direct-provider-import como segunda violação.
 */

// ❌ VIOLAÇÃO: Import direto de provider de geocoding
import { NominatimGeocodingProvider } from '@/integrations/maps/providers/NominatimGeocodingProvider';

export function testViolation() {
  const provider = new NominatimGeocodingProvider();
  return provider;
}
