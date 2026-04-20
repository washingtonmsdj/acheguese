/**
 * Push Service
 * 
 * Handles push notification subscriptions and sending.
 * Uses Firebase Cloud Messaging (FCM) for delivery.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface StoredPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  device_name: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export class PushService {
  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Check if user has granted permission
   */
  static async hasPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    return Notification.permission === 'granted';
  }

  /**
   * Request permission for push notifications
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribe(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check support
      if (!this.isSupported()) {
        return { success: false, error: 'Push notifications not supported' };
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return { success: false, error: 'Permission denied' };
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from edge function
      const { data: configData, error: configError } = await supabase.functions.invoke(
        'get-push-config'
      );

      if (configError || !configData?.vapidPublicKey) {
        logger.error('Error getting push config:', configError);
        return { success: false, error: 'Failed to get push configuration' };
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(configData.vapidPublicKey),
      });

      // Convert to JSON
      const subscriptionJson = subscription.toJSON();

      // Store subscription in database via edge function
      const { data, error } = await supabase.functions.invoke('subscribe-push', {
        body: {
          userId,
          subscription: {
            endpoint: subscriptionJson.endpoint!,
            p256dh: subscriptionJson.keys!.p256dh!,
            auth: subscriptionJson.keys!.auth!,
          },
          userAgent: navigator.userAgent,
          deviceName: this.getDeviceName(),
        },
      });

      if (error) {
        logger.error('Error storing push subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception subscribing to push:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Unsubscribe from browser
      if (this.isSupported()) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      // Remove from database via edge function
      const { error } = await supabase.functions.invoke('unsubscribe-push', {
        body: { subscriptionId },
      });

      if (error) {
        logger.error('Error removing push subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception unsubscribing from push:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get user's push subscriptions
   */
  static async getSubscriptions(userId: string): Promise<StoredPushSubscription[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching push subscriptions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Send push notification to user
   */
  static async sendToUser(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          userId,
          notification,
        },
      });

      if (error) {
        logger.error('Error sending push notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception sending push notification:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    notification: PushNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-bulk', {
        body: {
          userIds,
          notification,
        },
      });

      if (error) {
        logger.error('Error sending bulk push notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception sending bulk push notifications:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Test push notification (sends to current user)
   */
  static async sendTestNotification(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(userId, {
      title: 'Notificação de Teste 🎉',
      body: 'Se você está vendo isso, as notificações push estão funcionando!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get device name from user agent
   */
  private static getDeviceName(): string {
    const ua = navigator.userAgent;

    // Mobile devices
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*([^)]+)/);
      return match ? match[1] : 'Android Device';
    }

    // Desktop browsers
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    if (/Edge/.test(ua)) return 'Edge';

    return 'Unknown Device';
  }
}

