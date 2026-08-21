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

/**
 * Generic authentication boundary for client-side routes.
 *
 * This guard also provides the SPA side of the LGPD pending-deletion boundary:
 * an authenticated account with a non-cancelled deletion request can only use
 * the privacy surface until the request is cancelled or the purge lifecycle is
 * resolved. Database access remains protected independently by RLS and the
 * server-side operational-account helpers.
 */
export function ProtectedRoute({
  children,
  loadingLabel = "Verificando acesso...",
}: ProtectedRouteProps) {
  const { user, isLoading } = useSessionContext();
  const location = useLocation();
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;

  const { data: deletionStatus } = useQuery({
    queryKey: ["deletion-status", user?.id],
    queryFn: () => PrivacySettingsService.getDeletionStatus(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    retry: false,
  });

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

  const accountRestricted = Boolean(
    deletionStatus?.status &&
      RESTRICTED_DELETION_STATUSES.has(deletionStatus.status),
  );

  if (accountRestricted && location.pathname !== PRIVACY_ACCOUNT_PATH) {
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
