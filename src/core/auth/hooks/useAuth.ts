/**
 * useAuth — SSOT hook
 *
 * Reads the authenticated user directly from SessionState (SSOT). It never
 * creates a second auth-state listener or a parallel session owner. Local state
 * here is limited to action feedback (`loading` / `error`).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { SessionService } from "@/core/session/services/SessionService";
import { SessionState } from "@/core/session/state/SessionState";
import { AuthBackendAvailability } from "@/core/auth/services/AuthBackendAvailability";
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
  resendConfirmationEmail: (
    email: string,
    captchaToken?: string,
  ) => Promise<void>;
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
  const mountedRef = useRef(true);
  const activeOperationsRef = useRef(0);
  const latestOperationIdRef = useRef(0);
  const signOutOthersInFlightRef = useRef<Promise<void> | null>(null);
  const passwordReauthInFlightRef = useRef<Promise<void> | null>(null);
  const emailUpdateInFlightRef = useRef<{
    email: string;
    promise: Promise<void>;
  } | null>(null);

  const beginAuthOperation = useCallback((): number => {
    const operationId = latestOperationIdRef.current + 1;
    latestOperationIdRef.current = operationId;
    activeOperationsRef.current += 1;

    if (mountedRef.current) {
      if (activeOperationsRef.current === 1) setLoading(true);
      setError(null);
    }

    return operationId;
  }, []);

  const endAuthOperation = useCallback(() => {
    activeOperationsRef.current = Math.max(0, activeOperationsRef.current - 1);
    if (mountedRef.current && activeOperationsRef.current === 0) {
      setLoading(false);
    }
  }, []);

  const publishAuthError = useCallback((operationId: number, err: unknown) => {
    if (
      mountedRef.current &&
      operationId === latestOperationIdRef.current
    ) {
      setError(err as AuthError);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Subscribe to SessionState changes only - session observer is managed by SessionService
    const unsubscribe = SessionState.subscribe(() => {
      if (mountedRef.current) setSessionData(SessionState.getState());
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
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
    const operationId = beginAuthOperation();
    try {
      await AuthService.signUp(data);
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const signIn = useCallback(async (data: SignInData) => {
    const operationId = beginAuthOperation();
    try {
      await AuthService.signIn(data);
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const signOut = useCallback(async () => {
    const operationId = beginAuthOperation();
    try {
      await AuthService.signOut();
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const signOutOtherSessions = useCallback(async () => {
    const activeRevocation = signOutOthersInFlightRef.current;
    if (activeRevocation) return activeRevocation;

    const operation = (async () => {
      const operationId = beginAuthOperation();
      try {
        await AuthService.signOutOtherSessions();
      } catch (err) {
        publishAuthError(operationId, err);
        throw err;
      } finally {
        endAuthOperation();
      }
    })();

    signOutOthersInFlightRef.current = operation;
    try {
      await operation;
    } finally {
      if (signOutOthersInFlightRef.current === operation) {
        signOutOthersInFlightRef.current = null;
      }
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const resetPassword = useCallback(async (email: string, captchaToken?: string) => {
    const operationId = beginAuthOperation();
    try {
      await AuthService.resetPassword(email, captchaToken);
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const signInWithUsername = useCallback(async (data: SignInWithUsernameData) => {
    const operationId = beginAuthOperation();
    try {
      await AuthService.signInWithUsername(data);
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const signInWithGoogle = useCallback(async () => {
    const operationId = beginAuthOperation();
    try {
      await AuthBackendAvailability.assertReadyForExternalOAuth();
      await AuthService.signInWithGoogle();
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const resetPasswordByIdentifier = useCallback(
    async (identifier: string, captchaToken?: string) => {
      const operationId = beginAuthOperation();
      try {
        await AuthService.resetPasswordByIdentifier(identifier, captchaToken);
      } catch (err) {
        publishAuthError(operationId, err);
        throw err;
      } finally {
        endAuthOperation();
      }
    },
    [beginAuthOperation, endAuthOperation, publishAuthError],
  );

  const resendConfirmationEmail = useCallback(
    async (email: string, captchaToken?: string) => {
      const operationId = beginAuthOperation();
      try {
        await AuthService.resendConfirmationEmail(email, captchaToken);
      } catch (err) {
        publishAuthError(operationId, err);
        throw err;
      } finally {
        endAuthOperation();
      }
    },
    [beginAuthOperation, endAuthOperation, publishAuthError],
  );

  const requestPasswordReauthentication = useCallback(async () => {
    const activeRequest = passwordReauthInFlightRef.current;
    if (activeRequest) return activeRequest;

    const operation = (async () => {
      const operationId = beginAuthOperation();
      try {
        await AuthService.requestPasswordReauthentication();
      } catch (err) {
        publishAuthError(operationId, err);
        throw err;
      } finally {
        endAuthOperation();
      }
    })();

    passwordReauthInFlightRef.current = operation;
    try {
      await operation;
    } finally {
      if (passwordReauthInFlightRef.current === operation) {
        passwordReauthInFlightRef.current = null;
      }
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const updatePassword = useCallback(async (newPassword: string, nonce?: string) => {
    const operationId = beginAuthOperation();
    try {
      await AuthService.updatePassword(newPassword, nonce);
    } catch (err) {
      publishAuthError(operationId, err);
      throw err;
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const updateEmail = useCallback(async (newEmail: string) => {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const activeUpdate = emailUpdateInFlightRef.current;
    if (activeUpdate) {
      if (activeUpdate.email === normalizedEmail) {
        return activeUpdate.promise;
      }
      throw new Error("Já existe uma alteração de e-mail em andamento.");
    }

    const operation = (async () => {
      const operationId = beginAuthOperation();
      try {
        await AuthService.updateEmail(newEmail);
      } catch (err) {
        publishAuthError(operationId, err);
        throw err;
      } finally {
        endAuthOperation();
      }
    })();

    emailUpdateInFlightRef.current = {
      email: normalizedEmail,
      promise: operation,
    };

    try {
      await operation;
    } finally {
      if (emailUpdateInFlightRef.current?.promise === operation) {
        emailUpdateInFlightRef.current = null;
      }
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

  const refreshUser = useCallback(async () => {
    const operationId = beginAuthOperation();
    try {
      // SessionService.refreshSession() will update SessionState,
      // which will trigger our subscriber above.
      await SessionService.refreshSession();
    } catch (err) {
      publishAuthError(operationId, err);
    } finally {
      endAuthOperation();
    }
  }, [beginAuthOperation, endAuthOperation, publishAuthError]);

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
