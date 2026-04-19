/**
 * Analytics Service
 * 
 * Serviço para rastrear eventos de negócio e conversões
 * Integrado com Supabase para persistência
 * 
 * @version 1.0.0
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { addSentryBreadcrumb } from '@/shared/config/sentry.config';

/**
 * Tipos de eventos rastreados
 */
export type AnalyticsEvent =
  // Auth & Onboarding
  | 'signup'
  | 'login'
  | 'logout'
  | 'email_verified'
  | 'profile_completed'
  
  // Subscription & Billing
  | 'subscription_created'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'payment_succeeded'
  | 'payment_failed'
  
  // Business
  | 'business_created'
  | 'business_claimed'
  | 'business_verified'
  | 'business_published'
  
  // Mobility
  | 'ride_requested'
  | 'ride_offer_created'
  | 'ride_accepted'
  | 'ride_completed'
  | 'ride_cancelled'
  
  // Gastronomy
  | 'gastronomy_subscription_created'
  | 'menu_created'
  | 'order_placed'
  
  // Engagement
  | 'page_view'
  | 'feature_used'
  | 'search_performed'
  | 'content_shared'
  | 'feedback_submitted';

/**
 * Propriedades do evento
 */
export interface AnalyticsEventProperties {
  // Identificação
  user_id?: string;
  session_id?: string;
  
  // Contexto
  page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  
  // Dados específicos do evento
  [key: string]: any;
}

/**
 * Analytics Service
 */
export class AnalyticsService {
  private static eventQueue: Array<{
    event: AnalyticsEvent;
    properties: AnalyticsEventProperties;
  }> = [];
  
  private static flushTimer: NodeJS.Timeout | null = null;
  private static readonly FLUSH_INTERVAL = 10000; // 10 segundos
  private static readonly BATCH_SIZE = 20;

  /**
   * Inicializa o serviço
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;
    
    // Iniciar flush periódico
    this.startPeriodicFlush();
    
    // Flush antes de sair
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  /**
   * Rastreia um evento
   */
  static track(
    event: AnalyticsEvent,
    properties: AnalyticsEventProperties = {}
  ): void {
    try {
      // Adicionar contexto automático
      const enrichedProperties: AnalyticsEventProperties = {
        ...properties,
        page: window.location.pathname,
        referrer: document.referrer || undefined,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      };

      // Adicionar à fila
      this.eventQueue.push({
        event,
        properties: enrichedProperties,
      });

      // Log em desenvolvimento
      if (import.meta.env.DEV) {
        logger.debug(`[Analytics] ${event}`, enrichedProperties);
      }

      // Adicionar breadcrumb no Sentry
      if (import.meta.env.PROD) {
        addSentryBreadcrumb(
          `Analytics: ${event}`,
          'analytics',
          'info',
          enrichedProperties
        );
      }

      // Flush se a fila estiver cheia
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        this.flush();
      }
    } catch (error) {
      logger.error('Failed to track analytics event', error, { event });
    }
  }

  // ============================================================
  // AUTH & ONBOARDING EVENTS
  // ============================================================

  static trackSignup(userId: string, method: 'email' | 'google' | 'apple'): void {
    this.track('signup', {
      user_id: userId,
      method,
    });
  }

  static trackLogin(userId: string, method: 'email' | 'google' | 'apple'): void {
    this.track('login', {
      user_id: userId,
      method,
    });
  }

  static trackEmailVerified(userId: string): void {
    this.track('email_verified', {
      user_id: userId,
    });
  }

  static trackProfileCompleted(userId: string, profileType: string): void {
    this.track('profile_completed', {
      user_id: userId,
      profile_type: profileType,
    });
  }

  // ============================================================
  // SUBSCRIPTION & BILLING EVENTS
  // ============================================================

  static trackSubscriptionCreated(
    userId: string,
    plan: string,
    amount: number,
    interval: 'month' | 'year'
  ): void {
    this.track('subscription_created', {
      user_id: userId,
      plan,
      amount,
      interval,
      currency: 'BRL',
    });
  }

  static trackSubscriptionUpgraded(
    userId: string,
    fromPlan: string,
    toPlan: string,
    amount: number
  ): void {
    this.track('subscription_upgraded', {
      user_id: userId,
      from_plan: fromPlan,
      to_plan: toPlan,
      amount,
    });
  }

  static trackSubscriptionCancelled(
    userId: string,
    plan: string,
    reason?: string
  ): void {
    this.track('subscription_cancelled', {
      user_id: userId,
      plan,
      reason,
    });
  }

  static trackPaymentSucceeded(
    userId: string,
    amount: number,
    plan: string
  ): void {
    this.track('payment_succeeded', {
      user_id: userId,
      amount,
      plan,
    });
  }

  static trackPaymentFailed(
    userId: string,
    amount: number,
    plan: string,
    error: string
  ): void {
    this.track('payment_failed', {
      user_id: userId,
      amount,
      plan,
      error,
    });
  }

  // ============================================================
  // BUSINESS EVENTS
  // ============================================================

  static trackBusinessCreated(userId: string, businessId: string, category: string): void {
    this.track('business_created', {
      user_id: userId,
      business_id: businessId,
      category,
    });
  }

  static trackBusinessClaimed(userId: string, businessId: string): void {
    this.track('business_claimed', {
      user_id: userId,
      business_id: businessId,
    });
  }

  static trackBusinessVerified(userId: string, businessId: string): void {
    this.track('business_verified', {
      user_id: userId,
      business_id: businessId,
    });
  }

  // ============================================================
  // MOBILITY EVENTS
  // ============================================================

  static trackRideRequested(
    userId: string,
    origin: string,
    destination: string,
    distance: number
  ): void {
    this.track('ride_requested', {
      user_id: userId,
      origin,
      destination,
      distance_km: distance,
    });
  }

  static trackRideAccepted(
    userId: string,
    rideId: string,
    driverId: string,
    price: number
  ): void {
    this.track('ride_accepted', {
      user_id: userId,
      ride_id: rideId,
      driver_id: driverId,
      price,
    });
  }

  static trackRideCompleted(
    userId: string,
    rideId: string,
    driverId: string,
    price: number,
    duration: number
  ): void {
    this.track('ride_completed', {
      user_id: userId,
      ride_id: rideId,
      driver_id: driverId,
      price,
      duration_minutes: duration,
    });
  }

  // ============================================================
  // ENGAGEMENT EVENTS
  // ============================================================

  static trackPageView(path: string, userId?: string): void {
    this.track('page_view', {
      user_id: userId,
      path,
    });
  }

  static trackFeatureUsed(feature: string, userId: string): void {
    this.track('feature_used', {
      user_id: userId,
      feature,
    });
  }

  static trackSearch(query: string, resultsCount: number, userId?: string): void {
    this.track('search_performed', {
      user_id: userId,
      query,
      results_count: resultsCount,
    });
  }

  // ============================================================
  // PERSISTENCE
  // ============================================================

  /**
   * Inicia flush periódico
   */
  private static startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Persiste eventos no Supabase
   */
  static async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.BATCH_SIZE);

    try {
      const records = batch.map(({ event, properties }) => ({
        event,
        properties,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('analytics_events')
        .insert(records);

      if (error) {
        // Recolocar na fila em caso de erro (mas não infinitamente)
        if (batch.length < 100) {
          this.eventQueue.unshift(...batch);
        }
        logger.error('Failed to persist analytics events', error);
      }
    } catch (error) {
      logger.error('Failed to flush analytics events', error);
    }
  }

  /**
   * Cleanup
   */
  static destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  AnalyticsService.initialize();
}
