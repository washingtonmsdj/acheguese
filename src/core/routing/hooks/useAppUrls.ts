/**
 * useAppUrls
 * 
 * Hook centralizado para URLs globais da aplicação.
 * Combina todos os hooks de módulos para acesso unificado.
 * 
 * SSOT para navegação global - usar este hook em componentes de navegação.
 * 
 * @param routeResolved - Território resolvido pela rota (opcional).
 *   Quando dentro de TerritorialLayout, passar o resolved do useTerritorialContext().
 *   Quando fora (header, sidebar global), deixar undefined para usar activeTerritory.
 */

import { useBusinessUrls } from '@/modules/business/hooks/useBusinessUrls';
import { useServiceUrls } from '@/modules/services/hooks/useServiceUrls';
import { useClassifiedUrls } from '@/modules/classifieds/hooks/useClassifiedUrls';
import { useCommunityUrls } from '@/modules/community/hooks/useCommunityUrls';
import { useMobilityUrls } from '@/modules/mobility/hooks/useMobilityUrls';
import { useFriendlyModuleUrls } from './useFriendlyModuleUrls';
import { LAUNCH_URLS } from '@/config/territory';
import { buildProfileEditUrl, buildProfileSettingsUrl } from '@/core/profiles/utils/publicProfileUrl';
import type { ResolvedTerritory } from './useResolveTerritoryFromUrl';

export interface AppUrls {
  // Módulos territoriais
  business: ReturnType<typeof useBusinessUrls>;
  services: ReturnType<typeof useServiceUrls>;
  classifieds: ReturnType<typeof useClassifiedUrls>;
  community: ReturnType<typeof useCommunityUrls>;
  mobility: ReturnType<typeof useMobilityUrls>;
  
  // Rotas globais - Perfil
  profile: {
    central: string;
    public: (username: string) => string;
    manage: string;
    edit: (profileId: string) => string;
    account: string;
    settings: (tab?: 'privacy' | 'links' | 'members') => string;
  };
  
  // Rotas globais - Auth
  auth: {
    login: string;
    register: string;
    onboarding: string;
  };
  
  // Rotas globais - Outras
  home: string;
  settings: string;
  messages: string;
  chat: (conversationId: string) => string;
  map: string;
  ranking: string;
  gamification: string;
  search: string;
  notifications: string;
  jobs: string;
  family: {
    home: string;
  };
}

export function useAppUrls(routeResolved?: ResolvedTerritory | null): AppUrls {
  const business = useBusinessUrls(routeResolved);
  const services = useServiceUrls(routeResolved);
  const classifieds = useClassifiedUrls(routeResolved);
  const community = useCommunityUrls(routeResolved);
  const mobility = useMobilityUrls();
  const moduleUrls = useFriendlyModuleUrls();

  return {
    // Módulos
    business,
    services,
    classifieds,
    community,
    mobility,
    
    // Perfil
    profile: {
      central: '/perfil',
      public: (username: string) => `/u/${username}`,
      manage: '/perfil/identidades',
      edit: (profileId: string) => buildProfileEditUrl(profileId),
      account: '/perfil/conta',
      settings: (tab) => buildProfileSettingsUrl(tab),
    },
    
    // Auth
    auth: {
      login: '/login',
      register: '/cadastro',
      onboarding: '/onboarding',
    },
    
    // Globais
    home: '/',
    settings: '/configuracoes',
    messages: '/mensagens',
    chat: (conversationId: string) => `/chat/${conversationId}`,
    map: moduleUrls.map,   // ← territorial via useFriendlyModuleUrls
    ranking: moduleUrls.ranking,
    gamification: '/gamificacao',
    search: '/busca',
    notifications: '/notificacoes',
    jobs: LAUNCH_URLS.jobs,
    family: {
      home: '/perfil/familia',
    },
  };
}
