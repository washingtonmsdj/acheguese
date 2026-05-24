import { useEffect, useState } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization/services/AuthorizationEngine";
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
        const [postAllowed, commentAllowed] = await Promise.all([
          AuthorizationEngine.canProfilePerformAction(activeProfile.id, "createPost", {}),
          AuthorizationEngine.canProfilePerformAction(activeProfile.id, "createComment", {}),
        ]);
        setCanPost(postAllowed);
        setCanComment(commentAllowed);
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
