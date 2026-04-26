/**
 * EmailNotificationProvider - Provedor de notificações via Email
 * 
 * Usa Supabase Edge Function para envio seguro server-side
 * 
 * Padrão: Provider isolado, injetado no SafetyService
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
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

export class EmailNotificationProvider {
  /**
   * Envia email de emergência para contato via Edge Function
   */
  async sendEmergencyAlert(
    contact: EmergencyContact,
    alert: EmergencyAlert,
    userProfile: { name?: string; phone?: string }
  ): Promise<EmailDeliveryResult> {
    const timestamp = new Date().toISOString();
    
    try {
      // Validar email no campo phone (assumindo que pode conter email)
      const email = this.extractEmail(contact.phone);
      
      if (!email) {
        return {
          success: false,
          contactId: contact.id,
          channel: 'email',
          timestamp,
          status: 'failed',
          error: 'Email inválido ou não fornecido',
        };
      }

      // Chamar Edge Function (server-side seguro)
      const { data, error } = await supabase.functions.invoke('send-emergency-email', {
        body: {
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: email,
          alertId: alert.id,
          alertType: alert.alertType,
          alertCreatedAt: alert.createdAt,
          alertDescription: alert.description,
          alertLocation: alert.location,
          userName: userProfile.name,
          userPhone: userProfile.phone,
        },
      });

      if (error) {
        throw error;
      }

      // Edge Function retorna EmailResponse estruturado
      logger.info('[EmailNotificationProvider] Email sent via Edge Function', {
        contactId: contact.id,
        alertId: alert.id,
        status: data.status,
      });

      return {
        success: data.success,
        contactId: data.contactId,
        channel: data.channel,
        timestamp: data.timestamp,
        status: data.status,
        error: data.error,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error('[EmailNotificationProvider] Error sending email:', error);
      
      return {
        success: false,
        contactId: contact.id,
        channel: 'email',
        timestamp,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Extrai email válido do campo phone
   * (Suporta phone ou email no mesmo campo)
   */
  private extractEmail(phoneOrEmail: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(phoneOrEmail)) {
      return phoneOrEmail;
    }
    
    return null;
  }
}

export const emailNotificationProvider = new EmailNotificationProvider();
