import { useState, useEffect, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessOwnershipService } from "@/core/business/services/BusinessOwnershipService";
import type { AccessPermissions } from "@/shared/types/dashboard";
import { logger } from "@/shared/utils/logger";

export function useDashboardAccess(profileId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSessionContext();
  const [permissions, setPermissions] = useState<AccessPermissions>({
    isMember: false,
    isAdmin: false,
    hasAccess: false,
  });
  const [loading, setLoading] = useState(true);
  const [checkedProfileId, setCheckedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (sessionLoading) {
      setLoading(true);
      setCheckedProfileId(null);
      return;
    }

    if (!user || !profileId) {
      setCheckedProfileId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setCheckedProfileId(null);
    setError(null);

    try {
      const businessDataId = await BusinessService.getBusinessDataIdByProfileId(profileId);
      if (!businessDataId) {
        setPermissions({
          isMember: false,
          isAdmin: false,
          hasAccess: false,
        });
        setCheckedProfileId(profileId);
        return;
      }

      const hasAccess = await BusinessOwnershipService.isOwner(businessDataId, user.id);

      setPermissions({
        isMember: hasAccess,
        isAdmin: hasAccess,
        hasAccess,
        role: hasAccess ? "owner" : undefined,
      });
      setCheckedProfileId(profileId);
    } catch (err: unknown) {
      logger.error("Error checking access:", err);
      setError(err instanceof Error ? err.message : "Erro ao verificar permissoes");
      setPermissions({
        isMember: false,
        isAdmin: false,
        hasAccess: false,
      });
      setCheckedProfileId(profileId);
    } finally {
      setLoading(false);
    }
  }, [sessionLoading, user, profileId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    permissions,
    loading,
    checkedProfileId,
    error,
    refetch: checkAccess,
  };
}
