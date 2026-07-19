import {
  invokeNullableSupabaseBroker,
  invokeSupabaseBroker,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type ContactEntityType = "business" | "professional";
export type ContactChannelType = "phone" | "whatsapp" | "email";
export type ContactVisibility = "private" | "authenticated";

export interface EntityContact {
  phone?: string;
  whatsapp?: string;
  email?: string;
}

interface ContactChannelRow {
  entity_type: ContactEntityType;
  entity_id: string;
  channel_type: ContactChannelType;
  channel_value: string;
  visibility: ContactVisibility;
}

export interface ContactChannelPatch {
  channelType: ContactChannelType;
  value: string | null;
  visibility?: ContactVisibility;
}

const FUNCTION_NAME = "contact-rpc";
const SERVICE_NAME = "EntityContactService";

function toContact(rows: ContactChannelRow[]): EntityContact {
  return rows.reduce<EntityContact>((contact, row) => {
    const value = row.channel_value.trim();
    if (value) contact[row.channel_type] = value;
    return contact;
  }, {});
}

export class EntityContactService {
  static async getVisibleForEntity(
    entityType: ContactEntityType,
    entityId: string,
  ): Promise<EntityContact> {
    const rows = await invokeNullableSupabaseBroker<
      ContactChannelRow[],
      "getVisible"
    >({
      action: "getVisible",
      functionName: FUNCTION_NAME,
      params: entityType === "business"
        ? { businessIds: [entityId] }
        : { professionalIds: [entityId] },
      serviceName: SERVICE_NAME,
    });

    return toContact(rows ?? []);
  }

  static async patchOwnedChannels(
    entityType: ContactEntityType,
    entityId: string,
    channels: ContactChannelPatch[],
  ): Promise<EntityContact> {
    if (channels.length === 0) return this.getVisibleForEntity(entityType, entityId);

    const rows = await invokeSupabaseBroker<ContactChannelRow[], "patchOwned">({
      action: "patchOwned",
      functionName: FUNCTION_NAME,
      params: { entityType, entityId, channels },
      serviceName: SERVICE_NAME,
    });
    return toContact(rows);
  }

  static buildPatch(input: EntityContact): ContactChannelPatch[] {
    return (["phone", "whatsapp", "email"] as const)
      .filter((channelType) => Object.prototype.hasOwnProperty.call(input, channelType))
      .map((channelType) => ({
        channelType,
        value: input[channelType]?.trim() || null,
        visibility: "authenticated" as const,
      }));
  }
}
