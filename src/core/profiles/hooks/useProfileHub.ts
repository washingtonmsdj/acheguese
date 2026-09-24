/**
 * useProfileHub - Hook consolidado para o hub de perfil.
 *
 * Organiza e prepara todos os dados necessarios para os componentes do hub.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useMultiProfileContext } from '@/core/profiles/contexts/multi-profile-runtime-context';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useContaWorkspace } from './useContaWorkspace';
import { buildProfileEditUrl, buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { canProfileHaveMembers, isProfileVerified } from '@/core/profiles/utils/profileDomainRules';

import type { ProfileAssociatedBusiness } from '@/core/profiles/services/ProfileBusinessTypes';

export function useProfileHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile, allProfiles, switchProfile } = useMultiProfileContext();
  const appUrls = useAppUrls();
  const {
    profile,
    context,
    identity,
    account,
    stats,
    operations,
    roles,
    businessModules,
    loading,
    error,
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
    notifications,
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
        notifications.unread > 0
          ? {
              title: 'Triar notificações pendentes',
              description: `Existem ${notifications.unread} notificações não lidas aguardando ação.`,
              actionLabel: 'Ver avisos',
              onClick: () => navigate(appUrls.profile.notifications),
            }
          : null,
        showBusinessOnboarding
          ? {
              title: 'Ativar operação empresarial',
              description: 'Este perfil já pode entrar no fluxo de empresa e dashboard.',
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
      notifications.unread,
      showBusinessOnboarding,
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

    notifications,
    favorites,

    nextActions,

    handleAvatarChange,
    handleSwitchProfile,
    handleBusinessClick,
    copyToClipboard,
    refreshWorkspace,
    navigate,
    appUrls,
  };
}
