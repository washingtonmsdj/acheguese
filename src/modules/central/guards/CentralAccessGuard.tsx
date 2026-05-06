import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useSessionContext } from "@/core/session";

/**
 * CentralAccessGuard
 *
 * Guard que exige autenticação para acessar rotas da Central (/central/*).
 * Redireciona para /login se o usuário não estiver autenticado.
 *
 * Uso:
 * <Route element={<CentralAccessGuard />}>
 *   <Route index element={<Page />} />
 * </Route>
 */
export function CentralAccessGuard() {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading } = useSessionContext();

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (!sessionLoading && !user) {
      navigate("/login", { replace: true, state: { redirectTo: window.location.pathname } });
    }
  }, [user, sessionLoading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Não renderizar nada se não estiver autenticado (redirecionamento em andamento)
  if (!user) {
    return null;
  }

  return <Outlet />;
}

// Export default para lazy import
export default CentralAccessGuard;
