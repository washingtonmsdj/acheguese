/**
 * useModuleProfile
 *
 * Hook para módulos que precisam de um tipo específico de perfil.
 * Resolve automaticamente o perfil correto e limpa o contexto ao desmontar.
 *
 * Uso:
 *   const { profile, state, profiles } = useModuleProfile('business');
 *
 * Estados retornados:
 *   'loading'   → ainda carregando
 *   'resolved'  → 1 perfil encontrado, `profile` está preenchido
 *   'select'    → 2+ perfis do tipo, módulo deve mostrar seletor
 *   'missing'   → nenhum perfil do tipo, módulo deve mostrar CTA de criação
 */

import { useEffect, useMemo } from 'react';
import { useMultiProfileContext } from '../contexts/multi-profile-runtime-context';
import type { Profile, ProfileType } from '../services/multi-profile/types';

export type ModuleProfileState = 'loading' | 'resolved' | 'select' | 'missing';

export interface UseModuleProfileResult {
  profile: Profile | null;
  profiles: Profile[];   // todos os perfis do tipo (para seletor)
  state: ModuleProfileState;
  selectProfile: (profileId: string) => Promise<boolean>;
}

export function useModuleProfile(type: ProfileType): UseModuleProfileResult {
  const { allProfiles, loading, setModuleContext, switchProfile, contextualProfile } =
    useMultiProfileContext();

  // Registrar contexto do módulo ao montar, limpar ao desmontar
  useEffect(() => {
    setModuleContext(type);
    return () => setModuleContext(null);
  }, [type, setModuleContext]);

  const profiles = useMemo(
    () => allProfiles.filter(p => p.profile_type === type),
    [allProfiles, type],
  );

  const state: ModuleProfileState = useMemo(() => {
    if (loading) return 'loading';
    if (profiles.length === 0) return 'missing';
    if (profiles.length === 1) return 'resolved';
    // 2+ perfis: se já há um contextual do tipo certo, está resolvido
    if (contextualProfile?.profile_type === type) return 'resolved';
    return 'select';
  }, [loading, profiles, contextualProfile, type]);

  const profile = state === 'resolved'
    ? (contextualProfile?.profile_type === type ? contextualProfile : profiles[0])
    : null;

  return { profile, profiles, state, selectProfile: switchProfile };
}

