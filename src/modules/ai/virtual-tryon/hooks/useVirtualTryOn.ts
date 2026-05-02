import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  const refreshHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const list = await tryOnService.listMine(user.id);
    setState((s) => ({ ...s, history: list }));
  }, []);

  useEffect(() => {
    refreshHistory();
    return () => unsubRef.current?.();
  }, [refreshHistory]);

  const startGeneration = useCallback(async (file: File, input: Omit<CreateTryOnInput, 'productImageUrl'>) => {
    setState((s) => ({ ...s, loading: true, error: null, generation: null }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para gerar imagens.');

      const productImageUrl = await tryOnService.uploadProductImage(user.id, file);
      const created = await tryOnService.createPending(user.id, { ...input, productImageUrl });

      // assinar realtime ANTES de enfileirar
      unsubRef.current?.();
      unsubRef.current = tryOnService.subscribeToGeneration(created.id, (g) => {
        setState((s) => ({ ...s, generation: g, loading: g.status === 'processing' || g.status === 'pending' }));
        if (g.status === 'completed' || g.status === 'failed') {
          refreshHistory();
        }
      });

      setState((s) => ({ ...s, generation: created }));
      await tryOnService.enqueueGeneration(created.id);
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erro inesperado' }));
    }
  }, [refreshHistory]);

  const selectImage = useCallback(async (url: string) => {
    if (!state.generation) return;
    await tryOnService.selectImage(state.generation.id, url);
    setState((s) => s.generation ? { ...s, generation: { ...s.generation, selected_url: url } } : s);
  }, [state.generation]);

  const regenerate = useCallback(async () => {
    if (!state.generation) return;
    await tryOnService.enqueueGeneration(state.generation.id);
    setState((s) => ({ ...s, loading: true, error: null }));
  }, [state.generation]);

  return {
    ...state,
    startGeneration,
    selectImage,
    regenerate,
    refreshHistory,
  };
}
