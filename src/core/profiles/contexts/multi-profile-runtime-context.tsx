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
import { useSessionContext } from '@/core/session/hooks/useSessionContext';
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

function readStoredActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredActiveProfileId(profileId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
}

function clearStoredActiveProfileId(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
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
  const { user: sessionUser, isLoading: sessionLoading } = useSessionContext();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [contextualProfile, setContextualProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const allProfilesRef = useRef<Profile[]>([]);
  const loadedUserIdRef = useRef<string | null>(null);
  const projectedUserIdRef = useRef<string | null>(null);
  const requestVersionRef = useRef(0);

  const loadProfilesForUser = useCallback(async (userId: string) => {
    const projectedUserId = projectedUserIdRef.current;
    loadedUserIdRef.current = userId;
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setError(null);

    // A troca de conta precisa remover a projeção privada anterior antes de
    // iniciar a leitura da nova conta. Em retry do mesmo usuário, preservamos
    // a lista já conhecida para não transformar erro transitório em vazio.
    if (projectedUserId !== null && projectedUserId !== userId) {
      projectedUserIdRef.current = null;
      setAllProfiles([]);
      allProfilesRef.current = [];
      setActiveProfile(null);
      setContextualProfile(null);
    }

    try {
      const profiles = await MultiProfileRuntimeService.getMyProfiles(userId);
      if (requestVersion !== requestVersionRef.current) return;

      projectedUserIdRef.current = userId;
      setAllProfiles(profiles);
      allProfilesRef.current = profiles;

      if (profiles.length === 0) {
        setActiveProfile(null);
        clearStoredActiveProfileId();
        return;
      }

      const savedId = readStoredActiveProfileId();
      let active = profiles.find((profile) => profile.id === savedId);
      if (!active) {
        active = profiles.find((profile) => profile.profile_type === 'personal') || profiles[0];
        if (active) writeStoredActiveProfileId(active.id);
      }
      setActiveProfile(active || null);
    } catch (error: unknown) {
      if (requestVersion === requestVersionRef.current) {
        if (loadedUserIdRef.current === userId) {
          loadedUserIdRef.current = null;
        }
        setError(getErrorMessage(error, 'Failed to load profiles'));
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    const userId = sessionUser?.id;
    if (!userId) return;
    await loadProfilesForUser(userId);
  }, [loadProfilesForUser, sessionUser?.id]);

  const switchProfile = useCallback(async (profileId: string): Promise<boolean> => {
    const profile = allProfiles.find((candidate) => candidate.id === profileId);
    if (!profile) { setError('Profile not found'); return false; }
    try {
      await SessionService.switchProfile(profileId);
      setActiveProfile(profile);
      writeStoredActiveProfileId(profileId);
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
    const ofType = allProfilesRef.current.filter((profile) => profile.profile_type === type);
    // Se encontrou profile do tipo exato, usa ele
    // Se não encontrou (ex: admin sem profile de motorista), usa o activeProfile como fallback
    const resolved = ofType.length >= 1 ? ofType[0] : (allProfilesRef.current[0] ?? null);
    setContextualProfile(resolved);
  }, []);

  useEffect(() => {
    const userId = sessionUser?.id ?? null;

    // SessionService publica o usuário antes de concluir a hidratação completa
    // dos perfis da sessão. Começar a projeção multi-profile neste ponto evita
    // um waterfall serial sem iniciar uma segunda sessão/auth request.
    if (userId) {
      if (loadedUserIdRef.current === userId) return;
      void loadProfilesForUser(userId);
      return;
    }

    // Enquanto a sessão ainda não decidiu se existe usuário, mantenha o estado
    // de carregamento sem limpar um perfil válido por um frame intermediário.
    if (sessionLoading) return;

    loadedUserIdRef.current = null;
    projectedUserIdRef.current = null;
    requestVersionRef.current += 1;
    setAllProfiles([]);
    allProfilesRef.current = [];
    setActiveProfile(null);
    setContextualProfile(null);
    setError(null);
    setLoading(false);
    clearStoredActiveProfileId();
  }, [loadProfilesForUser, sessionLoading, sessionUser?.id]);

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
      refetch,
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
