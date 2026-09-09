import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
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

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => QueryBuilder<TRow>;
}

interface SafetyDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
  rpc: <TRow = never>(
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<QueryResult<TRow>>;
}

const safetyDb = supabase as unknown as SafetyDbClient;

function buildEmergencyContactPatch(
  updates: UpdateEmergencyContactInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.relationship !== undefined) patch.relationship = updates.relationship;
  if (updates.isPrimary !== undefined) patch.is_primary = updates.isPrimary;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;

  return patch;
}

function mapToEmergencyContact(data: EmergencyContactRow): EmergencyContact {
  return {
    id: data.id,
    profileId: data.profile_id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? undefined,
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
      const { data, error } = await safetyDb.rpc<EmergencyContactRow>(
        "create_emergency_contact",
        {
          p_profile_id: input.profileId,
          p_name: input.name,
          p_email: input.email,
          p_phone: input.phone ?? null,
          p_relationship: input.relationship ?? null,
          p_is_primary: input.isPrimary ?? false,
        },
      );

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
      const patch = buildEmergencyContactPatch(updates);
      const { data, error } = await safetyDb.rpc<EmergencyContactRow>(
        "patch_emergency_contact",
        {
          p_contact_id: contactId,
          p_updates: patch,
        },
      );

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
      const { error } = await safetyDb.rpc<EmergencyContactRow>(
        "patch_emergency_contact",
        {
          p_contact_id: contactId,
          p_updates: { is_active: false },
        },
      );

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

      const deliveryResults = await Promise.allSettled(
        contacts.map(async (contact) => {
          const result = await emailNotificationProvider.sendEmergencyAlert(
            contact,
            alert,
          );
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

}
