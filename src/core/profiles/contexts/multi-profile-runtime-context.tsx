import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { MultiProfileService } from '../services/multi-profile';
import type { Profile, ProfileType } from '../services/multi-profile/types';
import {
  MultiProfileContext,
  type MultiProfileContextValue,
} from './multiProfileContext.shared';

const MODULE_ROUTES: Record<string, ProfileType> = {
  '/empresas/criar-empresa': 'business',
  '/create-business': 'business',
  '/edit-business': 'business',
  '/perfil/empresas': 'business',
  '/empresas': 'business',  // rotas territoriais de empresas
  '/services/cadastrar': 'professional',
  '/servicos': 'professional',  // rotas territoriais de serviÃ§os
  '/mobilidade/motorista': 'driver',
  '/perfil/mobilidade/motorista': 'driver',
  '/perfil/mobilidade/motoboy': 'driver',
  '/central/motorista': 'driver',
  '/central/motoboy': 'driver',
  '/central/empresas': 'business',
  '/central/profissional': 'professional',
};

const ACTIVE_PROFILE_KEY = 'active_profile_id';

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
      const profiles = await MultiProfileService.getMyProfiles();
      setAllProfiles(profiles);
      allProfilesRef.current = profiles;

      if (profiles.length === 0) {
        setActiveProfile(null);
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
        return;
      }

      const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      let active = profiles.find(p => p.id === savedId);
      if (!active) {
        active = profiles.find(p => p.profile_type === 'personal') || profiles[0];
        if (active) localStorage.setItem(ACTIVE_PROFILE_KEY, active.id);
      }
      setActiveProfile(active || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  const switchProfile = useCallback(async (profileId: string): Promise<boolean> => {
    const profile = allProfiles.find(p => p.id === profileId);
    if (!profile) { setError('Profile not found'); return false; }
    setActiveProfile(profile);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    return true;
  }, [allProfiles]);

  const setModuleContext = useCallback((type: ProfileType | null) => {
    if (!type) {
      setContextualProfile(null);
      return;
    }
    const ofType = allProfilesRef.current.filter(p => p.profile_type === type);
    // Se encontrou profile do tipo exato, usa ele
    // Se nÃ£o encontrou (ex: admin sem profile de motorista), usa o activeProfile como fallback
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


