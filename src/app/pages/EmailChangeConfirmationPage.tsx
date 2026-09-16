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
  const [exchangeObservedSettled, setExchangeObservedSettled] = useState(false);

  const routeParams = new URLSearchParams(location.search);
  const hasEmailChangeMarker =
    routeParams.get(AUTH_QUERY_KEYS.emailChange) === AUTH_QUERY_VALUES.enabled;
  const callbackFailed =
    hasEmailChangeMarker &&
    getAuthCallbackError(location.search, location.hash) !== null;
  // A flag `emailChange=1` identifica a superfície, mas não prova que o Auth
  // realmente devolveu um callback. Mantemos a evidência do snapshot do Router
  // porque o SDK pode limpar code/tokens da URL real via history.replaceState.
  const hasCallbackExchangeEvidence =
    hasEmailChangeMarker &&
    hasPendingAuthCallbackExchange(location.search, location.hash);
  const liveSearch =
    typeof window !== "undefined" ? window.location.search : location.search;
  const liveHash =
    typeof window !== "undefined" ? window.location.hash : location.hash;
  const pendingAuthExchange =
    hasCallbackExchangeEvidence &&
    hasPendingAuthCallbackExchange(liveSearch, liveHash);
  // Se o SDK já limpou a URL antes do primeiro render, ainda damos uma janela
  // limitada para o SessionState publicar a sessão existente. A evidência do
  // callback nunca substitui `user`; ela apenas impede um falso signed-out.
  const callbackSettlementPending =
    hasCallbackExchangeEvidence &&
    !callbackFailed &&
    !timedOut &&
    (pendingAuthExchange || (!user && !exchangeObservedSettled));

  useEffect(() => {
    if (
      !hasCallbackExchangeEvidence ||
      callbackFailed ||
      exchangeObservedSettled ||
      timedOut ||
      (!pendingAuthExchange && user)
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const stillPending = hasPendingAuthCallbackExchange(
        window.location.search,
        window.location.hash,
      );
      if (stillPending) {
        setTimedOut(true);
        return;
      }
      // Garante rerender mesmo quando o SDK limpou a URL sem navegação do
      // React Router e o evento de sessão não alterou a identidade atual.
      setExchangeObservedSettled(true);
    }, AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs);

    return () => window.clearTimeout(timeout);
  }, [
    callbackFailed,
    exchangeObservedSettled,
    hasCallbackExchangeEvidence,
    pendingAuthExchange,
    timedOut,
    user,
  ]);

  const state: EmailChangeReturnState =
    !hasEmailChangeMarker ||
    !hasCallbackExchangeEvidence ||
    callbackFailed ||
    timedOut
      ? "invalid"
      : sessionLoading || callbackSettlementPending
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

      <div className="auth-concept-canvas min-h-[100dvh]">
        <AuthBrandHeader
          secondaryHref={user ? ACCOUNT_PATHS.security : AUTH_PATHS.login}
          secondaryLabel={user ? "Segurança" : "Entrar"}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex min-h-[calc(100dvh-140px)] w-full max-w-[430px] items-center px-6 py-8 focus:outline-none lg:max-w-[520px]"
        >
          <section className="w-full rounded-xl border border-border bg-card p-6 text-center shadow-md lg:p-8">
            {state === "checking" ? (
              <div role="status" aria-live="polite">
                <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
                <h1 className="mt-5 font-heading text-[25px] font-extrabold tracking-[-0.035em] text-foreground">
                  Confirmando seu novo e-mail…
                </h1>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  Aguarde enquanto concluímos esta etapa com o serviço de autenticação.
                </p>
              </div>
            ) : null}

            {state === "ready" ? (
              <div role="status">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                  <AuthConceptIcon name="check" />
                </span>
                <h1 className="mt-5 font-heading text-[26px] font-extrabold tracking-[-0.04em] text-foreground">
                  Confirmação recebida
                </h1>
                <p className="mx-auto mt-2 max-w-[350px] text-sm leading-5 text-muted-foreground">
                  Esta etapa foi processada. Se outra mensagem de confirmação tiver sido enviada, conclua também essa etapa antes de conferir seus dados de acesso.
                </p>
                <Link
                  to={accountAccessTarget}
                  className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {user ? "Voltar para Dados de acesso" : "Entrar e conferir meus dados"}
                </Link>
              </div>
            ) : null}

            {state === "invalid" ? (
              <div role="alert">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AuthConceptIcon name="warning" />
                </span>
                <h1 className="mt-5 font-heading text-[26px] font-extrabold tracking-[-0.04em] text-foreground">
                  Não foi possível concluir esta confirmação
                </h1>
                <p className="mx-auto mt-2 max-w-[350px] text-sm leading-5 text-muted-foreground">
                  O link pode ter expirado, já ter sido usado ou não corresponder a uma troca de e-mail iniciada pela conta.
                </p>
                <Link
                  to={accountAccessTarget}
                  className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
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
