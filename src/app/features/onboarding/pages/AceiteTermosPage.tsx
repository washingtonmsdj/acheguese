import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import {
  AUTH_JOURNEY_INTENTS,
  AUTH_PATHS,
  buildLoginPath,
  buildSignupPath,
} from "@/core/auth/constants/authFlow";
import {
  hasAuthCallbackMarker,
  hasPendingPkceCode as hasPendingPkceCodeInUrl,
  isOAuthTermsCallbackError,
} from "@/core/auth/utils/authCallback";
import {
  cancelGoogleLogin,
  cancelGoogleSignup,
  completeExistingGoogleSignupJourney,
  completeTermsJourney,
  getAuthJourneyReturnTarget,
  getPendingAuthJourneyIntent,
  getSignupJourneyReturnTarget,
} from "@/core/auth/utils/authJourney";
import { getAuthReturnContext } from "@/core/auth/utils/authReturnContext";
import {
  COMMUNITY_GUIDELINES_PATH,
  hasCurrentTermsAcceptance,
  TERMS_OF_SERVICE_PATH,
  TERMS_OF_SERVICE_VERSION,
} from "@/core/legal/termsOfService";
import { PrivacySettingsService } from "@/core/privacy/services/PrivacySettingsService";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { AUTH_BROWSER_STORAGE_CONFIG } from "@/shared/config/security.config";
import { useToast } from "@/shared/hooks/use-toast";

type AcceptanceState =
  | "checking"
  | "needs-acceptance"
  | "signed-out"
  | "oauth-error";

