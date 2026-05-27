/**
 * ══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION SERVICE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Serviço para gerenciar notificações in-app.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import { SessionService } from '@/core/session/services/SessionService';
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  category: 'transactional' | 'social' | 'system' | 'marketing';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateNotificationInput {
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: 'transactional' | 'social' | 'system' | 'marketing';
  priority?: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  read?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface UserNotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  new_messages: boolean;
  new_comments: boolean;
  new_likes: boolean;
  new_followers: boolean;
  business_updates: boolean;
  community_updates: boolean;
  weekly_digest: boolean;
}

export class NotificationService {
  private static readonly db = supabase as any;
  /**
   * Cria uma nova notificação (via função SQL que respeita preferências)
   */
  static async createNotification(input: CreateNotificationInput): Promise<string | null> {
    const { data, error } = await this.db.rpc('create_notification', {
      p_user_id: input.user_id,
      p_type: input.type,
      p_category: input.category || 'social',
      p_title: input.title,
      p_message: input.message,
      p_action_url: input.action_url || null,
      p_action_label: input.action_label || null,
      p_metadata: (input.metadata || {}) as Record<string, unknown>,
    });

    if (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtém notificações do usuário atual
   */
  static async getUserNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = this.db
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters?.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }

    return (data as Notification[]) || [];
  }

  /**
   * Marca notificação como lida
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.db.rpc('mark_notification_as_read', {
      p_notification_id: notificationId,
    });

    if (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  static async markAllAsRead(): Promise<number> {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.db.rpc('mark_all_notifications_as_read', {
      p_user_id: user.id,
    });

    if (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }

    return data || 0;
  }

  /**
   * Deleta uma notificação
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.db
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Obtém contagem de notificações não lidas
   */
  static async getUnreadCount(): Promise<number> {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return 0;
    }

    const { data, error } = await this.db.rpc('get_unread_notifications_count', {
      p_user_id: user.id,
    });

    if (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Obtém estatísticas de notificações
   */
  static async getStats(userId: string): Promise<{ total: number; unread: number }> {
    try {
      const [totalResult, unreadResult] = await Promise.all([
        this.db
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        this.db
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false),
      ]);

      return {
        total: totalResult.count || 0,
        unread: unreadResult.count || 0,
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      return { total: 0, unread: 0 };
    }
  }

  /**
   * Subscribe to realtime notifications
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    const channel = this.db
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      this.db.removeChannel(channel);
    };
  }

  async fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    return NotificationService.getUserNotifications(filters);
  }

  async createNotification(input: CreateNotificationInput): Promise<string | null> {
    return NotificationService.createNotification(input);
  }

  createRealtimeChannel(userId: string, callback: (notification: Notification) => void) {
    return NotificationService.subscribeToNotifications(userId, callback);
  }

  async markAsRead(notificationId: string): Promise<void> {
    return NotificationService.markAsRead(notificationId);
  }

  async markAllAsRead(): Promise<number> {
    return NotificationService.markAllAsRead();
  }

  async getUnreadCount(): Promise<number> {
    return NotificationService.getUnreadCount();
  }

  async getStats(userId: string): Promise<{ total: number; unread: number }> {
    return NotificationService.getStats(userId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return NotificationService.deleteNotification(notificationId);
  }

  async getNotificationSettings(userId: string): Promise<Partial<UserNotificationSettings> | null> {
    const { data, error } = await NotificationService.db
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching user notification settings:", error);
      return null;
    }

    return data as Partial<UserNotificationSettings> | null;
  }

  async updateNotificationSettings(
    userId: string,
    input: Partial<UserNotificationSettings>,
  ): Promise<void> {
    const payload = {
      user_id: userId,
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { error } = await NotificationService.db
      .from("user_notification_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      logger.error("Error updating user notification settings:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

