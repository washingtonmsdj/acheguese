import { supabase } from "@/integrations/supabase";
import {
  insertLooseRow,
  selectLooseRows,
  updateLooseRows,
} from "@/integrations/supabase/services/supabaseHelpers";
import { SessionService } from "@/core/session/services/SessionService";
import type {
  ChannelStatus,
  CommunicationAuditEntry,
  CommunicationChannel,
  CommunicationChannelTerritory,
  CommunicationChannelRequest,
} from "../types";
import { CommunicationTerritorialService } from "./CommunicationTerritorialService";

type RpcResult<T> = { data: T | null; error: { message?: string } | null };

function dbError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message?: unknown }).message ?? fallback));
  }
  return new Error(fallback);
}

async function callLooseRpc<T>(functionName: string, params?: Record<string, unknown>): Promise<T> {
  const result = (await supabase.rpc(
    functionName as never,
    (params ?? {}) as never,
  )) as unknown as RpcResult<T>;

  if (result.error) throw dbError(result.error, `RPC ${functionName} failed`);
  if (result.data === null) throw new Error(`RPC ${functionName} returned no data`);
  return result.data;
}

async function selectRows<TRow>(
  tableName: string,
  options: Parameters<typeof selectLooseRows<Record<string, unknown>>>[1] = {},
): Promise<TRow[]> {
  const { data, error } = await selectLooseRows<Record<string, unknown>>(tableName, options);
  if (error) throw dbError(error, `Query ${tableName} failed`);
  return (data ?? []) as TRow[];
}

export class AdminCommunicationTerritorialService {
  private static async appendAudit(input: {
    channel_id?: string | null;
    request_id?: string | null;
    action_type: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const actor = await SessionService.getCurrentUser();
    const { error } = await insertLooseRow("communication_channel_audit", {
      channel_id: input.channel_id ?? null,
      request_id: input.request_id ?? null,
      actor_user_id: actor?.id ?? null,
      action_type: input.action_type,
      metadata: input.metadata ?? {},
    });
    if (error) throw dbError(error, "Could not write communication audit entry");
  }

  static async listRequests(
    status: "pending" | "approved" | "rejected" | "cancelled" = "pending",
  ): Promise<CommunicationChannelRequest[]> {
    return selectRows<CommunicationChannelRequest>("communication_channel_requests", {
      filters: [{ op: "eq", column: "status", value: status }],
      orderBy: { column: "created_at", ascending: false },
      limit: 100,
    });
  }

  static async approveRequest(
    requestId: string,
    payload: { slug?: string; legal_name?: string; admin_notes?: string } = {},
  ): Promise<{ channel_id: string; profile_id: string; slug: string }> {
    return callLooseRpc("admin_approve_communication_channel", {
      request_id: requestId,
      payload,
    });
  }

  static async rejectRequest(requestId: string, adminNotes: string): Promise<{ status: string }> {
    return callLooseRpc("admin_reject_communication_channel_request", {
      request_id: requestId,
      admin_notes: adminNotes,
    });
  }

  static async listChannels(): Promise<CommunicationChannel[]> {
    return selectRows<CommunicationChannel>("communication_channels", {
      orderBy: { column: "created_at", ascending: false },
      limit: 200,
    });
  }

  static async updateChannelStatus(channelId: string, status: ChannelStatus): Promise<void> {
    const { error } = await updateLooseRows(
      "communication_channels",
      { status, updated_at: new Date().toISOString() },
      [{ column: "id", value: channelId }],
    );
    if (error) throw dbError(error, "Could not update communication channel status");

    await this.appendAudit({
      channel_id: channelId,
      action_type: "channel_status_updated",
      metadata: { status },
    });
  }

  static async listAudit(channelId?: string): Promise<CommunicationAuditEntry[]> {
    return selectRows<CommunicationAuditEntry>("communication_channel_audit", {
      filters: channelId ? [{ op: "eq", column: "channel_id", value: channelId }] : [],
      orderBy: { column: "created_at", ascending: false },
      limit: 100,
    });
  }

  static async listChannelTerritories(channelId: string): Promise<CommunicationChannelTerritory[]> {
    return selectRows<CommunicationChannelTerritory>("communication_channel_territories", {
      filters: [{ op: "eq", column: "channel_id", value: channelId }],
      limit: 200,
    });
  }

  static async addTerritory(input: {
    channelId: string;
    locationId: string;
    territoryRole?: "primary" | "coverage" | "temporary";
    canPublish?: boolean;
    canAlert?: boolean;
    canPush?: boolean;
  }): Promise<void> {
    const now = new Date().toISOString();
    const actor = await SessionService.getCurrentUser();

    const { error } = await insertLooseRow("communication_channel_territories", {
      channel_id: input.channelId,
      location_id: input.locationId,
      territory_role: input.territoryRole ?? "coverage",
      can_publish: input.canPublish ?? true,
      can_alert: input.canAlert ?? false,
      can_push: input.canPush ?? false,
      approved_by_user_id: actor?.id ?? null,
      approved_at: now,
      created_at: now,
      updated_at: now,
    });
    if (error) throw dbError(error, "Could not add communication territory");

    await this.appendAudit({
      channel_id: input.channelId,
      action_type: "territory_added",
      metadata: {
        location_id: input.locationId,
        territory_role: input.territoryRole ?? "coverage",
        can_publish: input.canPublish ?? true,
        can_alert: input.canAlert ?? false,
        can_push: input.canPush ?? false,
      },
    });
  }

  static async updateTerritoryPermissions(input: {
    territoryId: string;
    channelId: string;
    can_publish?: boolean;
    can_alert?: boolean;
    can_push?: boolean;
    territory_role?: "primary" | "coverage" | "temporary";
  }): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof input.can_publish === "boolean") patch.can_publish = input.can_publish;
    if (typeof input.can_alert === "boolean") patch.can_alert = input.can_alert;
    if (typeof input.can_push === "boolean") patch.can_push = input.can_push;
    if (input.territory_role) patch.territory_role = input.territory_role;

    const { error } = await updateLooseRows(
      "communication_channel_territories",
      patch,
      [{ column: "id", value: input.territoryId }],
    );
    if (error) throw dbError(error, "Could not update communication territory permissions");

    await this.appendAudit({
      channel_id: input.channelId,
      action_type: "territory_permissions_updated",
      metadata: {
        territory_id: input.territoryId,
        can_publish: input.can_publish,
        can_alert: input.can_alert,
        can_push: input.can_push,
        territory_role: input.territory_role,
      },
    });
  }

  static listAuthorizedTerritories =
    CommunicationTerritorialService.listAuthorizedTerritories.bind(CommunicationTerritorialService);
}
