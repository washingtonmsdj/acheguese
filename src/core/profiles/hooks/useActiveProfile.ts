/**
 * USE ACTIVE PROFILE - FASE 4
 * Hook para gerenciar perfil ativo do usuário
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 * 
 * REGRAS:
 * - Perfil ativo é armazenado em localStorage
 * - Se não houver perfil ativo, usa o primeiro perfil do usuário
 * - Personal profile é preferido como padrão
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '@/core/session/services/SessionService';
import { MultiProfileService } from '../services/multi-profile';
import type { Profile } from '../services/multi-profile/types';
import { ACTIVE_PROFILE_STORAGE_KEY } from '../constants/activeProfileStorage';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useActiveProfile() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const profiles = await MultiProfileService.getMyProfiles();
      setAllProfiles(profiles);

      if (profiles.length === 0) {
        setActiveProfile(null);
        setLoading(false);
        return;
      }

      // Tentar recuperar perfil ativo do localStorage
      const savedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
      let active = profiles.find(p => p.id === savedActiveProfileId);

      // Se não encontrou, usar personal como padrão
      if (!active) {
        active = profiles.find(p => p.profile_type === 'personal') || profiles[0];
        if (active) {
          localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, active.id);
        }
      }

      setActiveProfile(active || null);
    } catch (error: unknown) {
      logger.error('Error loading active profile:', error);
      setError(getErrorMessage(error, 'Failed to load active profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  const switchProfile = useCallback(async (profileId: string) => {
    const profile = allProfiles.find(p => p.id === profileId);
    
    if (!profile) {
      setError('Profile not found');
      return false;
    }

    try {
      await SessionService.switchProfile(profileId);
      setActiveProfile(profile);
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
      return true;
    } catch (error: unknown) {
      logger.error('Error switching active profile:', error);
      setError(getErrorMessage(error, 'Failed to switch active profile'));
      return false;
    }
  }, [allProfiles]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return {
    activeProfile,
    allProfiles,
    loading,
    error,
    switchProfile,
    refetch: loadProfiles,
  };
}
