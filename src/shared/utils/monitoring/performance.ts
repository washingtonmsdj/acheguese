/**
 * Sistema de Monitoramento de Performance
 *
 * Monitora métricas de performance do aplicativo em tempo real
 *
 * @module lib/monitoring/performance
 * @version 1.0.0
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: "render" | "network" | "interaction" | "custom";
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    avgRenderTime: number;
    avgNetworkTime: number;
    totalInteractions: number;
    slowestOperations: PerformanceMetric[];
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private enabled = import.meta.env.DEV;

  /**
   * Marca o início de uma operação
   */
  startMeasure(name: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.addMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        category: "custom",
      });
    };
  }

  /**
   * Adiciona uma métrica
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Limita o número de métricas armazenadas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Monitora tempo de render de componente
   */
  measureRender(componentName: string, renderFn: () => void): void {
    if (!this.enabled) {
      renderFn();
      return;
    }

    const endMeasure = this.startMeasure(`render:${componentName}`);
    renderFn();
    endMeasure();
  }

  /**
   * Monitora requisição de rede
   */
  async measureNetwork<T>(
    operationName: string,
    networkFn: () => Promise<T>,
  ): Promise<T> {
    if (!this.enabled) {
      return networkFn();
    }

    const endMeasure = this.startMeasure(`network:${operationName}`);
    try {
      const result = await networkFn();
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }

  /**
   * Monitora interação do usuário
   */
  measureInteraction(interactionName: string, interactionFn: () => void): void {
    if (!this.enabled) {
      interactionFn();
      return;
    }

    const endMeasure = this.startMeasure(`interaction:${interactionName}`);
    interactionFn();
    endMeasure();
  }

  /**
   * Gera relatório de performance
   */
  getReport(): PerformanceReport {
    const renderMetrics = this.metrics.filter((m) =>
      m.name.startsWith("render:"),
    );
    const networkMetrics = this.metrics.filter((m) =>
      m.name.startsWith("network:"),
    );
    const interactionMetrics = this.metrics.filter((m) =>
      m.name.startsWith("interaction:"),
    );

    const avgRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) /
          renderMetrics.length
        : 0;

    const avgNetworkTime =
      networkMetrics.length > 0
        ? networkMetrics.reduce((sum, m) => sum + m.value, 0) /
          networkMetrics.length
        : 0;

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      metrics: this.metrics,
      summary: {
        avgRenderTime,
        avgNetworkTime,
        totalInteractions: interactionMetrics.length,
        slowestOperations,
      },
    };
  }

  /**
   * Limpa todas as métricas
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Habilita/desabilita monitoramento
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Verifica se está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Exporta métricas para análise
   */
  exportMetrics(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }

  /**
   * Monitora Web Vitals
   */
  measureWebVitals(): void {
    if (!this.enabled || typeof window === "undefined") return;

    // First Contentful Paint (FCP)
    const paintEntries = performance.getEntriesByType("paint");
    const fcp = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint",
    );
    if (fcp) {
      this.addMetric({
        name: "web-vitals:FCP",
        value: fcp.startTime,
        timestamp: Date.now(),
        category: "custom",
      });
    }

    // Largest Contentful Paint (LCP)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.addMetric({
              name: "web-vitals:LCP",
              value: lastEntry.renderTime || lastEntry.loadTime,
              timestamp: Date.now(),
              category: "custom",
            });
          }
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // Observer não suportado
      }
    }

    // First Input Delay (FID)
    if ("PerformanceObserver" in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.addMetric({
              name: "web-vitals:FID",
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              category: "interaction",
            });
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        // Observer não suportado
      }
    }
  }
}

// Instância singleton
export const performanceMonitor = new PerformanceMonitor();

// Hook React para usar o monitor
export function usePerformanceMonitor() {
  return {
    startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureNetwork: performanceMonitor.measureNetwork.bind(performanceMonitor),
    measureInteraction:
      performanceMonitor.measureInteraction.bind(performanceMonitor),
    getReport: performanceMonitor.getReport.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor),
    exportMetrics: performanceMonitor.exportMetrics.bind(performanceMonitor),
  };
}

// Inicializa Web Vitals automaticamente
if (typeof window !== "undefined") {
  performanceMonitor.measureWebVitals();
}
