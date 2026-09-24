/**
 * useProfileHub - Hook consolidado para o hub de perfil.
 *
 * Organiza e prepara todos os dados necessarios para os componentes do hub.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  Settings2,
  Globe,
  MessageSquare,
  MapPin,
  Users,
  Wrench,
  UtensilsCrossed,
  Bookmark,
} from 'lucide-react';

import { useAuth } from '@/core/auth/hooks/useAuth';
import { useMultiProfileContext } from '@/core/profiles/contexts/multi-profile-runtime-context';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useHomeCommunityHref } from '@/core/routing/hooks/useHomeCommunityHref';
import { APP_MODULE_SLUGS, buildAppModulePath } from '@/shared/config/moduleSlugs';
import { isLaunchSurfaceEnabled } from '@/app/config/launchScope';
import { LAUNCH_URLS } from '@/core/routing/config/territory';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useContaWorkspace } from './useContaWorkspace';
import { buildProfileEditUrl, buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { canProfileHaveMembers, isProfileVerified } from '@/core/profiles/utils/profileDomainRules';

import type { ProfileAssociatedBusiness } from '@/core/profiles/services/ProfileBusinessTypes';

const GLOBAL_MODULE_URLS = {
  business: buildAppModulePath(APP_MODULE_SLUGS.business),
  services: buildAppModulePath(APP_MODULE_SLUGS.services),
  gastronomy: buildAppModulePath(APP_MODULE_SLUGS.gastronomy),
  gastronomyFavorites: buildAppModulePath(APP_MODULE_SLUGS.gastronomy, "/favoritos"),
  community: LAUNCH_URLS.community,
  touristPoints: LAUNCH_URLS.touristPoints,
} as const;

export function useProfileHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile, allProfiles, switchProfile } = useMultiProfileContext();
  const appUrls = useAppUrls();
  const homeCommunityHref = useHomeCommunityHref();
  const moduleUrls = useMemo(
    () => ({
      ...GLOBAL_MODULE_URLS,
      community: homeCommunityHref,
    }),
    [homeCommunityHref],
  );

  const {
    profile,
    context,
    identity,
    account,
    stats,
    operations,
    notifications,
    roles,
    businessModules,
    loading,
    error,
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
    favorites,
    handleAvatarChange,
    refreshWorkspace,
  } = useContaWorkspace();

  const activeProfileId = activeProfile?.id ?? profile?.id ?? null;
  const isVerified = isProfileVerified(activeProfile, profile);
  const handle = activeProfile?.handle ?? identity?.username ?? '';
  const canOpenPublicProfile = Boolean(handle);
  const territoryLabel = identity?.territoryLabel;

  const canManageProfileMembers = canProfileHaveMembers(activeProfile);
  const hasDriverProfile = false;
  const hasBusinesses = businessModules.length > 0;
  const resolvedDriverProfile = null;
  const resolvedDriverProfileId = null;

  const operationalLinks = useMemo(
    () => [
      {
        icon: MessageSquare,
        title: 'Mensagens',
        description: 'Central de conversas e relacionamento.',
        onClick: () => navigate(appUrls.messages),
        surface: 'communityCommunication' as const,
      },
      {
        icon: MapPin,
        title: 'Mapa e território',
        description: 'Mapa principal, exploração territorial e contexto local.',
        onClick: () => navigate(appUrls.map),
      },
      {
        icon: Users,
        title: 'Família',
        description: 'Vínculos familiares, rastreamento e zonas seguras.',
        onClick: () => navigate(appUrls.family.home),
        surface: 'familySafety' as const,
      },
      {
        icon: Settings2,
        title: 'Residência e áreas',
        description: 'Residência, áreas de atuação e preferências operacionais.',
        onClick: () => navigate(appUrls.profile.addresses),
      },
    ].filter((item) => !item.surface || isLaunchSurfaceEnabled(item.surface)),
    [navigate, appUrls],
  );

  const ecosystemLinks = useMemo(
    () => [
      {
        icon: Building2,
        title: 'Empresas do território',
        description: 'Explore empresas, presença local e operação pública já ativa.',
        onClick: () => navigate(appUrls.business.list),
      },
      {
        icon: Wrench,
        title: 'Serviços',
        description: 'Descubra profissionais e serviços publicados no território atual.',
        onClick: () => navigate(appUrls.services.list),
      },
      {
        icon: UtensilsCrossed,
        title: 'Gastronomia',
        description: 'Acesse a vitrine gastronômica e os negócios com vertical ativa.',
        onClick: () => navigate(GLOBAL_MODULE_URLS.gastronomy),
      },
      {
        icon: Bookmark,
        title: 'Favoritos gastro',
        description: 'Entrada rápida para seus favoritos de gastronomia.',
        onClick: () => navigate(GLOBAL_MODULE_URLS.gastronomyFavorites),
      },
      {
        icon: MessageSquare,
        title: 'Comunidade',
        description: 'Postagens, recomendações e conteúdo territorial.',
        onClick: () => navigate(appUrls.community.feed),
        surface: 'community' as const,
      },
      {
        icon: Globe,
        title: 'Pontos turísticos',
        description: 'Vertical pública de pontos turísticos e conteúdo territorial.',
        onClick: () => navigate(GLOBAL_MODULE_URLS.touristPoints),
      },
    ].filter((item) => !item.surface || isLaunchSurfaceEnabled(item.surface)),
    [navigate, appUrls],
  );

  const showBilling = isLaunchSurfaceEnabled('billing');
  const showBusinessOnboarding =
    !hasBusinesses &&
    Boolean(
      identity?.permissions.some(
        (item: { key: string; allowed: boolean }) =>
          item.key === 'canCreateBusiness' && item.allowed,
      ),
    );

  const nextActions = useMemo(
    () =>
      [
        !territoryLabel
          ? {
              title: 'Definir residência ou território',
              description: 'Ainda faltam sinais territoriais para personalização e descoberta local.',
              actionLabel: 'Abrir endereços',
              onClick: () => navigate(appUrls.profile.addresses),
            }
          : null,
        !canOpenPublicProfile
          ? {
              title: 'Completar identidade pública',
              description: 'O perfil ativo ainda não tem handle público pronto para compartilhamento.',
              actionLabel: 'Editar perfil',
              onClick: () => {
                if (!activeProfileId) return;
                navigate(buildProfileEditUrl(activeProfileId));
              },
            }
          : null,
        showBusinessOnboarding
          ? {
              title: 'Ativar operação empresarial',
              description: showBilling
                ? 'Este perfil já pode entrar no fluxo de empresa, dashboard, billing e verticalização.'
                : 'Este perfil já pode entrar no fluxo de empresa, dashboard e verticalização.',
              actionLabel: 'Criar empresa',
              onClick: () => navigate(appUrls.business.create),
            }
          : null,
      ].filter(Boolean) as Array<{
        title: string;
        description: string;
        actionLabel: string;
        onClick: () => void;
      }>,
    [
      territoryLabel,
      canOpenPublicProfile,
      showBusinessOnboarding,
      showBilling,
      activeProfileId,
      navigate,
      appUrls,
    ],
  );

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === activeProfile?.id) return;
    const result = await switchProfile(profileId);
    if (result) toast.success('Perfil ativo alterado');
  };

  const handleBusinessClick = async (business: ProfileAssociatedBusiness) => {
    if (!business.slug) return;
    const url = BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
    navigate(url);
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${value}`);
      toast.success(`${label} copiado`);
    } catch {
      toast.error(`Não foi possível copiar ${label.toLowerCase()}`);
    }
  };

  return {
    user,
    activeProfile,
    profile,
    allProfiles,
    activeProfileId,
    isVerified,
    handle,
    canOpenPublicProfile,
    territoryLabel,

    context,
    identity,
    account,

    stats,
    operations,
    notifications,
    roles,

    businessModules,
    hasBusinesses,
    showBusinessOnboarding,

    hasDriverProfile,
    canManageProfileMembers,
    driverProfile: resolvedDriverProfile,
    driverProfileId: resolvedDriverProfileId,
    driverData: null,
    driverDataLoading: false,
    driverDataError: null,

    loading,
    error,

    activeRide,
    hasActiveRide,

    verificationStatus,
    verificationRejectionReason,

    favorites,

    operationalLinks,
    ecosystemLinks,
    nextActions,

    handleAvatarChange,
    handleSwitchProfile,
    handleBusinessClick,
    copyToClipboard,
    refreshWorkspace,
    navigate,
    appUrls,
    moduleUrls,
  };
}
