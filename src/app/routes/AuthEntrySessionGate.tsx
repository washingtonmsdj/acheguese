import { type ReactNode, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
  AUTH_QUERY_VALUES,
} from "@/core/auth/constants/authFlow";
import { hasPendingAuthCallbackExchange } from "@/core/auth/utils/authCallback";
import { prepareAuthenticatedLoginTermsCheck } from "@/core/auth/utils/authJourney";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

type AuthEntrySessionGateProps = {
  children: ReactNode;
};

type AuthEntryLocationState = {
  redirectTo?: unknown;
} | null;

/**
 * An authenticated session must never be bounced straight from /login back to
 * the requested page. It first crosses the legal gate, which is the authority
 * for deciding whether the current Terms of Service version is already accepted.
 *
 * Confirmation/reset callback surfaces remain owned by LoginPage because they
 * have their own settlement rules and must not be intercepted here.
 */
export function AuthEntrySessionGate({ children }: AuthEntrySessionGateProps) {
  const { user, isLoading } = useSessionContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEmailConfirmationReturn =
    searchParams.get(AUTH_QUERY_KEYS.confirmed) === AUTH_QUERY_VALUES.enabled;
  const isPasswordResetReturn =
    searchParams.get(AUTH_QUERY_KEYS.passwordReset) === AUTH_QUERY_VALUES.enabled;
  const hasAuthExchange = hasPendingAuthCallbackExchange(
    location.search,
    location.hash,
  );
  const ownsSpecialAuthReturn =
    isEmailConfirmationReturn || isPasswordResetReturn || hasAuthExchange;

  const stateRedirect = (location.state as AuthEntryLocationState)?.redirectTo;
  const redirectTo = resolveSafeInternalPath(
    stateRedirect ?? searchParams.get(AUTH_QUERY_KEYS.redirect),
    "/",
  );

  useEffect(() => {
    if (isLoading || !user || ownsSpecialAuthReturn) return;

    prepareAuthenticatedLoginTermsCheck(redirectTo);
    navigate(AUTH_PATHS.termsAcceptance, { replace: true });
  }, [isLoading, navigate, ownsSpecialAuthReturn, redirectTo, user]);

  if (isLoading || (user && !ownsSpecialAuthReturn)) {
    return <PassivePageFallback />;
  }

  return <>{children}</>;
}
