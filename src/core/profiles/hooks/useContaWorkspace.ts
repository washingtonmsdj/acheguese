import { useNavigate } from "react-router-dom";
import { usePrivateProfileWorkspace } from "./usePrivateProfileWorkspace";
import { useAvatarUpload } from "@/core/auth/hooks/useAvatarUpload";
import { useFavorites } from "@/core/favorites/hooks/useFavorites";
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { ProfileAssociatedBusiness } from "@/core/profiles/services/ProfileBusinessTypes";
import { logger } from "@/shared/utils/logger";

/**
 * Workspace privado da conta.
 *
 * Mantém somente dados e ações de perfil/empresa pertencentes a este domínio.
 * Privacidade, exportação e exclusão pertencem a PrivacySettingsService e às
 * superfícies dedicadas de /conta/privacidade.
 */
export function useContaWorkspace() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const {
    workspace,
    loading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = usePrivateProfileWorkspace();

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
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
  } = workspace;

  const avatarUpload = useAvatarUpload(() => {
    void refetchWorkspace();
  });

  const favorites = useFavorites(profile?.id ?? null);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await avatarUpload.uploadAvatar(file);
    }
  };

  const handleBusinessClick = async (business: ProfileAssociatedBusiness) => {
    if (!business.slug) {
      logger.warn("[useContaWorkspace] Empresa sem slug para navegacao", {
        businessId: business.id,
      });
      return;
    }

    const url = BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });

    navigate(url);
  };

  const handleEditBusiness = (event: React.MouseEvent, business: ProfileAssociatedBusiness) => {
    event.stopPropagation();
    navigate(appUrls.business.edit(business.id));
  };

  const handleDashboardBusiness = (event: React.MouseEvent, businessId: string) => {
    event.stopPropagation();
    navigate(appUrls.business.dashboard(businessId));
  };

  return {
    profile,
    context,
    identity,
    account,
    stats,
    operations,
    notifications,
    roles,
    businessModules,
    loading: workspaceLoading,
    error: workspaceError,
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
    favorites,
    refreshWorkspace: refetchWorkspace,
    handleAvatarChange,
    handleBusinessClick,
    handleEditBusiness,
    handleDashboardBusiness,
  };
}
