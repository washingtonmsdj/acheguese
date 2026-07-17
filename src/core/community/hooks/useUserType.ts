import { useEffect, useState } from "react";
import { useSessionContext } from "@/core/session";
import { CapabilityPreviewService } from "@/core/authorization/services/CapabilityPreviewService";
import { logger } from "@/shared/utils/logger";

export function useUserType() {
  const { user, activeProfile, isLoading: sessionLoading } = useSessionContext();
  const [canPost, setCanPost] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!user || !activeProfile) {
        setCanPost(false);
        setCanComment(false);
        setLoading(false);
        return;
      }

      try {
        const previews = await CapabilityPreviewService.previewActions(
          activeProfile.id,
          ["createPost", "createComment"],
        );
        setCanPost(previews[0]?.status === "allowed");
        setCanComment(previews[1]?.status === "allowed");
      } catch (err) {
        logger.error("Error in useUserType:", err);
        setCanPost(false);
        setCanComment(false);
      } finally {
        setLoading(false);
      }
    }

    if (!sessionLoading) {
      loadPermissions();
    }
  }, [user, activeProfile, sessionLoading]);

  return {
    canPost,
    canComment,
    isBusiness: activeProfile?.profileType === "business",
    loading: sessionLoading || loading,
  };
}
