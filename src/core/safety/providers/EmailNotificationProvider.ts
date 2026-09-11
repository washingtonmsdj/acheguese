/**
 * EmailNotificationProvider - authenticated client adapter for the durable
 * emergency-email worker. The browser sends only canonical IDs; delivery state
 * is owned by the server-side outbox and provider-confirmation pipeline.
 */
import { logger } from '@/shared/utils/logger';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';
import type { EmergencyAlert, EmergencyContact } from '../types';

export type EmailDeliveryStatus =
  | 'pending'
  | 'processing'
  | 'dispatching'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'reconciliation_required';

export interface EmailDeliveryResult {
  success: boolean;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: EmailDeliveryStatus;
  error?: string;
  metadata?: Record<string, unknown>;
}

const SUCCESS_STATUSES = new Set<EmailDeliveryStatus>([
  'processing',
  'dispatching',
  'sent',
  'delivered',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isEmailDeliveryStatus(value: unknown): value is EmailDeliveryStatus {
  return (
    typeof value === 'string' &&
    [
      'pending',
      'processing',
      'dispatching',
      'sent',
      'delivered',
      'failed',
      'cancelled',
      'reconciliation_required',
    ].includes(value)
  );
}

function validSuccessResponse(
  data: unknown,
  expectedContactId: string,
): data is {
  success: true;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: EmailDeliveryStatus;
  metadata?: Record<string, unknown>;
} {
  if (!isRecord(data)) return false;
  return (
    data.success === true &&
    data.contactId === expectedContactId &&
    data.channel === 'email' &&
    typeof data.timestamp === 'string' &&
    data.timestamp.length > 0 &&
    isEmailDeliveryStatus(data.status) &&
    SUCCESS_STATUSES.has(data.status) &&
    (data.metadata === undefined || isRecord(data.metadata))
  );
}

export class EmailNotificationProvider {
  async sendEmergencyAlert(
    contact: EmergencyContact,
    alert: EmergencyAlert,
  ): Promise<EmailDeliveryResult> {
    const timestamp = new Date().toISOString();

    try {
      const { data, error } = await supabase.functions.invoke(
        'send-emergency-email',
        {
          body: {
            contactId: contact.id,
            alertId: alert.id,
          },
        },
      );

      if (error) {
        const message =
          (await resolveSupabaseFunctionErrorMessage(error)) ??
          'Falha ao processar email de emergência';
        throw new Error(message);
      }

      if (!validSuccessResponse(data, contact.id)) {
        throw new Error('Resposta inválida do serviço de email de emergência');
      }

      logger.info('[EmailNotificationProvider] Emergency email worker result', {
        contactId: contact.id,
        alertId: alert.id,
        status: data.status,
      });

      return {
        success: true,
        contactId: data.contactId,
        channel: 'email',
        timestamp: data.timestamp,
        status: data.status,
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
