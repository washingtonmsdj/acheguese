/**
 * useSession — compatibility shim
 *
 * Reads from SessionState (SSOT). No onAuthStateChange listener.
 * New code should use useSessionContext() instead.
 */
import { useState, useEffect } from "react";
import { SessionState } from "@/core/session/state/SessionState";
import { SessionService } from "@/core/session/services/SessionService";

interface UseSessionReturn {
  session: { user: { id: string; email: string } } | null;
  loading: boolean;
  isExpired: boolean;
  expiresAt: Date | null;
  refreshSession: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessionData, setSessionData] = useState(() => SessionState.getState());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = SessionState.subscribe(() => {
      setSessionData(SessionState.getState());
    });
    return unsubscribe;
  }, []);

  const session = sessionData.user
    ? { user: { id: sessionData.user.id, email: sessionData.user.email } }
    : null;

  const refreshSession = async () => {
    try {
      setLoading(true);
      await SessionService.refreshSession();
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    isExpired: false,
    expiresAt: null,
    refreshSession,
  };
}
