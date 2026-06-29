/**
 * USE PROFILES - FASE 4
 * Hook para listar todos os perfis do usuário autenticado
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect } from 'react';
import { MultiProfileService } from '../services/multi-profile';
import type { Profile } from '../services/multi-profile/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await MultiProfileService.getMyProfiles();
      setProfiles(data);
    } catch (error: unknown) {
      logger.error('Error loading profiles:', error);
      setError(getErrorMessage(error, 'Failed to load profiles'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    refetch: loadProfiles,
  };
}
