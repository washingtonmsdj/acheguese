import { useCallback, useEffect, useRef, useState } from 'react';
import { SessionService } from '@/core/session/services/SessionService';
import { tryOnService } from '../services/tryon.service';
import type { CreateTryOnInput, TryOnGeneration } from '../domain/types';

interface UseVirtualTryOnState {
  generation: TryOnGeneration | null;
  history: TryOnGeneration[];
  loading: boolean;
  error: string | null;
}

export function useVirtualTryOn() {
  const [state, setState] = useState<UseVirtualTryOnState>({
    generation: null,
    history: [],
    loading: false,
    error: null,
  });
  const unsubRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) return;
      const list = await tryOnService.listMine(user.id);
      setState((s) => ({ ...s, history: list }));
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Erro ao carregar histórico do Try-On',
      }));
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
    return () => {
      unsubRef.current?.();
      stopPolling();
    };
  }, [refreshHistory, stopPolling]);

  const startPollingGeneration = useCallback((generationId: string) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const latest = await tryOnService.getById(generationId);
        if (!latest) return;

        setState((s) => ({
          ...s,
          generation: latest,
          loading: latest.status === 'processing' || latest.status === 'pending',
        }));

        if (latest.status === 'completed' || latest.status === 'failed') {
          stopPolling();
          void refreshHistory();
        }
      } catch {
        // Realtime continua sendo o canal primário; polling é fallback silencioso.
      }
    }, 3000);
  }, [refreshHistory, stopPolling]);

  const startGeneration = useCallback(async (file: File, input: Omit<CreateTryOnInput, 'productImageUrl'>) => {
    setState((s) => ({ ...s, loading: true, error: null, generation: null }));
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error('Faça login para gerar imagens.');

      const productImageUrl = await tryOnService.uploadProductImage(user.id, file);
      const created = await tryOnService.createPending(user.id, { ...input, productImageUrl });

      // assinar realtime ANTES de enfileirar
      unsubRef.current?.();
      unsubRef.current = tryOnService.subscribeToGeneration(created.id, (g) => {
        setState((s) => ({ ...s, generation: g, loading: g.status === 'processing' || g.status === 'pending' }));
        if (g.status === 'completed' || g.status === 'failed') {
          stopPolling();
          refreshHistory();
        }
      });

      setState((s) => ({ ...s, generation: created }));
      await tryOnService.enqueueGeneration(created.id);
      startPollingGeneration(created.id);
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erro inesperado' }));
    }
  }, [refreshHistory, startPollingGeneration, stopPolling]);

  const selectImage = useCallback(async (url: string) => {
    if (!state.generation) return;
    try {
      await tryOnService.selectImage(state.generation.id, url);
      setState((s) => s.generation ? { ...s, generation: { ...s.generation, selected_url: url } } : s);
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : 'Erro ao selecionar imagem' }));
    }
  }, [state.generation]);

  const regenerate = useCallback(async () => {
    if (!state.generation) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await tryOnService.enqueueGeneration(state.generation.id);
      startPollingGeneration(state.generation.id);
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erro ao regenerar' }));
    }
  }, [startPollingGeneration, state.generation]);

  return {
    ...state,
    startGeneration,
    selectImage,
    regenerate,
    refreshHistory,
  };
}
