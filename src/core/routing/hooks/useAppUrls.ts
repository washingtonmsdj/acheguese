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
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { useServiceUrls } from '@/core/professional/hooks/useServiceUrls';
import { useCommunityUrls } from './useCommunityUrls';
import { buildProfileEditUrl, buildProfileSettingsUrl } from '@/core/profiles/utils/publicProfileUrl';
import type { ResolvedTerritory } from './useResolveTerritoryFromUrl';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { buildGroupBaseUrl, buildModuleTerritoryUrl, geoPathToPublicUrl, MODULE_SLUGS } from '@/core/routing/utils/territoryUrls';
import { jobPublicRoutes } from '@/core/verticals/jobs/routes/jobPublicRoutes';
import { LAUNCH_URLS } from '@/config/territory';
import { classifiedUrlService, type ClassifiedUrlContext } from '@/core/classifieds/services';

export interface AppUrls {
  // Módulos territoriais
  business: ReturnType<typeof useBusinessUrls>;
  services: ReturnType<typeof useServiceUrls>;
  classifieds: {
    list: string;
    new: string;
    edit: (id: string) => string;
    seller: (sellerId: string) => string;
    canonical: (ctx: ClassifiedUrlContext) => string;
    short: (publicId: string) => string;
  };
  community: ReturnType<typeof useCommunityUrls>;
  mobility: {
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
    passageiro: {
      home: string;
      corridas: string;
    };
  };
  
  // Rotas globais - Perfil
  profile: {
    home: string;
    businesses: string;
    billing: string;
    addresses: string;
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
  const { active } = usePublicBrowsingCity();
  const { activeLocation } = useActiveTerritory();
  const cityBase = `/${active.state}/${active.city}`;
  const business = useBusinessUrls(routeResolved);
  const services = useServiceUrls(routeResolved);
  const classifiedsList = routeResolved
    ? routeResolved.kind === 'group'
      ? (() => {
          const firstMember = routeResolved.group.members[0];
          if (firstMember?.geographic_path) {
            const parts = firstMember.geographic_path.split('/').filter(Boolean);
            const groupBase = buildGroupBaseUrl(routeResolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
            return buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, groupBase);
          }
          return LAUNCH_URLS.classifieds;
        })()
      : buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, geoPathToPublicUrl(routeResolved.location.geographic_path))
    : activeLocation?.geographic_path
      ? buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, geoPathToPublicUrl(activeLocation.geographic_path))
      : LAUNCH_URLS.classifieds;
  const classifieds = {
    list: classifiedsList,
    new: classifiedUrlService.buildNewUrl(),
    edit: (id: string) => classifiedUrlService.buildEditUrl(id),
    seller: (sellerId: string) => classifiedUrlService.buildSellerUrl(sellerId),
    canonical: (ctx: ClassifiedUrlContext) => classifiedUrlService.buildUrls(ctx).canonical,
    short: (publicId: string) => classifiedUrlService.buildShortUrl(publicId),
  };
  const community = useCommunityUrls(routeResolved);
  const mobility = {
    home: '/mobilidade',
    motorista: {
      home: '/central/motorista',
      cadastro: '/central/motorista/cadastro',
      disponibilidade: '/central/motorista/disponibilidade',
      corridas: '/central/motorista/corridas',
      ganhos: '/central/motorista/ganhos',
      configuracoes: '/central/motorista/configuracoes',
    },
    motoboy: {
      home: '/central/motoboy',
      cadastro: '/central/motoboy/cadastro',
      disponibilidade: '/central/motoboy/disponibilidade',
      entregas: '/central/motoboy/entregas',
      ganhos: '/central/motoboy/ganhos',
      configuracoes: '/central/motoboy/configuracoes',
    },
    passageiro: {
      home: '/mobilidade',
      corridas: '/historico',
    },
  };

  return {
    // Módulos
    business,
    services,
    classifieds,
    community,
    mobility,
    
    // Perfil
    profile: {
      home: '/conta',
      businesses: businessManagementRoutes.list(),
      billing: '/conta',
      addresses: '/conta/enderecos',
      mobilidade: {
        home: '/central',
        motorista: mobility.motorista,
        motoboy: mobility.motoboy,
      },
      public: (username: string) => `/u/${username}`,
      manage: '/conta',
      edit: (profileId: string) => buildProfileEditUrl(profileId),
      account: '/conta/seguranca',
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
    settings: '/conta/preferencias',
    messages: '/mensagens',
    chat: (conversationId: string) => `/chat/${conversationId}`,
    map: `/mapa${cityBase}`,
    ranking: '/ranking',
    gamification: '/gamificacao',
    search: `/buscar${cityBase}`,
    notifications: '/notificacoes',
    jobs: jobPublicRoutes.list({ state: active.state, city: active.city }),
    family: {
      home: '/conta',
    },
  };
}

