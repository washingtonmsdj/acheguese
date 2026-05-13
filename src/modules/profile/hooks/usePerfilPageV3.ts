import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/shared/hooks/use-toast";
import { usePrivateProfileWorkspace } from "@/core/profiles";
import { usePasswordChange } from "@/core/auth/hooks/usePasswordChange";
import { useAvatarUpload } from "@/core/auth/hooks/useAvatarUpload";
import { useFavorites } from "@/core/favorites/hooks/useFavorites";
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { Business } from "@/core/profiles/services/types";
import { logger } from "@/shared/utils/logger";

/**
 * ✅ SSOT COMPLIANT - Hook de workspace privado da conta
 * Usa AuthService via useAuth para logout
 * Usa useAppUrls para navegação (sem hardcoded URLs)
 */

export function useContaWorkspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    managedAssets,
    notifications,
    roles,
    businesses: myBusinesses,
    businessModules,
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
  } = workspace;

  // Data management dialogs
  const [downloadDataOpen, setDownloadDataOpen] = useState(false);
  const [viewDataOpen, setViewDataOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Password change
  const passwordChange = usePasswordChange();

  // Avatar upload
  const avatarUpload = useAvatarUpload((avatarUrl: string) => {
    void avatarUrl; // Profile is managed by refetch
    void refetchWorkspace();
  });

  // Favorites
  const favorites = useFavorites(profile?.id ?? null);

  // Handlers
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await avatarUpload.uploadAvatar(file);
    }
  };

  const handleDownloadData = () => {
    if (!profile) return;

    try {
      const userData = {
        profile,
        context,
        identity,
        account,
        stats,
        operations,
        managedAssets,
        notifications,
        roles,
        businesses: myBusinesses,
        businessModules,
        verificationStatus,
        verificationRejectionReason,
        activeRide,
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-${(profile.name || "user").replace(/\s+/g, "-")}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      URL.revokeObjectURL(url);
      toast({ title: "Dados baixados com sucesso!" });
      setDownloadDataOpen(false);
    } catch {
      toast({ title: "Erro ao baixar dados", variant: "destructive" });
    }
  };

  const handleDeactivateAccount = () => {
    setDeactivateOpen(false);
    navigate(appUrls.profile.account);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "EXCLUIR") return;
    setDeleteOpen(false);
    navigate(appUrls.profile.account);
  };

  const handleBusinessClick = (business: Business) => {
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

  const handleEditBusiness = (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    navigate(appUrls.business.edit(business.id));
  };

  const handleDashboardBusiness = (e: React.MouseEvent, businessId: string) => {
    e.stopPropagation();
    navigate(appUrls.business.dashboard(businessId));
  };

  return {
    // Data
    profile,
    context,
    identity,
    account,
    stats,
    operations,
    managedAssets,
    notifications,
    roles,
    myBusinesses,
    businessModules,
    loading: workspaceLoading,
    error: workspaceError,
    activeRide,
    hasActiveRide,

    // Verification
    verificationStatus,
    verificationRejectionReason,

    // Dialogs
    downloadDataOpen,
    setDownloadDataOpen,
    viewDataOpen,
    setViewDataOpen,
    deactivateOpen,
    setDeactivateOpen,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,

    // Hooks
    passwordChange,
    avatarUpload,
    favorites,
    refreshWorkspace: refetchWorkspace,

    // Handlers
    handleAvatarChange,
    handleDownloadData,
    handleDeactivateAccount,
    handleDeleteAccount,
    handleBusinessClick,
    handleEditBusiness,
    handleDashboardBusiness,
  };
}
