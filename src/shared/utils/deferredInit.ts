/**
 * 🚀 DEFERRED INITIALIZATION - Otimização de Performance
 *
 * Utilitários para inicialização não-bloqueante de serviços.
 * Deferir inicializações pesadas melhora FCP/LCP significativamente.
 *
 * @version 1.0.0
 */

/**
 * Executa callback após o próximo frame (desbloqueia render)
 */
export function deferFrame(callback: () => void): void {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  } else {
    setTimeout(callback, 16);
  }
}

/**
 * Executa callback quando a página estiver ociosa
 * Usa requestIdleCallback com fallback para setTimeout
 */
export function deferIdle(callback: () => void, timeout = 2000): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout });
  } else {
    deferFrame(callback);
  }
}

/**
 * Executa callback quando o documento estiver completamente carregado
 */
export function deferLoad(callback: () => void): void {
  if (document.readyState === 'complete') {
    deferIdle(callback);
  } else {
    window.addEventListener('load', () => deferIdle(callback), { once: true });
  }
}

/**
 * Executa callback após FCP (First Contentful Paint)
 * Usa Performance Observer para detectar FCP
 */
export function deferAfterFCP(callback: () => void): void {
  if (typeof PerformanceObserver === 'undefined') {
    deferFrame(callback);
    return;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        observer.disconnect();
        deferFrame(callback);
        return;
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['paint'] });
    
    // Fallback: se FCP já aconteceu ou não detectar em 3s
    setTimeout(() => {
      observer.disconnect();
      deferFrame(callback);
    }, 3000);
  } catch {
    deferFrame(callback);
  }
}

/**
 * Executa callback após LCP (Largest Contentful Paint)
 */
export function deferAfterLCP(callback: () => void): void {
  if (typeof PerformanceObserver === 'undefined') {
    deferIdle(callback);
    return;
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    if (entries.length > 0) {
      observer.disconnect();
      deferIdle(callback);
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Fallback
    setTimeout(() => {
      observer.disconnect();
      deferIdle(callback);
    }, 5000);
  } catch {
    deferIdle(callback);
  }
}

/**
 * Batcher para agrupar múltiplas inicializações deferidas
 * Evita múltiplas callbacks que possam causar jank
 */
export class DeferredBatch {
  private callbacks: Array<() => void> = [];
  private scheduled = false;
  private priority: 'frame' | 'idle' | 'load';

  constructor(priority: 'frame' | 'idle' | 'load' = 'idle') {
    this.priority = priority;
  }

  add(callback: () => void): void {
    this.callbacks.push(callback);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;

    const executor = () => {
      this.scheduled = false;
      const callbacks = [...this.callbacks];
      this.callbacks = [];
      
      callbacks.forEach(cb => {
        try {
          cb();
        } catch (error) {
          console.error('[DeferredBatch] Error executing callback:', error);
        }
      });
    };

    switch (this.priority) {
      case 'frame':
        deferFrame(executor);
        break;
      case 'idle':
        deferIdle(executor);
        break;
      case 'load':
        deferLoad(executor);
        break;
    }
  }
}

/**
 * Cria uma versão lazy de um módulo
 * Só executa a inicialização quando realmente necessário
 */
export function createLazyInitializer<T>(
  factory: () => T,
  initializer?: (instance: T) => void,
): () => T {
  let instance: T | undefined;
  let initialized = false;

  return () => {
    if (!instance) {
      instance = factory();
    }
    
    if (!initialized && initializer && instance) {
      initialized = true;
      deferFrame(() => initializer(instance as T));
    }
    
    return instance as T;
  };
}
