/**
 * EmailNotificationProvider - browser adapter for the canonical durable
 * emergency-email broker. The browser sends only canonical IDs; delivery state
 * is owned by the server-side outbox and provider-confirmation pipeline. The
 * same broker also has a separately authenticated cron ingress for recovery.
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

const KNOWN_DELIVERY_STATUSES = new Set<EmailDeliveryStatus>([
  'pending',
  'processing',
  'dispatching',
  'sent',
  'delivered',
  'failed',
  'cancelled',
  'reconciliation_required',
]);

const REQUEST_SUCCESS_STATUSES = new Set<EmailDeliveryStatus>([
  'processing',
  'dispatching',
  'sent',
  'delivered',
]);

const REQUEST_NON_SUCCESS_STATUSES = new Set<EmailDeliveryStatus>([
  'failed',
  'cancelled',
  'reconciliation_required',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isEmailDeliveryStatus(value: unknown): value is EmailDeliveryStatus {
  return (
    typeof value === 'string' &&
    KNOWN_DELIVERY_STATUSES.has(value as EmailDeliveryStatus)
  );
}

function isConsistentWorkerOutcome(
  success: boolean,
  status: EmailDeliveryStatus,
): boolean {
  return success
    ? REQUEST_SUCCESS_STATUSES.has(status)
    : REQUEST_NON_SUCCESS_STATUSES.has(status);
}

function validWorkerResponse(
  data: unknown,
  expectedContactId: string,
): data is {
  success: boolean;
  contactId: string;
  channel: 'email';
  timestamp: string;
  status: EmailDeliveryStatus;
  error?: string;
  metadata?: Record<string, unknown>;
} {
  if (!isRecord(data) || !isEmailDeliveryStatus(data.status)) return false;
  if (typeof data.success !== 'boolean') return false;

  return (
    data.contactId === expectedContactId &&
    data.channel === 'email' &&
    typeof data.timestamp === 'string' &&
    data.timestamp.length > 0 &&
    isConsistentWorkerOutcome(data.success, data.status) &&
    (data.error === undefined || typeof data.error === 'string') &&
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

      if (!validWorkerResponse(data, contact.id)) {
        throw new Error('Resposta inválida do serviço de email de emergência');
      }

      logger.info('[EmailNotificationProvider] Emergency email worker result', {
        contactId: contact.id,
        alertId: alert.id,
        success: data.success,
        status: data.status,
      });

      return {
        success: data.success,
        contactId: data.contactId,
        channel: 'email',
        timestamp: data.timestamp,
        status: data.status,
        error: data.error,
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
