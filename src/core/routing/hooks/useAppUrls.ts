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

import { useBusinessUrls } from '@/core/business/hooks/useBusinessUrls';
import { useServiceUrls } from '@/core/professional/hooks/useServiceUrls';
import { useClassifiedUrls } from '@/core/classifieds/hooks/useClassifiedUrls';
import { useCommunityUrls } from '@/core/community/hooks/useCommunityUrls';
import { useMobilityUrls } from '@/core/mobility/hooks/useMobilityUrls';
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
    businesses: string;
    billing: string;
      mobilidade: {
        home: string;
        motorista: {
          home: string;
          cadastro: string;
          disponibilidade: string;
          corridas: string;
          ganhos: string;
          configuracoes: string;
        };
        motoboy: {
          home: string;
          cadastro: string;
          disponibilidade: string;
          entregas: string;
          ganhos: string;
          configuracoes: string;
        };
      };
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
      businesses: '/perfil/empresas',
      billing: '/perfil/planos',
      mobilidade: {
        home: '/perfil/mobilidade',
        motorista: {
          home: '/perfil/mobilidade/motorista',
          cadastro: '/perfil/mobilidade/motorista/cadastro',
          disponibilidade: '/perfil/mobilidade/motorista/disponibilidade',
          corridas: '/perfil/mobilidade/motorista/corridas',
          ganhos: '/perfil/mobilidade/motorista/ganhos',
          configuracoes: '/perfil/mobilidade/motorista/configuracoes',
        },
        motoboy: {
          home: '/perfil/mobilidade/motoboy',
          cadastro: '/perfil/mobilidade/motoboy/cadastro',
          disponibilidade: '/perfil/mobilidade/motoboy/disponibilidade',
          entregas: '/perfil/mobilidade/motoboy/entregas',
          ganhos: '/perfil/mobilidade/motoboy/ganhos',
          configuracoes: '/perfil/mobilidade/motoboy/configuracoes',
        },
      },
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

