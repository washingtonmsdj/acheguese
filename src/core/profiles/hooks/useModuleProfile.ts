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
import { resolveModuleProfileSelection } from '../services/multi-profile/moduleProfileSelection';
import type { ModuleProfileState } from '../services/multi-profile/moduleProfileSelection';

export type { ModuleProfileState } from '../services/multi-profile/moduleProfileSelection';

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

  const selection = useMemo(
    () => resolveModuleProfileSelection({ allProfiles, contextualProfile, loading, type }),
    [allProfiles, contextualProfile, loading, type],
  );

  return { ...selection, selectProfile: switchProfile };
}

