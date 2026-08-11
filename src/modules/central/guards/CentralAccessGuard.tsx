import { ProtectedRoute } from "@/core/routing/components/ProtectedRoute";

/**
 * Authentication boundary for Central routes.
 * Role and business-level permissions are enforced by the nested guards.
 */
export function CentralAccessGuard() {
  return <ProtectedRoute loadingLabel="Verificando acesso..." />;
}

export default CentralAccessGuard;
