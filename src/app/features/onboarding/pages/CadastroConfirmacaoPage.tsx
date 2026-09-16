import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate } from "@/app/components/auth/AuthTurnstileGate";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import {
  AUTH_EMAIL_CONFIRMATION_INTENTS,
  AUTH_PATHS,
  buildLoginPath,
  buildSignupPath,
} from "@/core/auth/constants/authFlow";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  cancelUnconfirmedEmailLoginJourney,
  getSignupConfirmationContext,
  getSignupConfirmationResendRemainingMs,
  restartEmailSignupJourney,
  startSignupConfirmationResendCooldown,
} from "@/core/auth/utils/authJourney";
import {
  getAuthErrorMessage,
  isAuthRateLimitError,
} from "@/core/auth/utils/authMessages";
import { SUPPORT_PATH } from "@/shared/constants/legal";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

type ConfirmationState = { email?: string; redirectTo?: unknown } | null;

function getResendCooldownSeconds(): number {
  return Math.ceil(getSignupConfirmationResendRemainingMs() / 1000);
}

export default function CadastroConfirmacaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendConfirmationEmail } = useAuth();
  const { toast } = useToast();
  const turnstile = useAuthTurnstile();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(getResendCooldownSeconds);
  const resendInFlight = useRef(false);

  const state = location.state as ConfirmationState;
  const journeyContext = useMemo(() => getSignupConfirmationContext(), []);
  const hasCanonicalJourneyContext =
    journeyContext.email !== null || journeyContext.intent !== null;
  const email = useMemo(
    () =>
      journeyContext.email ?? state?.email?.trim().toLowerCase() ?? null,
    [journeyContext.email, state?.email],
  );
  const redirectTo = useMemo(
    () =>
      resolveSafeInternalPath(
        hasCanonicalJourneyContext
          ? journeyContext.returnTo
          : state?.redirectTo ?? journeyContext.returnTo,
        "/",
      ),
    [hasCanonicalJourneyContext, journeyContext.returnTo, state?.redirectTo],
  );
  const startedFromLogin =
    journeyContext.intent === AUTH_EMAIL_CONFIRMATION_INTENTS.login;
  const backToLogin = buildLoginPath(redirectTo);

  useEffect(() => {
    const syncCooldown = () => setCooldown(getResendCooldownSeconds());
    syncCooldown();
    const interval = window.setInterval(syncCooldown, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleResend = async () => {
    if (!email) return;
    if (cooldown > 0 || resendInFlight.current) return;
    if (!turnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança para reenviar.",
        variant: "destructive",
      });
      return;
    }

    resendInFlight.current = true;
    setIsResending(true);
    try {
      await resendConfirmationEmail(email, turnstile.token ?? undefined);
      startSignupConfirmationResendCooldown();
      setCooldown(getResendCooldownSeconds());
      toast({
        title: "E-mail reenviado",
        description: "Confira sua caixa de entrada e também a pasta de spam.",
      });
    } catch (error) {
      if (isAuthRateLimitError(error)) {
        // O servidor é autoritativo. Se ele ainda estiver limitando o e-mail,
        // preserve uma nova janela local para impedir tentativas em sequência.
        startSignupConfirmationResendCooldown();
        setCooldown(getResendCooldownSeconds());
      }
      toast({
        title: "Não foi possível reenviar agora",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      turnstile.reset();
      resendInFlight.current = false;
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    if (startedFromLogin) {
      cancelUnconfirmedEmailLoginJourney();
      navigate(backToLogin, { replace: true });
      return;
    }

    restartEmailSignupJourney();
    navigate(buildSignupPath(redirectTo), { replace: true });
  };

  const resendDisabled = isResending || cooldown > 0 || !turnstile.isReady;

  return (
    <>
      <Helmet>
        <title>Confirmar e-mail | Achegue-se</title>
        <meta
          name="description"
          content="Confirme seu e-mail para ativar sua conta Achegue-se."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="auth-concept-canvas min-h-[100dvh]">
        <AuthBrandHeader secondaryHref={AUTH_PATHS.login} secondaryLabel="Entrar" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-5 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Confirmação de e-mail">
            <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-primary">
              Só falta<br />confirmar<br />seu e-mail.
            </h1>
            <img
              src="/auth/confirm-hero.webp"
              alt="Ilustração de uma mensagem chegando ao território"
              className="mt-5 w-full max-w-[390px] object-cover"
            />
          </section>

          {!email ? (
            <section className="w-full text-center lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-7 lg:shadow-md">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
                <span style={{ transform: "scale(1.45)" }}><AuthConceptIcon name="info" /></span>
              </span>
              <h1 className="mt-4 font-heading text-[27px] font-extrabold leading-tight tracking-[-0.04em] text-foreground">
                Vamos localizar sua inscrição.
              </h1>
              <p className="mx-auto mt-2 max-w-[330px] text-[13px] leading-5 text-muted-foreground">
                {startedFromLogin
                  ? "O e-mail pendente não está disponível neste navegador. Volte para entrar e informe o endereço novamente."
                  : "O e-mail pendente não está disponível neste navegador. Reinicie o cadastro para informar o endereço correto, ou entre se você já confirmou a conta."}
              </p>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="mt-6 h-11 w-full rounded-lg bg-primary text-[14px] font-extrabold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {startedFromLogin ? "Voltar para entrar" : "Voltar para criar conta"}
              </button>
              <button
                type="button"
                onClick={() => navigate(backToLogin)}
                className="mx-auto mt-2 block min-h-10 rounded px-2 text-[13px] font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                Já confirmei — entrar
              </button>
              <Link
                to={SUPPORT_PATH}
                className="mx-auto mt-3 flex min-h-10 w-fit items-center gap-2 rounded px-2 text-[12px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <AuthConceptIcon name="help" />
                Preciso de ajuda
              </Link>
            </section>
          ) : (
            <section className="w-full text-center lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-7 lg:text-left lg:shadow-md">
              <img
                src="/auth/confirm-envelope.webp"
                alt="Envelope amarelo com uma mensagem"
                className="mx-auto h-[104px] w-[110px] object-contain lg:hidden"
              />
              <h1 className="mt-2 font-heading text-[29px] font-extrabold leading-tight tracking-[-0.04em] text-foreground lg:mt-0 lg:text-[24px]">
                <span className="lg:hidden">Confira seu e-mail</span>
                <span className="hidden lg:inline">Confira sua caixa de entrada</span>
              </h1>
              <p className="mt-2 text-[14px] leading-5 text-muted-foreground">
                {startedFromLogin ? "Sua conta ainda aguarda confirmação em " : "Enviamos um link para "}
                <span className="font-bold text-foreground">{email}</span>.
              </p>

              <ol className="mt-6 space-y-3 text-left">
                <li className="flex items-center gap-3 text-[13px] text-foreground">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-foreground">1</span>
                  <span>Abra a mensagem do Achegue-se.</span>
                </li>
                <li className="flex items-center gap-3 text-[13px] text-foreground">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-foreground">2</span>
                  <span className="lg:hidden">Toque em Confirmar e-mail.</span>
                  <span className="hidden lg:inline">Clique em Confirmar e-mail.</span>
                </li>
                <li className="flex items-center gap-3 text-[13px] text-foreground">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-foreground">3</span>
                  <span>Volte para continuar.</span>
                </li>
              </ol>

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-warning/10 px-4 py-3 text-left lg:hidden">
                <span className="mt-0.5 text-warning"><AuthConceptIcon name="info" /></span>
                <div>
                  <p className="text-[12px] font-bold text-foreground">Não encontrou?</p>
                  <p className="text-[11.5px] text-muted-foreground">Confira a pasta de spam.</p>
                </div>
              </div>

              {turnstile.enabled ? (
                <div className="mt-4 text-left">
                  <AuthTurnstileGate
                    action="signup"
                    onVerify={turnstile.setToken}
                    onExpire={turnstile.reset}
                    onError={turnstile.reset}
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleResend}
                disabled={resendDisabled}
                aria-live="polite"
                className="mt-4 h-11 w-full rounded-lg border border-border bg-card text-[14px] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55 lg:mt-6"
              >
                {isResending ? "Reenviando…" : cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail"}
              </button>

              <button
                type="button"
                onClick={handleChangeEmail}
                className="mx-auto mt-2 block min-h-10 rounded px-2 text-[12px] font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 lg:mx-auto"
              >
                {startedFromLogin ? "Usar outro e-mail" : "Informei o e-mail errado"}
              </button>

              <p className="mt-1 hidden text-center text-[11px] text-muted-foreground lg:block">
                Confira também a pasta de spam.
              </p>

              <div className="my-5 h-px bg-border" />
              <div className="flex items-start gap-3 text-left text-muted-foreground lg:hidden">
                <AuthConceptIcon name="clock" className="mt-0.5 text-primary" />
                <p className="text-[11px] leading-4">Sua conta ainda aguarda confirmação.</p>
              </div>
              <div className="my-5 h-px bg-border lg:hidden" />

              <div className="space-y-1 text-left lg:hidden">
                <button
                  type="button"
                  onClick={() => navigate(backToLogin)}
                  className="flex min-h-10 items-center gap-3 rounded px-1 text-[13px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <AuthConceptIcon name="back" />
                  Voltar para entrar
                </button>
                <Link
                  to={SUPPORT_PATH}
                  className="flex min-h-10 items-center gap-3 rounded px-1 text-[13px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <AuthConceptIcon name="help" />
                  Preciso de ajuda
                </Link>
              </div>

              <nav aria-label="Ações de confirmação" className="hidden items-center justify-center gap-2 text-[11px] text-primary lg:flex">
                <button type="button" onClick={() => navigate(backToLogin)} className="underline underline-offset-2">Voltar para entrar</button>
                <span aria-hidden="true">·</span>
                <Link to={SUPPORT_PATH} className="underline underline-offset-2">Ajuda</Link>
              </nav>
            </section>
          )}
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
