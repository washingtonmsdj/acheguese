/**
 * Routing Service Instance - Instância singleton
 * 
 * Instância global do RoutingService configurada com provider real.
 * 
 * GATE 1: ROUTING REAL
 * - Provider: OSRM (Open Source Routing Machine)
 * - Fase 1: Servidor público (demo.project-osrm.org)
 * - Fase 2: Self-hosted em produção
 * 
 * @module core/routing
 */
import { logger } from '@/shared/utils/logger';
import { createRoutingService } from './services/RoutingService';
import { osrmProvider } from '@/integrations/maps/providers/OSRMProvider';
import type { RoutingProvider } from './types';

/**
 * Instância singleton do RoutingService
 * 
 * GATE 1: usa OSRM real para rotas públicas e operacionais
 */
export const routingService = createRoutingService(osrmProvider, 'car');

// Validar provider na inicialização
osrmProvider.validate().then((isValid) => {
  if (isValid) {
    logger.info('[RoutingService] OSRM provider validado com sucesso');
  } else {
    const isDev =
      typeof import.meta !== 'undefined' &&
      typeof import.meta.env !== 'undefined' &&
      Boolean(import.meta.env.DEV);
    const message = '[RoutingService] OSRM provider indisponível';
    if (isDev) {
      logger.info(message);
    } else {
      logger.warn(message);
    }
  }
}).catch((error) => {
  logger.error('[RoutingService] Erro ao validar OSRM provider', error);
});

/**
 * Reconfigurar provider do RoutingService
 * 
 * Útil para trocar provider real sem quebrar consumidores.
 * 
 * @example
 * ```ts
 * import { osrmProvider } from '@/integrations/maps/providers/OSRMProvider';
 * import { reconfigureRoutingProvider } from '@/core/routing';
 * 
 * reconfigureRoutingProvider(osrmProvider);
 * ```
 */
export function reconfigureRoutingProvider(provider: RoutingProvider): void {
  // @ts-expect-error - Reconfiguração interna
  routingService.provider = provider;
}
