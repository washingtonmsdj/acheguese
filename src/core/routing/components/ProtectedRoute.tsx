import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { PrivacySettingsService } from "@/core/privacy/services/PrivacySettingsService";
import { useSessionContext } from "@/core/session";

export interface ProtectedRouteProps {
  children?: ReactNode;
  loadingLabel?: string;
}

const PRIVACY_ACCOUNT_PATH = "/conta/privacidade";
const RESTRICTED_DELETION_STATUSES = new Set([
  "scheduled",
  "processing",
  "failed",
  "completed",
]);

function AccessLoading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-3 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/**
 * Authentication and operational-account boundary for client-side routes.
 *
 * Accounts with a pending deletion lifecycle may remain authenticated only to
 * reach the privacy recovery surface. Every other protected route waits for a
 * fresh status response and fails closed when that authority is unavailable.
 * Database access is independently enforced by RLS and the server-side
 * operational-account boundaries.
 */
export function ProtectedRoute({
  children,
  loadingLabel = "Verificando acesso...",
}: ProtectedRouteProps) {
  const { user, isLoading } = useSessionContext();
  const location = useLocation();
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;
  const isPrivacySurface = location.pathname === PRIVACY_ACCOUNT_PATH;

  const deletionStatusQuery = useQuery({
    queryKey: ["deletion-status", user?.id],
    queryFn: () => PrivacySettingsService.getDeletionStatus(user!.id),
    enabled: Boolean(user?.id) && !isLoading && !isPrivacySurface,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (isLoading) {
    return <AccessLoading label={loadingLabel} />;
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

  if (isPrivacySurface) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (deletionStatusQuery.isPending || deletionStatusQuery.isFetching) {
    return <AccessLoading label={loadingLabel} />;
  }

  if (deletionStatusQuery.isError) {
    return (
      <Navigate
        to={PRIVACY_ACCOUNT_PATH}
        replace
        state={{ accountStateUnavailable: true }}
      />
    );
  }

  const accountRestricted = Boolean(
    deletionStatusQuery.data?.status &&
      RESTRICTED_DELETION_STATUSES.has(deletionStatusQuery.data.status),
  );

  if (accountRestricted) {
    return (
      <Navigate
        to={PRIVACY_ACCOUNT_PATH}
        replace
        state={{ restrictedByAccountDeletion: true }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
