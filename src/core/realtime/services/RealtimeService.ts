// @ts-nocheck
/**
 * RealtimeService - CORE SSOT
 *
 * Serviço centralizado para subscriptions realtime
 * Única fonte de verdade para conexões realtime
 *
 * REGRAS:
 * - ZERO acessos diretos ao supabase.channel() fora deste service
 * - Todas as subscriptions passam por aqui
 * - Gerenciamento centralizado de canais
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

export interface RealtimeSubscription {
  id: string;
  channel: any;
  unsubscribe: () => void;
}

export interface PostgresChangeSubscriptionOptions {
  subscriptionId: string;
  channelName: string;
  table: string;
  onChange: (payload: unknown) => void;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  filter?: string;
}

export class RealtimeService {
  private subscriptions = new Map<string, RealtimeSubscription>();

  /**
   * Envia evento broadcast para um canal realtime.
   */
  async sendBroadcast(
    channelName: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    try {
      await supabase.channel(channelName).send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (error) {
      trackError(error as Error, {
        component: "RealtimeService",
        action: "sendBroadcast",
        metadata: { channelName, event },
      });
      throw error;
    }
  }

  /**
   * Criar subscription genérica para postgres_changes.
   * SSOT para qualquer listener de tabela.
   */
  subscribeToPostgresChanges(
    options: PostgresChangeSubscriptionOptions,
  ): RealtimeSubscription {
    const {
      subscriptionId,
      channelName,
      table,
      onChange,
      event = "UPDATE",
      schema = "public",
      filter,
    } = options;

    try {
      this.unsubscribe(subscriptionId);

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event,
            schema,
            table,
            filter,
          },
          (payload) => {
            onChange(payload);
          },
        )
        .subscribe();

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        channel,
        unsubscribe: () => {
          channel.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        },
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscription;
    } catch (error) {
      trackError(error as Error, {
        component: "RealtimeService",
        action: "subscribeToPostgresChanges",
        metadata: {
          subscriptionId,
          channelName,
          table,
          event,
          schema,
          filter,
        },
      });
      throw error;
    }
  }

  /**
   * Criar subscription para mensagens de grupo
   */
  subscribeToGroupMessages(
    groupId: string,
    onMessage: (message: any) => void,
  ): RealtimeSubscription {
    const subscriptionId = `group-messages-${groupId}`;

    try {
      // Remover subscription existente se houver
      this.unsubscribe(subscriptionId);

      const channel = supabase
        .channel(`group-chat-${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages_new",
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            onMessage(payload.new);
          },
        )
        .subscribe();

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        channel,
        unsubscribe: () => {
          channel.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        },
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscription;
    } catch (error) {
      trackError(error as Error, {
        component: "RealtimeService",
        action: "subscribeToGroupMessages",
        metadata: { groupId },
      });
      throw error;
    }
  }

  /**
   * Criar subscription para notificações
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: any) => void,
  ): RealtimeSubscription {
    const subscriptionId = `notifications-${userId}`;

    try {
      // Remover subscription existente se houver
      this.unsubscribe(subscriptionId);

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            onNotification(payload.new);
          },
        )
        .subscribe();

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        channel,
        unsubscribe: () => {
          channel.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        },
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscription;
    } catch (error) {
      trackError(error as Error, {
        component: "RealtimeService",
        action: "subscribeToNotifications",
        metadata: { userId },
      });
      throw error;
    }
  }

  /**
   * Criar subscription para mensagens diretas
   */
  subscribeToDirectMessages(
    conversationId: string,
    onMessage: (message: any) => void,
  ): RealtimeSubscription {
    const subscriptionId = `direct-messages-${conversationId}`;

    try {
      // Remover subscription existente se houver
      this.unsubscribe(subscriptionId);

      const channel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            onMessage(payload.new);
          },
        )
        .subscribe();

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        channel,
        unsubscribe: () => {
          channel.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        },
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscription;
    } catch (error) {
      trackError(error as Error, {
        component: "RealtimeService",
        action: "subscribeToDirectMessages",
        metadata: { conversationId },
      });
      throw error;
    }
  }

  /**
   * Remover subscription específica
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      logger.info(`Realtime subscription removed: ${subscriptionId}`);
    }
  }

  /**
   * Remover todas as subscriptions
   */
  unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    logger.info("All realtime subscriptions removed");
  }

  /**
   * Obter subscription ativa
   */
  getSubscription(subscriptionId: string): RealtimeSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Listar todas as subscriptions ativas
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const realtimeService = new RealtimeService();
