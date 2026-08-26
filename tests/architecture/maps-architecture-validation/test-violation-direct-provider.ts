/**
 * TESTE DE VIOLAÇÃO 1: Import direto de provider
 * 
 * Este arquivo DEVE falhar no lint com:
 * - Exit code 1
 * - Regra: @typescript-eslint/no-restricted-imports
 * - Mensagem: "❌ MAPS BLINDAGEM: Não importe OSMTileProvider diretamente..."
 */

// ❌ VIOLAÇÃO: Import direto de provider
import { osmTileProvider } from '@/integrations/maps/providers/OSMTileProvider';

export function testViolation() {
  const config = osmTileProvider.getTileConfig('streets');
  return config;
}
