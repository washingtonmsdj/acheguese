import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface DriverModerationRow {
  id: string;
  verification_status?: "pending" | "verified" | "rejected" | "none" | null;
  verification_rejection_reason?: string | null;
  is_suspended?: boolean | null;
  suspended_at?: string | null;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  updated_at?: string;
}

export interface SuspensionHistoryEntry {
  id: string;
  action: string;
  reason?: string;
  admin_name: string;
  created_at: string;
}

interface VerificationContext {
  verificationStatus?: "pending" | "verified" | "rejected" | "none" | null;
  fallbackVerified?: boolean;
}

export class AdminDriverModerationService {
  static resolveVerificationStatus(
    context: VerificationContext,
  ): "pending" | "verified" | "rejected" | "none" {
    if (context.verificationStatus) {
      return context.verificationStatus;
    }

    if (context.fallbackVerified) {
      return "verified";
    }

    return "pending";
  }

  static async getModerationRows(profileIds: string[]): Promise<Map<string, DriverModerationRow>> {
    if (profileIds.length === 0) return new Map<string, DriverModerationRow>();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, verification_status, verification_rejection_reason, is_suspended, suspended_at, suspended_until, suspension_reason, updated_at",
      )
      .in("id", profileIds);

    if (error) {
      logger.warn("AdminDriverModerationService.getModerationRows", error);
      return new Map<string, DriverModerationRow>();
    }

    return new Map(((data || []) as DriverModerationRow[]).map((row) => [row.id, row]));
  }

  static async getFallbackSuspensionHistory(
    driverProfileId: string,
  ): Promise<SuspensionHistoryEntry[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, is_suspended, suspended_at, suspended_until, suspension_reason, updated_at")
      .eq("id", driverProfileId)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        logger.warn("AdminDriverModerationService.getFallbackSuspensionHistory", error);
      }
      return [];
    }

    const history: SuspensionHistoryEntry[] = [];

    if (data.suspended_at) {
      history.push({
        id: `${data.id}-suspended`,
        action: "suspended",
        reason: data.suspension_reason || undefined,
        admin_name: "Admin",
        created_at: data.suspended_at,
      });
    }

    if (!data.is_suspended && data.suspended_at) {
      history.push({
        id: `${data.id}-reactivated`,
        action: "reactivated",
        admin_name: "Admin",
        created_at: data.updated_at || data.suspended_until || data.suspended_at,
      });
    }

    return history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

