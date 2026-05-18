import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { profileService } from '@/core/profiles/services/ProfileService';
import { emailNotificationProvider } from '../providers/EmailNotificationProvider';
import type {
  EmergencyAlert,
  EmergencyContact,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
  SafetyResult,
} from '../types';

type EmergencyContactRow = {
  id: string;
  profile_id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export class SafetyEmergencyContactsService {
  static async createEmergencyContact(
    input: CreateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    try {
      const contactData = {
        profile_id: input.profileId,
        name: input.name,
        phone: input.phone,
        relationship: input.relationship,
        is_primary: input.isPrimary || false,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('emergency_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: this.mapToEmergencyContact(data) };
    } catch (error) {
      logger.error('[SafetyService] Error creating emergency contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar contato',
      };
    }
  }

  static async listEmergencyContacts(profileId: string): Promise<EmergencyContact[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('emergency_contacts')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => this.mapToEmergencyContact(item));
    } catch (error) {
      logger.error('[SafetyService] Error listing emergency contacts:', error);
      return [];
    }
  }

  static async updateEmergencyContact(
    contactId: string,
    updates: UpdateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
      if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await (supabase as any)
        .from('emergency_contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: this.mapToEmergencyContact(data) };
    } catch (error) {
      logger.error('[SafetyService] Error updating emergency contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar contato',
      };
    }
  }

  static async deleteEmergencyContact(contactId: string): Promise<SafetyResult<void>> {
    try {
      const { error } = await (supabase as any)
        .from('emergency_contacts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', contactId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('[SafetyService] Error deleting emergency contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar contato',
      };
    }
  }

  static async notifyEmergencyContacts(
    profileId: string,
    alert: EmergencyAlert
  ): Promise<{ contactsNotified: number; contactIds: string[]; successful: number; failed: number }> {
    try {
      const contacts = await this.listEmergencyContacts(profileId);
      if (contacts.length === 0) {
        logger.warn('[SafetyService] No emergency contacts found for profile:', profileId);
        return { contactsNotified: 0, contactIds: [], successful: 0, failed: 0 };
      }

      const profileRecord = await profileService.getProfileById(profileId);
      const userProfile = {
        name: profileRecord?.name,
        phone:
          profileRecord &&
          typeof profileRecord === 'object' &&
          'phone' in profileRecord
            ? (profileRecord as { phone?: string | null }).phone
            : undefined,
      };

      const deliveryResults = await Promise.allSettled(
        contacts.map(async (contact) => {
          const result = await emailNotificationProvider.sendEmergencyAlert(
            contact,
            alert,
            userProfile
          );
          await this.saveDeliveryLog(alert.id, result);
          return result;
        })
      );

      const successful = deliveryResults.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = deliveryResults.length - successful;

      logger.info(
        `[SafetyService] Notified ${successful}/${contacts.length} emergency contacts about alert ${alert.id}`,
        { successful, failed }
      );

      return {
        contactsNotified: contacts.length,
        contactIds: contacts.map((c) => c.id),
        successful,
        failed,
      };
    } catch (error) {
      logger.error('[SafetyService] Error notifying emergency contacts:', error);
      return { contactsNotified: 0, contactIds: [], successful: 0, failed: 0 };
    }
  }

  private static async saveDeliveryLog(
    alertId: string,
    result: {
      success: boolean;
      contactId: string;
      channel: string;
      timestamp: string;
      status: string;
      error?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const target = result.metadata?.to as string || 'unknown';

      await (supabase as any).from('emergency_delivery_log').insert({
        alert_id: alertId,
        contact_id: result.contactId,
        channel: result.channel,
        status: result.status,
        target,
        error_message: result.error,
        metadata: result.metadata || {},
        created_at: result.timestamp,
        delivered_at: result.status === 'sent' ? result.timestamp : null,
      });
    } catch (error) {
      logger.error('[SafetyService] Error saving delivery log:', error);
    }
  }

  private static mapToEmergencyContact(data: EmergencyContactRow): EmergencyContact {
    return {
      id: data.id,
      profileId: data.profile_id,
      name: data.name,
      phone: data.phone,
      relationship: data.relationship,
      isPrimary: data.is_primary,
      isActive: data.is_active,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
