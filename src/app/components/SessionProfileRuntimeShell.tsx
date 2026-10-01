import { lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { AppRoutes } from "@/app/routes/AppRoutes";
import { AUTH_PATHS, buildLoginPath } from "@/core/auth/constants/authFlow";
import { requiresPreContextAuthentication } from "@/core/routing/config/authRequiredRuntimeRoutes";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { SessionProvider } from "@/core/session/providers/SessionProvider";
import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";

const ContextualProfileTerritoryRuntime = lazy(
  () => import("@/app/components/ContextualProfileTerritoryRuntime"),
);

const AUTH_SESSION_ONLY_PATHS = new Set<string>([
  AUTH_PATHS.login,
  AUTH_PATHS.signup,
  AUTH_PATHS.signupConfirmation,
  AUTH_PATHS.termsAcceptance,
  AUTH_PATHS.passwordReset,
  AUTH_PATHS.emailChangeConfirmation,
]);

function RoutedPageContent() {
  return (
    <Suspense fallback={<PassivePageFallback />}>
      <AppRoutes />
    </Suspense>
  );
}

/**
 * Runtime de sessao das rotas contextuais e de autenticacao.
 *
 * A raiz publica `/` continua isolada antes deste shell. Dentro do runtime
 * roteado, as superficies de autenticacao carregam somente SessionProvider +
 * pagina: perfil, residencia e territorio vivem em um chunk lazy separado que
 * so e solicitado pelas rotas contextuais.
 *
 * `firstAccess` permanece no runtime contextual porque o onboarding posterior
 * a autenticacao pode depender de perfil/territorio. SessionProvider fica fora
 * da bifurcacao para a navegacao auth -> app nao reinicializar a sessao.
 */
function SessionAwareRuntimeBranch() {
  const location = useLocation();
  const { user, isLoading } = useSessionContext();
  const sessionOnlyRoute = AUTH_SESSION_ONLY_PATHS.has(location.pathname);

  if (sessionOnlyRoute) {
    return <RoutedPageContent />;
  }

  if (requiresPreContextAuthentication(location.pathname)) {
    // Protected routes do not need profile/territory runtime until the session
    // owner has decided whether an authenticated user exists.
    if (isLoading) {
      return <PassivePageFallback />;
    }

    if (!user) {
      const redirectPath =
        `${location.pathname}${location.search}${location.hash}`;
      return (
        <Navigate
          to={buildLoginPath(redirectPath)}
          replace
          state={{ redirectTo: redirectPath }}
        />
      );
    }
  }

  return (
    <Suspense fallback={<PassivePageFallback />}>
      <ContextualProfileTerritoryRuntime>
        <RoutedPageContent />
      </ContextualProfileTerritoryRuntime>
    </Suspense>
  );
}

export default function SessionProfileRuntimeShell() {
  return (
    <SessionProvider>
      <SessionAwareRuntimeBranch />
    </SessionProvider>
  );
}
