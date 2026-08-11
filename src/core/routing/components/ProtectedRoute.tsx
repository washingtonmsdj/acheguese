import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSessionContext } from "@/core/session";

export interface ProtectedRouteProps {
  children?: ReactNode;
  loadingLabel?: string;
}

/**
 * Generic authentication boundary for client-side routes.
 *
 * This guard only controls the SPA experience. Database access must still be
 * protected by RLS and server-side authorization checks.
 */
export function ProtectedRoute({
  children,
  loadingLabel = "Verificando acesso...",
}: ProtectedRouteProps) {
  const { user, isLoading } = useSessionContext();
  const location = useLocation();
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;

  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
        replace
        state={{ redirectTo: redirectPath }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
