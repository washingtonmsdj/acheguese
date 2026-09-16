import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";

import { AppRoutes } from "@/app/routes/AppRoutes";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
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
export default function SessionProfileRuntimeShell() {
  const { pathname } = useLocation();
  const sessionOnlyRoute = AUTH_SESSION_ONLY_PATHS.has(pathname);

  return (
    <SessionProvider>
      {sessionOnlyRoute ? (
        <RoutedPageContent />
      ) : (
        <Suspense fallback={<PassivePageFallback />}>
          <ContextualProfileTerritoryRuntime>
            <RoutedPageContent />
          </ContextualProfileTerritoryRuntime>
        </Suspense>
      )}
    </SessionProvider>
  );
}
