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
  const {
    business,
    isLoading: loadingBusiness,
    error: businessError,
    notFound: businessNotFound,
    retry: retryBusiness,
  } = useBusiness(businessId || "");
  const {
    permissions,
    loading: loadingAccess,
    checkedProfileId,
    error: accessError,
    refetch: retryAccess,
  } = useDashboardAccess(business?.profile_id);
  const accessReady = Boolean(
    business?.profile_id &&
      checkedProfileId === business.profile_id &&
      !loadingAccess,
  );

  useEffect(() => {
    if (loadingBusiness) return;

    if (!businessId || businessNotFound) {
      toast.error("Empresa não encontrada.");
      navigate(businessManagementRoutes.list(), { replace: true });
      return;
    }

    if (businessError || !business) return;
    if (!accessReady || accessError) return;

    if (!permissions.hasAccess) {
      toast.error("Você não tem permissão para gerenciar esta empresa.");
      navigate(businessManagementRoutes.list(), { replace: true });
    }
  }, [
    accessReady,
    accessError,
    business,
    businessError,
    businessNotFound,
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
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (businessError || accessError) {
    return (
      <section
        role="alert"
        className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <h1 className="text-lg font-semibold">Não foi possível verificar esta empresa</h1>
        <p className="text-sm text-muted-foreground">
          Houve um problema ao consultar os dados ou as permissões. Seu acesso não foi liberado.
        </p>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-territory-border px-5 py-2 font-medium"
          onClick={() => {
            if (businessError) retryBusiness();
            if (accessError) void retryAccess();
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!businessId || businessNotFound || !business || !permissions.hasAccess) {
    return null;
  }

  return <Outlet />;
}

export default BusinessAdminGuard;
