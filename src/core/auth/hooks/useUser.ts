/**
 * useUser — SSOT hook
 *
 * Reads from SessionState (SSOT). No onAuthStateChange listener.
 */
import { useState, useEffect } from "react";
import { SessionState } from "@/core/session/state/SessionState";
import type { AuthUser, AuthError } from "@/core/auth/services/types";

interface UseUserReturn {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
}

export function useUser(): UseUserReturn {
  const [sessionData, setSessionData] = useState(() => SessionState.getState());

  useEffect(() => {
    const unsubscribe = SessionState.subscribe(() => {
      setSessionData(SessionState.getState());
    });
    return unsubscribe;
  }, []);

  const user = sessionData.user
    ? {
        id: sessionData.user.id,
        email: sessionData.user.email,
        emailConfirmed: sessionData.user.emailConfirmed,
      }
    : null;

  return { user, loading: false, error: null };
}
