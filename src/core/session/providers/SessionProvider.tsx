import { logger } from '@/shared/utils/logger';
import React, { useState, useEffect } from "react";
import { SessionState } from "../state/SessionState";
import { SessionService } from "../services/SessionService";
import { SessionReactContext } from "./SessionReactContext";
import type { SessionContext } from "../types";

const AUTH_INIT_TIMEOUT_MS = 7000;
/**
 * SessionProvider - React provider that reads from SessionState (SSOT).
 *
 * On mount:
 *  1. Calls SessionService.initialize() to set up onAuthStateChange.
 *  2. Subscribes to SessionState changes so the provider re-renders on updates.
 *  3. Calls SessionService.initializeSession() to load the initial session.
 *
 * Exposes async handlers (switchProfile, refreshSession) that manage
 * isLoading and error state.
 *
 * Does NOT export useSessionContext — that lives in hooks/useSessionContext.ts.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionData, setSessionData] = useState(() => SessionState.getState());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscreve ANTES de inicializar para não perder nenhum evento
    const unsubscribe = SessionState.subscribe(() => {
      setSessionData(SessionState.getState());
    });

    // Registra onAuthStateChange — isso dispara INITIAL_SESSION/SIGNED_IN automaticamente
    // O SessionService atualiza o SessionState via subscribe acima
    SessionService.initialize();

    // Aguarda o primeiro evento de auth para liberar o isLoading.
    // Em dev, o Supabase pode levar alguns segundos para recuperar um lock
    // de sessao; abaixo disso a UI gera falso positivo de timeout.
    const timeout = setTimeout(() => {
      logger.warn("⚠️ SessionProvider: auth init timeout — liberando UI");
      setIsLoading(false);
    }, AUTH_INIT_TIMEOUT_MS);

    SessionService.initializeSession().then(() => {
      clearTimeout(timeout);
      setSessionData(SessionState.getState());
      setIsLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
      // Cleanup do auth listener para evitar memory leaks
      SessionService.cleanup();
    };
  }, []);

  // 6.6 / 6.7 switchProfile handler with isLoading + error management
  const switchProfile = async (profileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await SessionService.switchProfile(profileId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 6.6 / 6.7 refreshSession handler with isLoading + error management
  const refreshSession = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await SessionService.refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const value: SessionContext = {
    user: sessionData.user,
    activeProfile: sessionData.activeProfile,
    profiles: sessionData.profiles,
    isLoading,
    error,
    switchProfile,
    refreshSession,
  };

  return (
    <SessionReactContext.Provider value={value}>
      {children}
    </SessionReactContext.Provider>
  );
}
