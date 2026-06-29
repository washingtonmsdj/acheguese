import { profileService } from "@/core/profiles/services/ProfileService";
import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { emailNotificationProvider } from "../providers/EmailNotificationProvider";
import type {
  CreateEmergencyContactInput,
  EmergencyAlert,
  EmergencyContact,
  SafetyResult,
  UpdateEmergencyContactInput,
} from "../types";

type EmergencyContactRow = Database["public"]["Tables"]["emergency_contacts"]["Row"];
type EmergencyContactInsert = Database["public"]["Tables"]["emergency_contacts"]["Insert"];
type EmergencyContactUpdate = Database["public"]["Tables"]["emergency_contacts"]["Update"];
type EmergencyDeliveryLogInsert =
  Database["public"]["Tables"]["emergency_delivery_log"]["Insert"];

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
}

interface SafetyDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

type DeliveryResult = {
  success: boolean;
  contactId: string;
  channel: string;
  timestamp: string;
  status: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

const safetyDb = supabase as unknown as SafetyDbClient;

function buildEmergencyContactInsert(
  input: CreateEmergencyContactInput,
): EmergencyContactInsert {
  return {
    profile_id: input.profileId,
    name: input.name,
    phone: input.phone,
    relationship: input.relationship,
    is_primary: input.isPrimary || false,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

function buildEmergencyContactUpdate(
  updates: UpdateEmergencyContactInput,
): EmergencyContactUpdate {
  const updateData: EmergencyContactUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
  if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  return updateData;
}

function mapToEmergencyContact(data: EmergencyContactRow): EmergencyContact {
  return {
    id: data.id,
    profileId: data.profile_id,
    name: data.name,
    phone: data.phone,
    relationship: data.relationship ?? "",
    isPrimary: data.is_primary,
    isActive: data.is_active,
    metadata:
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export class SafetyEmergencyContactsService {
  static async createEmergencyContact(
    input: CreateEmergencyContactInput,
  ): Promise<SafetyResult<EmergencyContact>> {
    try {
      const { data, error } = await safetyDb
        .from<EmergencyContactRow>("emergency_contacts")
        .insert(buildEmergencyContactInsert(input))
        .select()
        .single();

      if (error || !data) throw error ?? new Error("Failed to create emergency contact");
      return { success: true, data: mapToEmergencyContact(data) };
    } catch (error) {
      logger.error("[SafetyService] Error creating emergency contact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar contato",
      };
    }
  }

  static async listEmergencyContacts(profileId: string): Promise<EmergencyContact[]> {
    try {
      const { data, error } = await safetyDb
        .from<EmergencyContactRow>("emergency_contacts")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToEmergencyContact);
    } catch (error) {
      logger.error("[SafetyService] Error listing emergency contacts:", error);
      return [];
    }
  }

  static async updateEmergencyContact(
    contactId: string,
    updates: UpdateEmergencyContactInput,
  ): Promise<SafetyResult<EmergencyContact>> {
    try {
      const { data, error } = await safetyDb
        .from<EmergencyContactRow>("emergency_contacts")
        .update(buildEmergencyContactUpdate(updates))
        .eq("id", contactId)
        .select()
        .single();

      if (error || !data) throw error ?? new Error("Failed to update emergency contact");
      return { success: true, data: mapToEmergencyContact(data) };
    } catch (error) {
      logger.error("[SafetyService] Error updating emergency contact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar contato",
      };
    }
  }

  static async deleteEmergencyContact(contactId: string): Promise<SafetyResult<void>> {
    try {
      const { error } = await safetyDb
        .from<EmergencyContactRow>("emergency_contacts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", contactId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error("[SafetyService] Error deleting emergency contact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao deletar contato",
      };
    }
  }

  static async notifyEmergencyContacts(
    profileId: string,
    alert: EmergencyAlert,
  ): Promise<{
    contactsNotified: number;
    contactIds: string[];
    successful: number;
    failed: number;
  }> {
    try {
      const contacts = await this.listEmergencyContacts(profileId);
      if (contacts.length === 0) {
        logger.warn("[SafetyService] No emergency contacts found for profile:", profileId);
        return { contactsNotified: 0, contactIds: [], successful: 0, failed: 0 };
      }

      const profileRecord = await profileService.getProfileById(profileId);
      const userProfile = {
        name: profileRecord?.name,
        phone:
          profileRecord &&
          typeof profileRecord === "object" &&
          "phone" in profileRecord
            ? (profileRecord as { phone?: string | null }).phone
            : undefined,
      };

      const deliveryResults = await Promise.allSettled(
        contacts.map(async (contact) => {
          const result = await emailNotificationProvider.sendEmergencyAlert(
            contact,
            alert,
            userProfile,
          );
          await this.saveDeliveryLog(alert.id, result);
          return result;
        }),
      );

      const successful = deliveryResults.filter(
        (result) => result.status === "fulfilled" && result.value.success,
      ).length;
      const failed = deliveryResults.length - successful;

      logger.info(
        `[SafetyService] Notified ${successful}/${contacts.length} emergency contacts about alert ${alert.id}`,
        { successful, failed },
      );

      return {
        contactsNotified: contacts.length,
        contactIds: contacts.map((contact) => contact.id),
        successful,
        failed,
      };
    } catch (error) {
      logger.error("[SafetyService] Error notifying emergency contacts:", error);
      return { contactsNotified: 0, contactIds: [], successful: 0, failed: 0 };
    }
  }

  private static async saveDeliveryLog(
    alertId: string,
    result: DeliveryResult,
  ): Promise<void> {
    try {
      const target =
        typeof result.metadata?.to === "string" ? result.metadata.to : "unknown";

      const payload: EmergencyDeliveryLogInsert = {
        alert_id: alertId,
        contact_id: result.contactId,
        channel: result.channel,
        status: result.status,
        target,
        error_message: result.error ?? null,
        metadata: ((result.metadata || {}) as unknown) as Json,
        created_at: result.timestamp,
        delivered_at: result.status === "sent" ? result.timestamp : null,
      };

      await safetyDb.from("emergency_delivery_log").insert(payload);
    } catch (error) {
      logger.error("[SafetyService] Error saving delivery log:", error);
    }
  }
}
