import { useState, useEffect, useCallback, useRef } from "react";
import { useSessionContext } from "@/core/session";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessOwnershipService } from "@/core/business/services/BusinessOwnershipService";
import type { AccessPermissions } from "@/shared/types/dashboard";
import { logger } from "@/shared/utils/logger";

const NO_ACCESS: AccessPermissions = {
  isMember: false,
  isAdmin: false,
  hasAccess: false,
};

interface AccessSnapshot {
  userId: string | null;
  profileId: string | null;
  permissions: AccessPermissions;
  loading: boolean;
  error: string | null;
}

export function useDashboardAccess(profileId: string | undefined) {
  const { user, isLoading: sessionLoading } = useSessionContext();
  const currentUserId = user?.id ?? null;
  const currentProfileId = profileId ?? null;
  const requestSequenceRef = useRef(0);
  const [snapshot, setSnapshot] = useState<AccessSnapshot>({
    userId: null,
    profileId: null,
    permissions: NO_ACCESS,
    loading: true,
    error: null,
  });

  const checkAccess = useCallback(async () => {
    const requestId = ++requestSequenceRef.current;
    const checkedUserId = currentUserId;
    const checkedProfileId = currentProfileId;

    // Invalidate the previous grant before starting an asynchronous check.
    setSnapshot({
      userId: checkedUserId,
      profileId: checkedProfileId,
      permissions: NO_ACCESS,
      loading: true,
      error: null,
    });

    if (sessionLoading || !checkedUserId || !checkedProfileId) {
      if (requestSequenceRef.current === requestId) {
        setSnapshot({
          userId: checkedUserId,
          profileId: checkedProfileId,
          permissions: NO_ACCESS,
          loading: sessionLoading,
          error: null,
        });
      }
      return;
    }

    try {
      const businessDataId =
        await BusinessService.getBusinessDataIdByProfileId(checkedProfileId);
      if (requestSequenceRef.current !== requestId) return;

      const role = businessDataId
        ? await BusinessOwnershipService.resolveManagementRole(
            businessDataId,
            checkedUserId,
          )
        : null;
      if (requestSequenceRef.current !== requestId) return;

      const hasAccess = role !== null;
      setSnapshot({
        userId: checkedUserId,
        profileId: checkedProfileId,
        permissions: {
          isMember: hasAccess,
          isAdmin: hasAccess,
          hasAccess,
          role: role ?? undefined,
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      if (requestSequenceRef.current !== requestId) return;
      logger.error("Error checking access:", err);
      setSnapshot({
        userId: checkedUserId,
        profileId: checkedProfileId,
        permissions: NO_ACCESS,
        loading: false,
        error:
          err instanceof Error ? err.message : "Erro ao verificar permissoes",
      });
    }
  }, [currentProfileId, currentUserId, sessionLoading]);

  useEffect(() => {
    void checkAccess();
    return () => {
      // A previous user, profile or component lifecycle cannot publish a grant.
      ++requestSequenceRef.current;
    };
  }, [checkAccess]);

  // A changed session/profile immediately masks an earlier grant, even before
  // the cleanup effect has had an opportunity to run.
  const snapshotIsCurrent =
    !sessionLoading &&
    snapshot.userId === currentUserId &&
    snapshot.profileId === currentProfileId;

  return {
    permissions: snapshotIsCurrent ? snapshot.permissions : NO_ACCESS,
    loading: !snapshotIsCurrent || snapshot.loading,
    checkedProfileId: snapshotIsCurrent ? snapshot.profileId : null,
    error: snapshotIsCurrent ? snapshot.error : null,
    refetch: checkAccess,
  };
}
