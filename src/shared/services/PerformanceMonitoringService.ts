/**
 * Performance Monitoring Service
 * 
 * Serviço para monitorar performance de operações críticas
 * usando Performance API e Sentry
 * 
 * @version 1.0.0
 */

import { logger } from '@/shared/utils/logger';
import { captureSentryMessage, addSentryBreadcrumb } from '@/shared/config/sentry.config';

/**
 * Tipos de operações monitoradas
 */
export type PerformanceOperation =
  | 'checkout'
  | 'dispatch'
  | 'signup'
  | 'login'
  | 'business-claim'
  | 'ride-request'
  | 'ride-accept'
  | 'payment'
  | 'subscription'
  | 'upload'
  | 'search'
  | 'navigation';

/**
 * Thresholds de performance (em ms)
 */
const PERFORMANCE_THRESHOLDS: Record<PerformanceOperation, number> = {
  checkout: 5000, // 5s
  dispatch: 3000, // 3s
  signup: 3000, // 3s
  login: 2000, // 2s
  'business-claim': 3000, // 3s
  'ride-request': 2000, // 2s
  'ride-accept': 2000, // 2s
  payment: 5000, // 5s
  subscription: 5000, // 5s
  upload: 10000, // 10s
  search: 1000, // 1s
  navigation: 1000, // 1s
};

/**
 * Performance Monitoring Service
 */
export class PerformanceMonitoringService {
  /**
   * Inicia monitoramento de uma operação
   */
  static start(operation: PerformanceOperation, metadata?: Record<string, any>): void {
    const markName = `${operation}-start`;
    
    try {
      performance.mark(markName);
      
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
        logger.info(`[Performance] Started: ${operation}`, metadata);
      }
    } catch (error) {
      logger.error('Failed to mark performance start', { operation, error });
    }
  }

  /**
   * Finaliza monitoramento de uma operação
   */
  static end(operation: PerformanceOperation, metadata?: Record<string, any>): number {
    const startMark = `${operation}-start`;
    const endMark = `${operation}-end`;
    const measureName = operation;
    
    try {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName, 'measure')[0];
      const duration = measure?.duration || 0;
      
      // Log em desenvolvimento
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
        logger.info(`[Performance] Completed: ${operation} (${Math.round(duration)}ms)`, metadata);
      }
      
      // Verificar threshold
      const threshold = PERFORMANCE_THRESHOLDS[operation];
      if (duration > threshold) {
        this.reportSlowOperation(operation, duration, threshold, metadata);
      }
      
      // Adicionar breadcrumb
      if (import.meta.env.PROD) {
        addSentryBreadcrumb(
          `Operation: ${operation}`,
          'performance',
          duration > threshold ? 'warning' : 'info',
          {
            duration: Math.round(duration),
            threshold,
            ...metadata,
          }
        );
      }
      
      // Limpar marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
      
      return duration;
    } catch (error) {
      logger.error('Failed to measure performance', { operation, error });
      return 0;
    }
  }

  /**
   * Reporta operação lenta
   */
  private static reportSlowOperation(
    operation: PerformanceOperation,
    duration: number,
    threshold: number,
    metadata?: Record<string, any>
  ): void {
    const message = `Slow operation: ${operation} (${Math.round(duration)}ms > ${threshold}ms)`;
    
    if (import.meta.env.PROD) {
      captureSentryMessage(message, 'warning', {
        operation,
        duration: Math.round(duration),
        threshold,
        exceedBy: Math.round(duration - threshold),
        exceedPercent: Math.round(((duration - threshold) / threshold) * 100),
        ...metadata,
      });
    } else {
      logger.warn(message, { operation, duration, threshold, metadata });
    }
  }

  /**
   * Wrapper para executar função com monitoramento
   */
  static async measure<T>(
    operation: PerformanceOperation,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(operation, metadata);
    
    try {
      const result = await fn();
      this.end(operation, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.end(operation, { ...metadata, success: false, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Mede tempo de navegação entre páginas
   */
  static measureNavigation(from: string, to: string): void {
    const operation: PerformanceOperation = 'navigation';
    const metadata = { from, to };
    
    this.start(operation, metadata);
    
    // Usar requestIdleCallback para medir após render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.end(operation, metadata);
      });
    } else {
      setTimeout(() => {
        this.end(operation, metadata);
      }, 0);
    }
  }

  /**
   * Obtém métricas de performance da página atual
   */
  static getPageMetrics(): Record<string, number> {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!navigation) {
        return {};
      }
      
      return {
        // Timing metrics
        dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
        tcp: Math.round(navigation.connectEnd - navigation.connectStart),
        ttfb: Math.round(navigation.responseStart - navigation.requestStart),
        download: Math.round(navigation.responseEnd - navigation.responseStart),
        domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
        domComplete: Math.round(navigation.domComplete - navigation.fetchStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        
        // Resource metrics
        transferSize: navigation.transferSize || 0,
        encodedBodySize: navigation.encodedBodySize || 0,
        decodedBodySize: navigation.decodedBodySize || 0,
      };
    } catch (error) {
      logger.error('Failed to get page metrics', { error });
      return {};
    }
  }

  /**
   * Reporta métricas de página para Sentry
   */
  static reportPageMetrics(pageName: string): void {
    if (!import.meta.env.PROD) return;
    
    try {
      const metrics = this.getPageMetrics();
      
      if (Object.keys(metrics).length === 0) return;
      
      // Verificar se TTFB está lento (> 800ms)
      if (metrics.ttfb && metrics.ttfb > 800) {
        captureSentryMessage(
          `Slow TTFB on ${pageName}: ${metrics.ttfb}ms`,
          'warning',
          { page: pageName, ...metrics }
        );
      }
      
      // Adicionar breadcrumb com métricas
      addSentryBreadcrumb(
        `Page metrics: ${pageName}`,
        'performance',
        'info',
        { page: pageName, ...metrics }
      );
    } catch (error) {
      logger.error('Failed to report page metrics', { error });
    }
  }

  /**
   * Limpa todas as marcas e medidas
   */
  static clearAll(): void {
    try {
      performance.clearMarks();
      performance.clearMeasures();
    } catch (error) {
      logger.error('Failed to clear performance marks', { error });
    }
  }
}

/**
 * Hook helper para usar em componentes React
 */
export function usePerformanceMonitoring(operation: PerformanceOperation, metadata?: Record<string, any>) {
  return {
    start: () => PerformanceMonitoringService.start(operation, metadata),
    end: () => PerformanceMonitoringService.end(operation, metadata),
    measure: <T,>(fn: () => Promise<T>) => PerformanceMonitoringService.measure(operation, fn, metadata),
  };
}
