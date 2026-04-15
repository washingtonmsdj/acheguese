import { useState, useEffect, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";
import type { AccessPermissions } from "@/modules/dashboard/types/dashboard";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services";

export function useDashboardAccess(profileId: string | undefined) {
  const { user, activeProfile } = useSessionContext();
  const [permissions, setPermissions] = useState<AccessPermissions>({
    isMember: false,
    isAdmin: false,
    hasAccess: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!user || !profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const members = await profileService.getProfileMembers(profileId);
      const memberData = members?.find((member) => member.user_id === user.id);
      const isMember = Boolean(memberData);

      const isAdmin = activeProfile
        ? await AuthorizationEngine.canProfilePerformAction(
            activeProfile.id,
            "moderateContent",
            {},
          )
        : false;

      setPermissions({
        isMember,
        isAdmin,
        hasAccess: isMember || isAdmin,
        role: memberData?.role,
      });
    } catch (err: unknown) {
      logger.error("Error checking access:", err);
      setError(err instanceof Error ? err.message : "Erro ao verificar permissoes");
      setPermissions({
        isMember: false,
        isAdmin: false,
        hasAccess: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user, activeProfile, profileId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    permissions,
    loading,
    error,
    refetch: checkAccess,
  };
}
