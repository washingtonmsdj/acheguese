import { Suspense } from "react";
import { useLocation } from "react-router-dom";

import { AppRoutes } from "@/app/routes/AppRoutes";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { SessionProvider } from "@/core/session/providers/SessionProvider";
import {
  MultiProfileProvider,
  ModuleContextSync,
} from "@/core/profiles/contexts/multi-profile-runtime-context";
import { TerritoryModeInitializer } from "@/core/location/components/TerritoryModeInitializer";
import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";

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
 * Runtime autenticado/contextual.
 *
 * A entrada publica `/` nao precisa inicializar Supabase Auth, perfis ou modo
 * territorial. Rotas publicas de autenticacao precisam apenas da sessao: elas
 * nao devem importar/hidratar multi-profile, residencia ou territorio antes do
 * usuario entrar. Rotas contextuais continuam recebendo o runtime completo.
 *
 * `firstAccess` permanece no runtime completo porque o onboarding posterior a
 * autenticacao pode depender de perfil/territorio. O SessionProvider fica fora
 * da bifurcacao para nao reinicializar a sessao durante a navegacao auth -> app.
 */
export default function SessionProfileRuntimeShell() {
  const { pathname } = useLocation();
  const sessionOnlyRoute = AUTH_SESSION_ONLY_PATHS.has(pathname);

  return (
    <SessionProvider>
      {sessionOnlyRoute ? (
        <RoutedPageContent />
      ) : (
        <MultiProfileProvider>
          <TerritoryModeInitializer />
          <ModuleContextSync />
          <RoutedPageContent />
        </MultiProfileProvider>
      )}
    </SessionProvider>
  );
}
