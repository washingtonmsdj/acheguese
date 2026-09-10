/**
 * Push Service
 *
 * Handles browser push subscription lifecycle and self-test delivery.
 * Delivery authority stays in Supabase Edge Functions.
 */

import { logger } from '@/shared/utils/logger';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';

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
  data?: Record<string, unknown>;
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

type OperationResult = { success: boolean; error?: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function edgeErrorMessage(error: unknown, fallback: string): Promise<string> {
  return (await resolveSupabaseFunctionErrorMessage(error)) ?? fallback;
}

function isSuccessfulCommand(data: unknown): boolean {
  return isRecord(data) && data.success === true;
}

export class PushService {
  /** Check if push notifications are supported. */
  static isSupported(): boolean {
    if (import.meta.env.DEV) return false;
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /** Check if user has granted permission. */
  static async hasPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    return Notification.permission === 'granted';
  }

  /** Request permission for push notifications. */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /** Subscribe the current user/device to push notifications. */
  static async subscribe(userId: string): Promise<OperationResult> {
    try {
      if (!this.isSupported()) {
        return { success: false, error: 'Push notifications not supported' };
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return { success: false, error: 'Permission denied' };
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const { data: configData, error: configError } = await supabase.functions.invoke(
        'get-push-config',
      );

      if (configError) {
        const message = await edgeErrorMessage(
          configError,
          'Failed to get push configuration',
        );
        logger.error('Error getting push config:', { message });
        return { success: false, error: message };
      }

      if (
        !isRecord(configData) ||
        typeof configData.vapidPublicKey !== 'string' ||
        !configData.vapidPublicKey.trim()
      ) {
        return { success: false, error: 'Invalid push configuration response' };
      }

      const browserSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          configData.vapidPublicKey,
        ) as unknown as BufferSource,
      });

      const rollbackBrowserSubscription = async () => {
        try {
          await browserSubscription.unsubscribe();
        } catch (rollbackError) {
          logger.warn('Failed to roll back browser push subscription:', {
            message: errorMessage(rollbackError),
          });
        }
      };

      const subscriptionJson = browserSubscription.toJSON();
      const endpoint = subscriptionJson.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        await rollbackBrowserSubscription();
        return { success: false, error: 'Invalid browser push subscription' };
      }

      const { data, error } = await supabase.functions.invoke('subscribe-push', {
        body: {
          userId,
          subscription: { endpoint, p256dh, auth },
          userAgent: navigator.userAgent,
          deviceName: this.getDeviceName(),
        },
      });

      if (error) {
        await rollbackBrowserSubscription();
        const message = await edgeErrorMessage(error, 'Failed to store push subscription');
        logger.error('Error storing push subscription:', { message });
        return { success: false, error: message };
      }

      if (
        !isRecord(data) ||
        data.success !== true ||
        typeof data.subscriptionId !== 'string' ||
        !UUID_PATTERN.test(data.subscriptionId)
      ) {
        await rollbackBrowserSubscription();
        return { success: false, error: 'Invalid push subscription response' };
      }

      return { success: true };
    } catch (error) {
      const message = errorMessage(error);
      logger.error('Exception subscribing to push:', { message });
      return { success: false, error: message };
    }
  }

  /**
   * Disable delivery server-side first, then remove the local browser
   * subscription as best effort. This avoids leaving a server-active endpoint
   * when the Edge mutation fails.
   */
  static async unsubscribe(subscriptionId: string): Promise<OperationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('unsubscribe-push', {
        body: { subscriptionId },
      });

      if (error) {
        const message = await edgeErrorMessage(error, 'Failed to remove push subscription');
        logger.error('Error removing push subscription:', { message });
        return { success: false, error: message };
      }

      if (!isSuccessfulCommand(data)) {
        return { success: false, error: 'Invalid push unsubscribe response' };
      }

      if (this.isSupported()) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const browserSubscription = await registration.pushManager.getSubscription();
            if (browserSubscription) {
              await browserSubscription.unsubscribe();
            }
          }
        } catch (browserError) {
          logger.warn('Server disabled push but browser cleanup failed:', {
            message: errorMessage(browserError),
          });
        }
      }

      return { success: true };
    } catch (error) {
      const message = errorMessage(error);
      logger.error('Exception unsubscribing from push:', { message });
      return { success: false, error: message };
    }
  }

  /** Get active push subscriptions for the current user. */
  static async getSubscriptions(userId: string): Promise<StoredPushSubscription[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching push subscriptions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Self-delivery primitive used only by the test notification flow.
   * The Edge function rejects attempts to send to another user.
   */
  private static async sendToUser(
    userId: string,
    notification: PushNotificationPayload,
  ): Promise<OperationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { userId, notification },
      });

      if (error) {
        const message = await edgeErrorMessage(error, 'Failed to send push notification');
        logger.error('Error sending push notification:', { message });
        return { success: false, error: message };
      }

      if (!isRecord(data) || data.success !== true) {
        return { success: false, error: 'Invalid push delivery response' };
      }

      const successCount = data.successCount;
      if (typeof successCount !== 'number' || !Number.isSafeInteger(successCount) || successCount < 1) {
        const errors = Array.isArray(data.errors)
          ? data.errors.filter((entry): entry is string => typeof entry === 'string')
          : [];
        return {
          success: false,
          error: errors[0] ?? 'Push provider did not deliver the notification',
        };
      }

      return { success: true };
    } catch (error) {
      const message = errorMessage(error);
      logger.error('Exception sending push notification:', { message });
      return { success: false, error: message };
    }
  }

  /** Test push notification for the current user. */
  static async sendTestNotification(userId: string): Promise<OperationResult> {
    return this.sendToUser(userId, {
      title: 'Notificação de Teste',
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

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
  }

  private static getDeviceName(): string {
    const ua = navigator.userAgent;

    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*?;\s*([^)]+)/);
      return match ? match[1] : 'Android Device';
    }

    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    if (/Edge/.test(ua)) return 'Edge';

    return 'Unknown Device';
  }
}
