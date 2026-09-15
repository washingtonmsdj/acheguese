import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
  AUTH_QUERY_VALUES,
  buildLoginPath,
} from "@/core/auth/constants/authFlow";
import {
  getAuthCallbackError,
  hasPendingAuthCallbackExchange,
} from "@/core/auth/utils/authCallback";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { AUTH_BROWSER_STORAGE_CONFIG } from "@/shared/config/security.config";

type EmailChangeReturnState = "checking" | "ready" | "invalid";

export default function EmailChangeConfirmationPage() {
  const location = useLocation();
  const { user, isLoading: sessionLoading } = useSessionContext();
  const [timedOut, setTimedOut] = useState(false);

  const routeParams = new URLSearchParams(location.search);
  const hasEmailChangeMarker =
    routeParams.get(AUTH_QUERY_KEYS.emailChange) === AUTH_QUERY_VALUES.enabled;
  const callbackFailed =
    hasEmailChangeMarker &&
    getAuthCallbackError(location.search, location.hash) !== null;
  const liveSearch =
    typeof window !== "undefined" ? window.location.search : location.search;
  const liveHash =
    typeof window !== "undefined" ? window.location.hash : location.hash;
  const pendingAuthExchange =
    hasEmailChangeMarker &&
    hasPendingAuthCallbackExchange(liveSearch, liveHash);

  useEffect(() => {
    if (!hasEmailChangeMarker || callbackFailed || !pendingAuthExchange) return;

    const timeout = window.setTimeout(() => {
      if (
        hasPendingAuthCallbackExchange(
          window.location.search,
          window.location.hash,
        )
      ) {
        setTimedOut(true);
      }
    }, AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs);

    return () => window.clearTimeout(timeout);
  }, [callbackFailed, hasEmailChangeMarker, pendingAuthExchange]);

  const state: EmailChangeReturnState =
    !hasEmailChangeMarker || callbackFailed || timedOut
      ? "invalid"
      : sessionLoading || pendingAuthExchange
        ? "checking"
        : "ready";
  const accountAccessTarget = user
    ? ACCOUNT_PATHS.access
    : buildLoginPath(ACCOUNT_PATHS.access);

  return (
    <>
      <Helmet>
        <title>Confirmar novo e-mail | Achegue-se</title>
        <meta
          name="description"
          content="Conclua com segurança a confirmação do novo e-mail da sua conta Achegue-se."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33] lg:bg-[radial-gradient(circle_at_16%_32%,rgba(216,234,224,.55),transparent_31%),radial-gradient(circle_at_70%_18%,rgba(255,236,185,.28),transparent_30%),#fffdfa]">
        <AuthBrandHeader
          secondaryHref={user ? ACCOUNT_PATHS.security : AUTH_PATHS.login}
          secondaryLabel={user ? "Segurança" : "Entrar"}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex min-h-[calc(100dvh-140px)] w-full max-w-[430px] items-center px-6 py-8 focus:outline-none lg:max-w-[520px]"
        >
          <section className="w-full rounded-[12px] border border-[#d6dedc] bg-white p-6 text-center shadow-[0_18px_55px_rgba(17,55,59,.08)] lg:p-8">
            {state === "checking" ? (
              <div role="status" aria-live="polite">
                <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-[#cbd5d3] border-t-[#0b5b59]" />
                <h1 className="mt-5 font-heading text-[25px] font-extrabold tracking-[-0.035em]">
                  Confirmando seu novo e-mail…
                </h1>
                <p className="mt-2 text-sm leading-5 text-[#607477]">
                  Aguarde enquanto concluímos esta etapa com o serviço de autenticação.
                </p>
              </div>
            ) : null}

            {state === "ready" ? (
              <div role="status">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7ef] text-[#155c43]">
                  <AuthConceptIcon name="check" />
                </span>
                <h1 className="mt-5 font-heading text-[26px] font-extrabold tracking-[-0.04em]">
                  Confirmação recebida
                </h1>
                <p className="mx-auto mt-2 max-w-[350px] text-sm leading-5 text-[#526a6d]">
                  Esta etapa foi processada. Se outra mensagem de confirmação tiver sido enviada, conclua também essa etapa antes de conferir seus dados de acesso.
                </p>
                <Link
                  to={accountAccessTarget}
                  className="mt-6 flex min-h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] px-4 text-sm font-extrabold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
                >
                  {user ? "Voltar para Dados de acesso" : "Entrar e conferir meus dados"}
                </Link>
              </div>
            ) : null}

            {state === "invalid" ? (
              <div role="alert">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fde9e7] text-[#b83b33]">
                  <AuthConceptIcon name="warning" />
                </span>
                <h1 className="mt-5 font-heading text-[26px] font-extrabold tracking-[-0.04em]">
                  Não foi possível concluir esta confirmação
                </h1>
                <p className="mx-auto mt-2 max-w-[350px] text-sm leading-5 text-[#526a6d]">
                  O link pode ter expirado, já ter sido usado ou não corresponder a uma troca de e-mail iniciada pela conta.
                </p>
                <Link
                  to={accountAccessTarget}
                  className="mt-6 flex min-h-11 w-full items-center justify-center rounded-[9px] border border-[#31575a] bg-white px-4 text-sm font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
                >
                  {user ? "Voltar para Dados de acesso" : "Entrar na minha conta"}
                </Link>
              </div>
            ) : null}
          </section>
        </main>

        <AuthFooter />
      </div>
    </>
  );
}
