import { useEffect } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { useBusiness } from "@/core/business/hooks/useBusiness";
import { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { toast } from "sonner";

/**
 * BusinessAdminGuard
 *
 * Guard que valida acesso a empresas usando o modelo atual.
 * Protege rotas /central/empresas/:businessId/*
 *
 * Usa useDashboardAccess para verificar ownership via
 * BusinessOwnershipService.isOwner().
 */
export function BusinessAdminGuard() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { business, isLoading: loadingBusiness } = useBusiness(businessId || "");
  const {
    permissions,
    loading: loadingAccess,
    checkedProfileId,
  } = useDashboardAccess(business?.profile_id);
  const accessReady = Boolean(
    business?.profile_id &&
      checkedProfileId === business.profile_id &&
      !loadingAccess,
  );

  useEffect(() => {
    if (loadingBusiness) return;

    if (!businessId || !business) {
      toast.error("Empresa nao encontrada.");
      navigate(businessManagementRoutes.list(), { replace: true });
      return;
    }

    if (!accessReady) return;

    if (!permissions.hasAccess) {
      toast.error("Voce nao tem permissao para gerenciar esta empresa.");
      navigate(businessManagementRoutes.list(), { replace: true });
    }
  }, [
    accessReady,
    business,
    businessId,
    loadingBusiness,
    navigate,
    permissions.hasAccess,
  ]);

  if (loadingBusiness || (business && !accessReady)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando permissoes...</p>
        </div>
      </div>
    );
  }

  if (!businessId || !business || !permissions.hasAccess) {
    return null;
  }

  return <Outlet />;
}

export default BusinessAdminGuard;
