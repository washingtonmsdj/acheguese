/**
 * EmailNotificationProvider - Provedor de notificações via Email
 *
 * Usa Supabase Edge Function para envio seguro server-side
 *
 * Padrão: Provider isolado, injetado no SafetyService
 */
import { logger } from '@/shared/utils/logger';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';
import type { EmergencyAlert, EmergencyContact } from '../types';

export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed';

export interface EmailDeliveryResult {
  success: boolean;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: EmailDeliveryStatus;
  error?: string;
  metadata?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validSuccessResponse(
  data: unknown,
  expectedContactId: string,
): data is {
  success: true;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: 'sent';
  metadata?: Record<string, unknown>;
} {
  if (!isRecord(data)) return false;
  return (
    data.success === true &&
    data.contactId === expectedContactId &&
    data.channel === 'email' &&
    typeof data.timestamp === 'string' &&
    data.timestamp.length > 0 &&
    data.status === 'sent' &&
    (data.metadata === undefined || isRecord(data.metadata))
  );
}

export class EmailNotificationProvider {
  /**
   * Envia email de emergência para contato via Edge Function
   */
  async sendEmergencyAlert(
    contact: EmergencyContact,
    alert: EmergencyAlert,
  ): Promise<EmailDeliveryResult> {
    const timestamp = new Date().toISOString();

    try {
      const { data, error } = await supabase.functions.invoke('send-emergency-email', {
        body: {
          contactId: contact.id,
          alertId: alert.id,
        },
      });

      if (error) {
        const message =
          (await resolveSupabaseFunctionErrorMessage(error)) ??
          'Falha ao enviar email de emergência';
        throw new Error(message);
      }

      if (!validSuccessResponse(data, contact.id)) {
        throw new Error('Resposta inválida do serviço de email de emergência');
      }

      logger.info('[EmailNotificationProvider] Email sent via Edge Function', {
        contactId: contact.id,
        alertId: alert.id,
        status: data.status,
      });

      return {
        success: true,
        contactId: contact.id,
        channel: 'email',
        timestamp: data.timestamp,
        status: 'sent',
        metadata: data.metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('[EmailNotificationProvider] Error sending email:', {
        contactId: contact.id,
        alertId: alert.id,
        message,
      });

      return {
        success: false,
        contactId: contact.id,
        channel: 'email',
        timestamp,
        status: 'failed',
        error: message,
      };
    }
  }
}

export const emailNotificationProvider = new EmailNotificationProvider();
