/**
 * USE PROFILES - FASE 4
 * Hook para listar todos os perfis do usuário autenticado
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

import { useState, useEffect } from 'react';
import { MultiProfileService } from '../services/multi-profile';
import type { Profile } from '../services/multi-profile/types';

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
    } catch (err: any) {
      console.error('Error loading profiles:', err);
      setError(err.message || 'Failed to load profiles');
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
