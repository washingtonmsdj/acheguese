/**
 * useAuth — compatibility shim
 *
 * Reads directly from SessionState (SSOT). No onAuthStateChange listener.
 * No local state. Re-renders whenever SessionState notifies.
 *
 * Consumers that only need `user` (id, email) continue to work unchanged.
 * New code should use useSessionContext() instead.
 */
import { useState, useEffect, useCallback } from "react";
import { SessionService } from "@/core/session/services/SessionService";
import { SessionState } from "@/core/session/state/SessionState";
import { AuthService } from "@/core/auth/services";
import type {
  AuthUser,
  SignUpData,
  SignInData,
  SignInWithUsernameData,
  AuthError,
} from "@/core/auth/services/types";

interface UseAuthReturn {
  user: (AuthUser & { user_metadata?: Record<string, unknown> }) | null;
  loading: boolean;
  error: AuthError | null;
  googleAuthAvailable: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signInWithUsername: (data: SignInWithUsernameData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetPasswordByIdentifier: (identifier: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  // Derive user from SessionState — no independent listener
  const [sessionData, setSessionData] = useState(() => SessionState.getState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Subscribe to SessionState changes only — session observer is managed by SessionService
    const unsubscribe = SessionState.subscribe(() => {
      setSessionData(SessionState.getState());
    });
    return unsubscribe;
  }, []);

  // Map SessionState.user → AuthUser shape (with user_metadata for legacy consumers)
  const user = sessionData.user
    ? {
        id: sessionData.user.id,
        email: sessionData.user.email,
        emailConfirmed: sessionData.user.emailConfirmed,
        // Provide user_metadata from activeProfile for legacy consumers that read
        // user.user_metadata.city / neighborhood
        user_metadata: {
          city: sessionData.activeProfile?.city ?? "",
          neighborhood: sessionData.activeProfile?.neighborhood ?? "",
        },
      }
    : null;

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signUp(data);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (data: SignInData) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signIn(data);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signOut();
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.resetPassword(email);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithUsername = useCallback(async (data: SignInWithUsernameData) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signInWithUsername(data);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signInWithGoogle();
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPasswordByIdentifier = useCallback(async (identifier: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.resetPasswordByIdentifier(identifier);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.resendConfirmationEmail(email);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.updatePassword(newPassword);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      // SessionService.refreshSession() will update SessionState,
      // which will trigger our subscriber above.
      await SessionService.refreshSession();
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    googleAuthAvailable: AuthService.isGoogleAuthEnabled(),
    signUp,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    signOut,
    resetPassword,
    resetPasswordByIdentifier,
    resendConfirmationEmail,
    updatePassword,
    refreshUser,
  };
}
