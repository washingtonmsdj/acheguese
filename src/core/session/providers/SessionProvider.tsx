import { logger } from '@/shared/utils/logger';
import React, { useCallback, useEffect, useRef, useState } from "react";
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
 * Exposes async handlers (switchProfile, refreshSession) without creating a
 * second session owner. Busy/error state is scoped to the latest live provider
 * generation while SessionState remains the authenticated-data SSOT.
 *
 * Does NOT export useSessionContext — that lives in hooks/useSessionContext.ts.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionData, setSessionData] = useState(() => SessionState.getState());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const bootstrapLoadingRef = useRef(true);
  const bootstrapVersionRef = useRef(0);
  const nextOperationIdRef = useRef(0);
  const latestOperationIdRef = useRef(0);
  const activeOperationIdsRef = useRef<Set<number>>(new Set());

  const syncLoading = useCallback(() => {
    if (!mountedRef.current) return;
    setIsLoading(
      bootstrapLoadingRef.current || activeOperationIdsRef.current.size > 0,
    );
  }, []);

  const beginOperation = useCallback((): number => {
    const operationId = nextOperationIdRef.current + 1;
    nextOperationIdRef.current = operationId;
    latestOperationIdRef.current = operationId;
    activeOperationIdsRef.current.add(operationId);

    if (mountedRef.current) setError(null);
    syncLoading();
    return operationId;
  }, [syncLoading]);

  const endOperation = useCallback((operationId: number) => {
    activeOperationIdsRef.current.delete(operationId);
    syncLoading();
  }, [syncLoading]);

  const publishOperationError = useCallback((operationId: number, cause: unknown) => {
    if (
      !mountedRef.current ||
      operationId !== latestOperationIdRef.current
    ) {
      return;
    }
    setError(cause instanceof Error ? cause : new Error(String(cause)));
  }, []);

  useEffect(() => {
    const activeOperationIds = activeOperationIdsRef.current;
    mountedRef.current = true;
    bootstrapLoadingRef.current = true;
    const bootstrapVersion = bootstrapVersionRef.current + 1;
    bootstrapVersionRef.current = bootstrapVersion;
    syncLoading();

    // Subscreve ANTES de inicializar para não perder nenhum evento.
    const unsubscribe = SessionState.subscribe(() => {
      if (
        mountedRef.current &&
        bootstrapVersion === bootstrapVersionRef.current
      ) {
        setSessionData(SessionState.getState());
      }
    });

    // Registra onAuthStateChange — isso dispara INITIAL_SESSION/SIGNED_IN automaticamente.
    SessionService.initialize();

    // Aguarda o primeiro evento de auth para liberar apenas o bootstrap. Ações
    // de sessão ainda em andamento continuam mantendo `isLoading=true`.
    const finishBootstrap = () => {
      if (
        !mountedRef.current ||
        bootstrapVersion !== bootstrapVersionRef.current
      ) {
        return;
      }
      bootstrapLoadingRef.current = false;
      syncLoading();
    };

    const timeout = setTimeout(() => {
      if (
        !mountedRef.current ||
        bootstrapVersion !== bootstrapVersionRef.current
      ) {
        return;
      }
      logger.warn(" SessionProvider: auth init timeout — liberando UI");
      finishBootstrap();
    }, AUTH_INIT_TIMEOUT_MS);

    SessionService.initializeSession().then(() => {
      if (
        !mountedRef.current ||
        bootstrapVersion !== bootstrapVersionRef.current
      ) {
        return;
      }
      clearTimeout(timeout);
      setSessionData(SessionState.getState());
      setError(null);
      finishBootstrap();
    }).catch((cause: unknown) => {
      if (
        !mountedRef.current ||
        bootstrapVersion !== bootstrapVersionRef.current
      ) {
        return;
      }
      clearTimeout(timeout);
      // A identidade já pode ter sido publicada antes de a leitura privada de
      // perfis falhar. Mantemos essa identidade, mas expomos o bootstrap
      // degradado em vez de fabricar uma sessão vazia como sucesso.
      setSessionData(SessionState.getState());
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      finishBootstrap();
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
      mountedRef.current = false;
      bootstrapVersionRef.current += 1;
      bootstrapLoadingRef.current = false;
      activeOperationIds.clear();
      // Nao chamamos SessionService.cleanup aqui para evitar teardown/re-init
      // agressivo em React StrictMode (dev), que pode gerar disputa de lock
      // no Supabase auth bootstrap.
    };
  }, [syncLoading]);

  const switchProfile = useCallback(async (profileId: string): Promise<void> => {
    const operationId = beginOperation();
    try {
      await SessionService.switchProfile(profileId);
    } catch (cause) {
      publishOperationError(operationId, cause);
      throw cause instanceof Error ? cause : new Error(String(cause));
    } finally {
      endOperation(operationId);
    }
  }, [beginOperation, endOperation, publishOperationError]);

  const refreshSession = useCallback(async (): Promise<void> => {
    const operationId = beginOperation();
    try {
      await SessionService.refreshSession();
    } catch (cause) {
      publishOperationError(operationId, cause);
    } finally {
      endOperation(operationId);
    }
  }, [beginOperation, endOperation, publishOperationError]);

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
