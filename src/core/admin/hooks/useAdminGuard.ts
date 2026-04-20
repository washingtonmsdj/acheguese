import { useEffect, useState } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";

export function useAdminGuard() {
  const { activeProfile, isLoading: sessionLoading } = useSessionContext();
  const [canModerate, setCanModerate] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!activeProfile) {
      setCanModerate(false);
      return;
    }
    AuthorizationEngine.canProfilePerformAction(
      activeProfile.id,
      "moderateContent",
      {},
    ).then(setCanModerate);
  }, [activeProfile, sessionLoading]);

  return {
    canModerate,
    isChecking: canModerate === null,
  };
}
