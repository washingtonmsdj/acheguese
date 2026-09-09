import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/shared/utils/logger';
import { MultiProfileRuntimeService } from '../services/multi-profile/runtimeProfileService';
import { SessionService } from '@/core/session/services/SessionService';
import { SessionState } from '@/core/session/state/SessionState';
import { ACTIVE_PROFILE_STORAGE_KEY } from '../constants/activeProfileStorage';
import { mobilityRoutes } from '@/core/mobility/routes/mobilityRoutes';
import type { Profile, ProfileType } from '../services/multi-profile/types';
import {
  MultiProfileContext,
  type MultiProfileContextValue,
} from './multiProfileContext.shared';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const MODULE_ROUTES: Record<string, ProfileType> = {
  '/central/empresas/nova': 'business',
  '/edit-business': 'business',
  '/empresas': 'business',  // rotas territoriais de empresas
  '/servicos/cadastrar': 'professional',
  '/servicos': 'professional',  // rotas territoriais de serviços
  [mobilityRoutes.public.motorista]: 'driver',
  [mobilityRoutes.motorista.home]: 'driver',
  [mobilityRoutes.motoboy.home]: 'driver',
  '/central/empresas': 'business',
  '/central/profissional': 'professional',
};

export function MultiProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [contextualProfile, setContextualProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const allProfilesRef = useRef<Profile[]>([]);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await SessionService.initializeSession();
      const currentUser = SessionState.getState().user;
      if (!currentUser?.id) {
        setAllProfiles([]);
        allProfilesRef.current = [];
        setActiveProfile(null);
        localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
        return;
      }

      const profiles = await MultiProfileRuntimeService.getMyProfiles(currentUser.id);
      setAllProfiles(profiles);
      allProfilesRef.current = profiles;

      if (profiles.length === 0) {
        setActiveProfile(null);
        localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
        return;
      }

      const savedId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
      let active = profiles.find(p => p.id === savedId);
      if (!active) {
        active = profiles.find(p => p.profile_type === 'personal') || profiles[0];
        if (active) localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, active.id);
      }
      setActiveProfile(active || null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load profiles'));
    } finally {
      setLoading(false);
    }
  }, []);

  const switchProfile = useCallback(async (profileId: string): Promise<boolean> => {
    const profile = allProfiles.find(p => p.id === profileId);
    if (!profile) { setError('Profile not found'); return false; }
    try {
      await SessionService.switchProfile(profileId);
      setActiveProfile(profile);
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
      return true;
    } catch (error: unknown) {
      logger.error('Error switching runtime profile:', error);
      setError(getErrorMessage(error, 'Failed to switch profile'));
      return false;
    }
  }, [allProfiles]);

  const setModuleContext = useCallback((type: ProfileType | null) => {
    if (!type) {
      setContextualProfile(null);
      return;
    }
    const ofType = allProfilesRef.current.filter(p => p.profile_type === type);
    // Se encontrou profile do tipo exato, usa ele
    // Se não encontrou (ex: admin sem profile de motorista), usa o activeProfile como fallback
    const resolved = ofType.length >= 1 ? ofType[0] : (allProfilesRef.current[0] ?? null);
    setContextualProfile(resolved);
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  return (
    <MultiProfileContext.Provider value={{
      activeProfile,
      contextualProfile,
      effectiveProfile: contextualProfile ?? activeProfile,
      allProfiles,
      loading,
      error,
      switchProfile,
      setModuleContext,
      refetch: loadProfiles,
    }}>
      {children}
    </MultiProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMultiProfileContext() {
  const ctx = useContext(MultiProfileContext);
  if (!ctx) throw new Error('useMultiProfileContext must be used within MultiProfileProvider');
  return ctx;
}

export function ModuleContextSync() {
  const location = useLocation();
  const { loading, setModuleContext } = useMultiProfileContext();

  useEffect(() => {
    if (loading) return;
    const matchedType = Object.entries(MODULE_ROUTES).find(([route]) =>
      location.pathname.startsWith(route)
    )?.[1] ?? null;
    setModuleContext(matchedType);
  }, [location.pathname, loading, setModuleContext]);

  return null;
}

export type { MultiProfileContextValue } from './multiProfileContext.shared';
