/**
 * ============================================
 * [NOME] HOOK (SSOT)
 * ============================================
 * Hook único para gerenciar [domínio] em todo o app
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/core/auth';
import { supabase } from '@/lib/supabase';
import { [nome]Service } from '../services/[nome].service';
import { logger } from '@/lib/logger';
import type {
  [Nome],
  [Nome]Filters,
} from '../types/[nome].types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Use[Nome]Options {
  filters?: [Nome]Filters;
  enableRealtime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function use[Nome](options: Use[Nome]Options = {}) {
  const {
    filters = {},
    enableRealtime = false,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const { user } = useAuth();
  const [items, setItems] = useState<[Nome][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef(filters);

  // Atualizar ref quando filters mudar
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // ============================================
  // FETCH ITEMS
  // ============================================

  const fetchItems = useCallback(async (silent = false) => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await [nome]Service.fetch[Itens](user.id, filtersRef.current);
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar [itens]';
      setError(message);
      logger.error('Erro ao buscar [itens]:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ============================================
  // REALTIME SUBSCRIPTION (se necessário)
  // ============================================

  useEffect(() => {
    if (!user?.id || !enableRealtime) return;

    const channel = supabase
      .channel(`[tabela]:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: '[tabela]',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('[Nome] realtime event:', payload);
          fetchItems(true);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, enableRealtime, fetchItems]);

  // ============================================
  // AUTO REFRESH (se necessário)
  // ============================================

  useEffect(() => {
    if (!autoRefresh || !user?.id) return;

    refreshTimerRef.current = setInterval(() => {
      fetchItems(true);
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchItems, user?.id]);

  // ============================================
  // INITIAL FETCH
  // ============================================

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    items,
    
    // State
    loading,
    error,
    
    // Actions
    refresh: () => fetchItems(false),
  };
}
