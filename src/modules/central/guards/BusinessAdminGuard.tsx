import { useEffect } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { useBusiness } from "@/core/business/hooks/useBusiness";
import { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";
import { toast } from "sonner";

/**
 * BusinessAdminGuard
 *
 * Guard que valida acesso a empresas usando o modelo atual.
 * Protege rotas /central/empresas/:businessId/*
 *
 * Usa useDashboardAccess para verificar ownership via BusinessOwnershipService.isOwner()
 * Redireciona para /central/empresas se usuário não tiver acesso.
 */
export function BusinessAdminGuard() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { business, isLoading: loadingBusiness } = useBusiness(businessId || "");
  const { permissions, loading: loadingAccess } = useDashboardAccess(business?.profile_id);

  useEffect(() => {
    if (loadingBusiness || loadingAccess) return;

    if (!businessId || !business) {
      toast.error("Empresa não encontrada.");
      navigate("/central/empresas", { replace: true });
      return;
    }

    if (!permissions.hasAccess) {
      toast.error("Você não tem permissão para gerenciar esta empresa.");
      navigate("/central/empresas", { replace: true });
    }
  }, [businessId, business, loadingBusiness, loadingAccess, permissions.hasAccess, navigate]);

  // Mostrar loading enquanto verifica acesso
  if (loadingBusiness || loadingAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Não renderizar nada se não tiver acesso (redirecionamento em andamento)
  if (!businessId || !business || !permissions.hasAccess) {
    return null;
  }

  return <Outlet />;
}

// Export default para lazy import
export default BusinessAdminGuard;
