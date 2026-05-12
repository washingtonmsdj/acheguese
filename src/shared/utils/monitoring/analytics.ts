/**
 * Sistema de Analytics e Métricas
 *
 * Rastreia eventos e comportamento do usuário
 *
 * @module lib/monitoring/analytics
 * @version 1.0.0
 */

import { logger } from "@/shared/utils/logger";

interface AnalyticsEvent {
  name: string;
  category: "page_view" | "user_action" | "error" | "performance" | "business";
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface UserSession {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  userRole?: string;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private session: UserSession;
  private enabled = true;
  private maxEvents = 500;

  constructor() {
    this.session = this.createSession();
    this.setupActivityTracking();
  }

  /**
   * Cria nova sessão
   */
  private createSession(): UserSession {
    return {
      id: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
    };
  }

  /**
   * Gera ID de sessão único
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Configura rastreamento de atividade
   */
  private setupActivityTracking(): void {
    if (typeof window === "undefined") return;

    // Atualiza última atividade
    const updateActivity = () => {
      this.session.lastActivity = Date.now();
    };

    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);
    window.addEventListener("keypress", updateActivity);

    // Rastreia saída da página
    window.addEventListener("beforeunload", () => {
      this.trackEvent("session_end", "user_action", {
        duration: Date.now() - this.session.startTime,
        pageViews: this.session.pageViews,
        events: this.session.events,
      });
    });
  }

  /**
   * Rastreia evento
   */
  trackEvent(
    name: string,
    category: AnalyticsEvent["category"],
    properties?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      properties,
      timestamp: Date.now(),
      sessionId: this.session.id,
    };

    this.events.push(event);
    this.session.events++;

    // Limita eventos armazenados
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      logger.info(`[Analytics] ${name}`, properties);
    }
  }

  /**
   * Rastreia visualização de página
   */
  trackPageView(pageName: string, properties?: Record<string, unknown>): void {
    this.session.pageViews++;
    this.trackEvent(`page_view:${pageName}`, "page_view", properties);
  }

  /**
   * Rastreia ação do usuário
   */
  trackUserAction(action: string, properties?: Record<string, unknown>): void {
    this.trackEvent(`user_action:${action}`, "user_action", properties);
  }

  /**
   * Rastreia erro
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent("error", "error", {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Rastreia métrica de performance
   */
  trackPerformance(
    metric: string,
    value: number,
    properties?: Record<string, unknown>,
  ): void {
    this.trackEvent(`performance:${metric}`, "performance", {
      value,
      ...properties,
    });
  }

  /**
   * Rastreia evento de negócio
   */
  trackBusinessEvent(event: string, properties?: Record<string, unknown>): void {
    this.trackEvent(`business:${event}`, "business", properties);
  }

  /**
   * Define usuário atual
   */
  setUser(userId: string, role?: string): void {
    this.session.userRole = role;
    this.events.forEach((event) => {
      event.userId = userId;
    });
  }

  /**
   * Obtém estatísticas da sessão
   */
  getSessionStats() {
    const duration = Date.now() - this.session.startTime;
    const eventsByCategory = this.events.reduce(
      (acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      session: this.session,
      duration,
      eventsByCategory,
      totalEvents: this.events.length,
    };
  }

  /**
   * Exporta eventos para análise
   */
  exportEvents(): string {
    return JSON.stringify(
      {
        session: this.session,
        events: this.events,
        stats: this.getSessionStats(),
      },
      null,
      2,
    );
  }

  /**
   * Limpa eventos
   */
  clear(): void {
    this.events = [];
    this.session = this.createSession();
  }

  /**
   * Habilita/desabilita analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Instância singleton
export const analytics = new AnalyticsService();

// Hook React para usar analytics
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackBusinessEvent: analytics.trackBusinessEvent.bind(analytics),
    setUser: analytics.setUser.bind(analytics),
    getSessionStats: analytics.getSessionStats.bind(analytics),
    exportEvents: analytics.exportEvents.bind(analytics),
  };
}

// Rastreia erros globais automaticamente
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    analytics.trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    analytics.trackError(new Error(event.reason), {
      type: "unhandled_promise_rejection",
    });
  });
}
