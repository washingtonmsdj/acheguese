import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/core/session";
import { checkAdminRole } from "@/core/landing/services/LandingService";

export function useBrasilShowcaseAdminAccess() {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading } = useSessionContext();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;

    if (!user) {
      navigate("/");
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const isAdmin = await checkAdminRole(user.id);
        if (cancelled) return;

        if (isAdmin) {
          setIsAuthorized(true);
          return;
        }

        navigate("/");
      } catch {
        if (!cancelled) navigate("/");
      }
    };

    void checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [user, sessionLoading, navigate]);

  return { sessionLoading, isAuthorized };
}
