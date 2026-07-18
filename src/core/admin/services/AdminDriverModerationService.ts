import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { DriverModerationEventsService } from "@/core/mobility/services/runtime";

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

    try {
      const [decisions, profileRows] = await Promise.all([
        DriverModerationEventsService.listLatestDecisionsByDriverProfiles(profileIds),
        profileService.getAccessibleProfilesByIds(profileIds) as Promise<DriverModerationRow[]>,
      ]);
      const profileById = new Map(profileRows.map((row) => [row.id, row]));
      return new Map(
        profileIds.map((profileId) => {
          const decision = decisions.get(profileId);
          const profile = profileById.get(profileId);
          const row: DriverModerationRow = {
            id: profileId,
            verification_status: decision
              ? decision.action === "approved"
                ? "verified"
                : "rejected"
              : "pending",
            verification_rejection_reason:
              decision?.action === "rejected" ? decision.reason : null,
            is_suspended: profile?.is_suspended ?? false,
            suspended_at: profile?.suspended_at ?? null,
            suspended_until: profile?.suspended_until ?? null,
            suspension_reason: profile?.suspension_reason ?? null,
            updated_at: decision?.created_at ?? profile?.updated_at,
          };
          return [profileId, row];
        }),
      );
    } catch (error) {
      logger.warn("AdminDriverModerationService.getModerationRows", error);
      return new Map<string, DriverModerationRow>();
    }
  }

  static async getFallbackSuspensionHistory(
    driverProfileId: string,
  ): Promise<SuspensionHistoryEntry[]> {
    type FallbackProfileRow = {
      id?: string;
      is_suspended?: boolean | null;
      suspended_at?: string | null;
      suspended_until?: string | null;
      suspension_reason?: string | null;
      updated_at?: string | null;
    };
    let data: FallbackProfileRow | null = null;
    try {
      data = (await profileService.getAccessibleProfileById(driverProfileId)) as FallbackProfileRow | null;
    } catch (error) {
      logger.warn("AdminDriverModerationService.getFallbackSuspensionHistory", error);
      return [];
    }
    if (!data) {
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
