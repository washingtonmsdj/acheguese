/**
 * useAuth — SSOT hook
 *
 * Reads directly from SessionState (SSOT). No onAuthStateChange listener.
 * No local state. Re-renders whenever SessionState notifies.
 *
 * Consumers that only need `user` (id, email) continue to work unchanged.
 */
import { useState, useEffect, useCallback } from "react";
import { SessionService } from "@/core/session/services/SessionService";
import { SessionState } from "@/core/session/state/SessionState";
import { AuthService } from "@/core/auth/services/AuthService";
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
  signOutOtherSessions: () => Promise<void>;
  resetPassword: (email: string, captchaToken?: string) => Promise<void>;
  resetPasswordByIdentifier: (
    identifier: string,
    captchaToken?: string,
  ) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  requestPasswordReauthentication: () => Promise<void>;
  updatePassword: (newPassword: string, nonce?: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  // Derive user from SessionState - no independent listener
  const [sessionData, setSessionData] = useState(() => SessionState.getState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Subscribe to SessionState changes only - session observer is managed by SessionService
    const unsubscribe = SessionState.subscribe(() => {
      setSessionData(SessionState.getState());
    });
    return unsubscribe;
  }, []);

  // Map SessionState.user to AuthUser shape for consumers that read user_metadata.
  const user = sessionData.user
    ? {
        id: sessionData.user.id,
        email: sessionData.user.email,
        emailConfirmed: sessionData.user.emailConfirmed,
        // Provide user_metadata from activeProfile for consumers that read
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

  const signOutOtherSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.signOutOtherSessions();
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, captchaToken?: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.resetPassword(email, captchaToken);
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

  const resetPasswordByIdentifier = useCallback(
    async (identifier: string, captchaToken?: string) => {
      try {
        setLoading(true);
        setError(null);
        await AuthService.resetPasswordByIdentifier(identifier, captchaToken);
      } catch (err) {
        setError(err as AuthError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

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

  const requestPasswordReauthentication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.requestPasswordReauthentication();
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string, nonce?: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.updatePassword(newPassword, nonce);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmail = useCallback(async (newEmail: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.updateEmail(newEmail);
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
    signOutOtherSessions,
    resetPassword,
    resetPasswordByIdentifier,
    resendConfirmationEmail,
    requestPasswordReauthentication,
    updatePassword,
    updateEmail,
    refreshUser,
  };
}
