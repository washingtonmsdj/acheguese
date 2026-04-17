/**
 * Analytics Service
 *
 * Handles analytics event tracking
 * SSOT for analytics_events table
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";

interface AnalyticsEvent {
  event_type: string;
  business_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

class AnalyticsServiceClass {
  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await (supabase as unknown as AdminSupabaseClient)
        .from("analytics_events").insert({
        ...event,
        timestamp: new Date().toISOString(),
      });
      if (error) {
        logger.error("Analytics tracking error:", error);
      }
    } catch (error) {
      logger.error("Analytics tracking error:", error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(businessId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      event_type: "page_view",
      business_id: businessId,
      user_id: userId,
      metadata: {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track business interaction
   */
  async trackBusinessInteraction(
    businessId: string,
    action: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.trackEvent({
      event_type: "business_interaction",
      business_id: businessId,
      user_id: userId,
      metadata: {
        action,
        ...metadata,
      },
    });
  }
}

export const analyticsService = new AnalyticsServiceClass();
