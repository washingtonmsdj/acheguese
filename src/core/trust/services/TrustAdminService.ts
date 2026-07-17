import { supabase, type Database } from "@/integrations/supabase";
import type {
  TrustAdminAction,
  TrustAdminActionType,
  TrustContextType,
  TrustEvent,
  TrustEventStatus,
} from "../domain";

type TrustEventRow = Database["public"]["Tables"]["trust_events"]["Row"];
type TrustAdminActionRow =
  Database["public"]["Tables"]["trust_admin_actions"]["Row"];

export interface TrustAdminCursor {
  createdAt: string;
  id: string;
}

export interface ApplyTrustAdminActionCommand {
  eventIds: string[];
  actionType: TrustAdminActionType;
  reason: string;
  notes?: string | null;
  durationDays?: number | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapTrustEvent(row: TrustEventRow): TrustEvent {
  return {
    ...row,
    evidence: asRecord(row.evidence),
  };
}

function mapTrustAdminAction(row: TrustAdminActionRow): TrustAdminAction {
  return {
    ...row,
    action_type: row.action_type as TrustAdminActionType,
    metadata: asRecord(row.metadata),
  };
}

export class TrustAdminService {
  static async listEvents(
    input: {
      limit?: number;
      cursor?: TrustAdminCursor | null;
      contextType?: TrustContextType | null;
      status?: TrustEventStatus | null;
    } = {},
  ): Promise<TrustEvent[]> {
    const { data, error } = await supabase.rpc("list_trust_events_admin", {
      p_limit: input.limit ?? 50,
      p_before_created_at: input.cursor?.createdAt ?? null,
      p_before_id: input.cursor?.id ?? null,
      p_context_type: input.contextType ?? null,
      p_status: input.status ?? null,
    });

    if (error) throw error;
    return (data ?? []).map(mapTrustEvent);
  }

  static async reviewEvents(input: {
    eventIds: string[];
    status: TrustEventStatus;
    resolutionNotes?: string | null;
  }): Promise<number> {
    const { data, error } = await supabase.rpc("review_trust_events_admin", {
      p_event_ids: input.eventIds,
      p_status: input.status,
      p_resolution_notes: input.resolutionNotes?.trim() || null,
    });

    if (error) throw error;
    return data;
  }

  static async applyAction(
    input: ApplyTrustAdminActionCommand,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("apply_trust_admin_actions", {
      p_event_ids: input.eventIds,
      p_action_type: input.actionType,
      p_reason: input.reason.trim(),
      p_notes: input.notes?.trim() || null,
      p_duration_days: input.durationDays ?? null,
    });

    if (error) throw error;
    return data;
  }

  static async listActions(
    input: {
      limit?: number;
      cursor?: TrustAdminCursor | null;
    } = {},
  ): Promise<TrustAdminAction[]> {
    const { data, error } = await supabase.rpc(
      "list_trust_admin_actions_admin",
      {
        p_limit: input.limit ?? 50,
        p_before_created_at: input.cursor?.createdAt ?? null,
        p_before_id: input.cursor?.id ?? null,
      },
    );

    if (error) throw error;
    return (data ?? []).map(mapTrustAdminAction);
  }
}