export default function AceiteTermosPage() {
  const { user, isLoading: sessionLoading } = useSessionContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<AcceptanceState>("checking");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const returnTo = useMemo(() => getAuthJourneyReturnTarget(), []);
  const journeyIntent = useMemo(() => getPendingAuthJourneyIntent(), []);
  const signupOriginalReturn = useMemo(
    () => getSignupJourneyReturnTarget(),
    [],
  );
  const returnContext = useMemo(() => getAuthReturnContext(returnTo), [returnTo]);
  const hasSpecificReturnContext =
    returnTo !== "/" && returnContext.kind !== "generic";
  const oauthCallbackFailed = useMemo(
    () =>
      isOAuthTermsCallbackError(
        location.pathname,
        location.search,
        location.hash,
      ),
    [location.hash, location.pathname, location.search],
  );
  // Supabase conclui PKCE com history.replaceState. O snapshot do Router pode
  // continuar com `?code=...`, então a URL real é o contrato para decidir se
  // o callback atual ainda está pendente. Isso impede que uma sessão antiga já
  // persistida seja confundida com sucesso do novo login Google.
  const liveSearch =
    typeof window !== "undefined" ? window.location.search : location.search;
  const liveHash =
    typeof window !== "undefined" ? window.location.hash : location.hash;
  const authCallbackPending =
    !oauthCallbackFailed && hasAuthCallbackMarker(liveSearch, liveHash);
  const hasPendingPkceCode = hasPendingPkceCodeInUrl(liveSearch);
  const returnContextIcon =
    returnContext.kind === "conversation"
      ? "chat"
      : returnContext.kind === "account"
        ? "person"
        : returnContext.kind === "community"
          ? "users"
          : "store";
  const loginPath = buildLoginPath(returnTo);
  const oauthRetryPath =
    journeyIntent === AUTH_JOURNEY_INTENTS.signup
      ? buildSignupPath(signupOriginalReturn)
      : loginPath;

  useEffect(() => {
    if (oauthCallbackFailed || sessionLoading || !hasPendingPkceCode) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setState("oauth-error");
    }, AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs);

    return () => window.clearTimeout(timeout);
  }, [hasPendingPkceCode, oauthCallbackFailed, sessionLoading]);

  useEffect(() => {
    if (oauthCallbackFailed) {
      setState("oauth-error");
      return;
    }

    if (
      sessionLoading ||
      hasPendingPkceCode ||
      (!user && authCallbackPending)
    ) {
      setState("checking");
      return;
    }

    if (!user) {
      setState("signed-out");
      return;
    }

    let active = true;
    setState("checking");
    void PrivacySettingsService.getUserConsents(user.id)
      .then((consents) => {
        if (!active) return;
        if (consents.some((consent) => hasCurrentTermsAcceptance(consent))) {
          if (journeyIntent === AUTH_JOURNEY_INTENTS.signup) {
            completeExistingGoogleSignupJourney();
            navigate(signupOriginalReturn, { replace: true });
            return;
          }
          completeTermsJourney();
          navigate(returnTo, { replace: true });
          return;
        }
        setState("needs-acceptance");
      })
      .catch(() => {
        if (active) setState("needs-acceptance");
      });

    return () => {
      active = false;
    };
  }, [
    authCallbackPending,
    hasPendingPkceCode,
    journeyIntent,
    navigate,
    oauthCallbackFailed,
    returnTo,
    sessionLoading,
    signupOriginalReturn,
    user,
  ]);

  const handleAccept = async () => {
    if (!user || !accepted || submitting) return;
    setSubmitting(true);
    try {
      await PrivacySettingsService.recordConsent({
        userId: user.id,
        consentType: "terms_of_service",
        granted: true,
        userAgent: navigator.userAgent,
        termsVersion: TERMS_OF_SERVICE_VERSION,
      });
      toast({ title: "Aceite registrado" });
      completeTermsJourney();
      navigate(returnTo, { replace: true });
    } catch {
      toast({
        title: "Não foi possível registrar o aceite",
        description: "Tente novamente antes de continuar.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const clearFailedOAuthJourney = () => {
    if (journeyIntent === AUTH_JOURNEY_INTENTS.signup) {
      cancelGoogleSignup();
      return;
    }
    cancelGoogleLogin();
  };

  return (
    <>
      <Helmet>
        <title>Termos da conta | Achegue-se</title>
        <meta
          name="description"
          content="Revise os termos necessários para concluir seu acesso ao Achegue-se."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33] lg:bg-[radial-gradient(circle_at_16%_32%,rgba(216,234,224,.55),transparent_31%),radial-gradient(circle_at_70%_18%,rgba(255,236,185,.28),transparent_30%),#fffdfa]">
        <AuthBrandHeader
          secondaryHref={AUTH_PATHS.login}
          secondaryLabel="Entrar"
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-6 pt-3 focus:outline-none lg:grid lg:min-h-[calc(100dvh-144px)] lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Participação e confiança">
            <div className="max-w-[510px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.17em] text-[#0b5b59]">
                Conta e comunidade
              </p>
              <h1 className="mt-3 max-w-[470px] font-heading text-[46px] font-extrabold leading-[.95] tracking-[-0.05em] text-[#0b3b3f]">
                Entre sabendo<br />como cuidamos<br />desse espaço.
              </h1>
              <p className="mt-5 max-w-[430px] text-[17px] leading-6 text-[#244448]">
                O Achegue-se conecta pessoas, perfis e territórios. Por isso,
                participação e privacidade precisam começar com regras claras.
              </p>

              <div className="mt-8 grid max-w-[500px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#d6dedc] bg-white/75 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#0b5b59]">
                    <AuthConceptIcon name="shield" />
                  </span>
                  <p className="mt-3 text-[13px] font-bold">Regras transparentes</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#607477]">
                    Termos e diretrizes ficam disponíveis antes do aceite.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d6dedc] bg-white/75 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ef] text-[#0b5b59]">
                    <AuthConceptIcon name="users" />
                  </span>
                  <p className="mt-3 text-[13px] font-bold">Convivência responsável</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#607477]">
                    As Diretrizes da Comunidade fazem parte da experiência real
                    do produto.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full lg:rounded-[10px] lg:bg-white lg:p-7 lg:shadow-[0_18px_55px_rgba(17,55,59,.08)]">
            <div className="flex items-start gap-3 lg:block">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#0b5b59] lg:hidden">
                <AuthConceptIcon name="shield" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b5b59] lg:hidden">
                  Conta e comunidade
                </p>
                <h1 className="mt-1 font-heading text-[27px] font-extrabold leading-tight tracking-[-0.04em] lg:mt-0 lg:text-[24px]">
                  Antes de continuar
                </h1>
                <p className="mt-2 text-[13px] leading-5 text-[#526a6d]">
                  Revise os Termos de Uso e as Diretrizes da Comunidade para
                  concluir seu acesso.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#eef4f2] px-4 py-3 text-[#405f62]">
              <AuthConceptIcon name="info" className="mt-0.5 text-[#0b5b59]" />
              <p className="text-[11.5px] leading-5">
                Entrar com Google não pula esta etapa. O aceite é registrado na
                sua conta e pode ser consultado depois.
              </p>
            </div>

            {hasSpecificReturnContext ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#d7e1de] bg-white px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f0ed] text-[#0b5b59]">
                  <AuthConceptIcon name={returnContextIcon} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10.5px] text-[#607477]">
                    Depois dos termos, você volta para
                  </p>
                  <p className="truncate text-[12.5px] font-bold text-[#18383c]">
                    {returnContext.label}
                  </p>
                </div>
              </div>
            ) : null}

            {state === "checking" ? (
              <div
                role="status"
                className="flex min-h-[185px] items-center justify-center gap-3 py-10 text-[13px] text-[#607477]"
              >
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd5d3] border-t-[#0b5b59]" />
                Verificando o aceite da sua conta…
              </div>
            ) : null}

            {state === "oauth-error" ? (
              <div className="mt-6 space-y-4">
                <div
                  role="alert"
                  className="rounded-xl border border-[#ead8c7] bg-[#fff7ed] p-4"
                >
                  <p className="text-[13px] font-bold text-[#71401d]">
                    Não foi possível concluir a entrada com Google
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-[#735a49]">
                    O acesso foi cancelado ou interrompido antes de criar uma
                    sessão. Seu destino foi preservado para você tentar novamente.
                  </p>
                </div>
                <Link
                  to={oauthRetryPath}
                  onClick={clearFailedOAuthJourney}
                  className="flex h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
                >
                  {journeyIntent === AUTH_JOURNEY_INTENTS.signup
                    ? "Voltar para criar conta"
                    : "Voltar e tentar novamente"}
                </Link>
              </div>
            ) : null}

            {state === "signed-out" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[#d6dedc] bg-[#f8f7f2] p-4">
                  <p className="text-[13px] font-bold">Sua sessão não está disponível</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#607477]">
                    Entre novamente para que o aceite seja associado à conta correta.
                  </p>
                </div>
                <Link
                  to={loginPath}
                  className="flex h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
                >
                  Voltar para entrar
                </Link>
              </div>
            ) : null}

            {state === "needs-acceptance" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[#d6dedc] bg-[#f8f7f2] p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms-acceptance"
                      checked={accepted}
                      onCheckedChange={(checked) => setAccepted(checked === true)}
                      disabled={submitting}
                      className="mt-0.5 h-5 w-5 rounded-[3px] border-[#31575a]"
                    />
                    <Label
                      htmlFor="terms-acceptance"
                      className="cursor-pointer text-[13px] font-normal leading-5"
                    >
                      Li e aceito os Termos de Uso, incluindo as Diretrizes da
                      Comunidade.
                    </Label>
                  </div>
                  <p className="mt-3 pl-8 text-[11px] leading-4 text-[#607477]">
                    Abra os{" "}
                    <Link
                      to={TERMS_OF_SERVICE_PATH}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#0b4e52] underline underline-offset-2"
                    >
                      Termos
                    </Link>{" "}
                    e as{" "}
                    <Link
                      to={COMMUNITY_GUIDELINES_PATH}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#0b4e52] underline underline-offset-2"
                    >
                      Diretrizes da comunidade
                    </Link>{" "}
                    em outra aba antes de aceitar.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!accepted || submitting}
                  onClick={() => void handleAccept()}
                  className="h-11 w-full rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] shadow-[0_3px_10px_rgba(226,171,0,.16)] transition-colors hover:bg-[#f7bf00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {submitting ? "Registrando…" : "Aceitar e continuar"}
                </button>
                <p className="text-center text-[10.5px] leading-4 text-[#607477]">
                  Versão dos termos: {TERMS_OF_SERVICE_VERSION}
                </p>
              </div>
            ) : null}
          </section>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
