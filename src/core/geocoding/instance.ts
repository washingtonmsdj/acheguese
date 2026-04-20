/**
 * Geocoding Instance - Singleton e configuração do módulo
 * 
 * Padrão: instância única do GeocodingService para toda a aplicação
 */

import { GeocodingService } from './services/GeocodingService';
import type { GeocodingServiceConfig } from './types';
import { logger } from '@/shared/utils/logger';

/**
 * Instância singleton do GeocodingService
 */
export const geocodingService = GeocodingService.getInstance();

/**
 * Configuração padrão do serviço
 */
export const defaultGeocodingConfig: GeocodingServiceConfig = {
  defaultProvider: 'nominatim',
  fallbackProviders: ['viacep'],
  timeoutMs: 15000,
  enableCache: true,
  cacheTtlSeconds: 300,
};

/**
 * Inicializa o serviço com configuração padrão
 * 
 * @param customConfig Configuração personalizada (opcional)
 */
export function initializeGeocodingService(customConfig?: Partial<GeocodingServiceConfig>): void {
  const config = { ...defaultGeocodingConfig, ...customConfig };
  geocodingService.configure(config);

  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_GEO === "true") {
    logger.debug(
      "[Geocoding] Service initialized with providers:",
      geocodingService.getAvailableProviders(),
    );
  }
}

/**
 * Verifica se o serviço está disponível
 */
export function isGeocodingAvailable(): boolean {
  const status = geocodingService.getStatus();
  return status.success;
}

/**
 * Obtém status do serviço
 */
export function getGeocodingStatus() {
  return geocodingService.getStatus();
}

/**
 * Obtém métricas do serviço
 */
export function getGeocodingMetrics() {
  return geocodingService.getMetrics();
}

/**
 * Reseta métricas do serviço
 */
export function resetGeocodingMetrics(): void {
  geocodingService.resetMetrics();
}

// Inicialização automática em desenvolvimento
if (import.meta.env.DEV) {
  initializeGeocodingService();
}
