import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate } from "@/app/components/auth/AuthTurnstileGate";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
  AUTH_QUERY_VALUES,
  buildPasswordResetRequestPath,
  buildSignupPath,
} from "@/core/auth/constants/authFlow";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  getAuthCallbackError,
  hasPendingAuthCallbackExchange,
} from "@/core/auth/utils/authCallback";
import { parseAuthIdentifier } from "@/core/auth/utils/authIdentifier";
import {
  cancelGoogleLogin,
  completeEmailConfirmationJourney,
  completeStandardLoginJourney,
  getSignupJourneyReturnTarget,
  prepareGoogleLogin,
  prepareUnconfirmedEmailLogin,
} from "@/core/auth/utils/authJourney";
import {
  getAuthErrorMessage,
  isEmailNotConfirmedError,
} from "@/core/auth/utils/authMessages";
import { getAuthReturnContext } from "@/core/auth/utils/authReturnContext";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { AUTH_BROWSER_STORAGE_CONFIG } from "@/shared/config/security.config";
import {
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";
import { cn } from "@/shared/utils/cn";
import {
  LoginIdentifierSchema,
  type LoginIdentifierInput,
} from "@/shared/validation/schemas/user.schema";

type PendingAction = "login" | "google" | null;
type LoginLocationState = { redirectTo?: unknown } | null;

export default function LoginPage() {
  const {
    signIn,
    signInWithUsername,
    signInWithGoogle,
    googleAuthAvailable,
  } = useAuth();
  const { user, isLoading: sessionLoading } = useSessionContext();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const authActionInFlightRef = useRef(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const turnstile = useAuthTurnstile();

  const isEmailConfirmed =
    searchParams.get(AUTH_QUERY_KEYS.confirmed) === AUTH_QUERY_VALUES.enabled;
  const isPasswordReset =
    searchParams.get(AUTH_QUERY_KEYS.passwordReset) === AUTH_QUERY_VALUES.enabled;
  const emailConfirmationCallbackFailed =
    isEmailConfirmed &&
    getAuthCallbackError(location.search, location.hash) !== null;
  const emailConfirmationExchangePending =
    isEmailConfirmed &&
    hasPendingAuthCallbackExchange(
      typeof window !== "undefined" ? window.location.search : location.search,
      typeof window !== "undefined" ? window.location.hash : location.hash,
    );
  const emailConfirmationSettling =
    isEmailConfirmed &&
    !sessionLoading &&
    user === null &&
    !emailConfirmationCallbackFailed;
  const showEmailConfirmationProgress =
    emailConfirmationExchangePending || emailConfirmationSettling;
  const showEmailConfirmed =
    isEmailConfirmed &&
    !sessionLoading &&
    user !== null &&
    !emailConfirmationCallbackFailed &&
    !emailConfirmationExchangePending;

  const redirectTo = useMemo(() => {
    const stateRedirect = (location.state as LoginLocationState)?.redirectTo;
    const queryRedirect = searchParams.get(AUTH_QUERY_KEYS.redirect);
    const pendingSignupRedirect = isEmailConfirmed
      ? getSignupJourneyReturnTarget()
      : null;
    return resolveSafeInternalPath(
      stateRedirect ?? queryRedirect ?? pendingSignupRedirect,
      "/",
    );
  }, [isEmailConfirmed, location.state, searchParams]);
  const returnContext = useMemo(() => getAuthReturnContext(redirectTo), [redirectTo]);
  const returnContextIcon =
    returnContext.kind === "conversation"
      ? "chat"
      : returnContext.kind === "account"
        ? "person"
        : returnContext.kind === "community"
          ? "users"
          : "store";

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginIdentifierInput>({
    resolver: zodResolver(LoginIdentifierSchema),
    mode: "onBlur",
  });

  const identifierValue = watch("identifier") ?? "";
  const parsedIdentifier = parseAuthIdentifier(identifierValue);
  const serverError = (errors as { root?: { serverError?: { message?: string } } })
    .root?.serverError?.message;

  useEffect(() => {
    if (!isEmailConfirmed || sessionLoading) return;

    if (emailConfirmationCallbackFailed) {
      navigate(AUTH_PATHS.signupConfirmation, { replace: true });
      return;
    }

    if (user && !emailConfirmationExchangePending) return;

    // Supabase may consume `code` from the live URL before SessionService has
    // published the resulting user. Give the callback a bounded settlement
    // window instead of treating a temporarily-null SessionState as failure.
    const timeout = window.setTimeout(() => {
      const stillPending = hasPendingAuthCallbackExchange(
        window.location.search,
        window.location.hash,
      );
      if (stillPending || !user) {
        navigate(AUTH_PATHS.signupConfirmation, { replace: true });
      }
    }, AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs);

    return () => window.clearTimeout(timeout);
  }, [
    emailConfirmationCallbackFailed,
    emailConfirmationExchangePending,
    isEmailConfirmed,
    navigate,
    sessionLoading,
    user,
  ]);

  useEffect(() => {
    if (sessionLoading || !user) return;

    if (isEmailConfirmed) {
      if (
        emailConfirmationCallbackFailed ||
        hasPendingAuthCallbackExchange(
          window.location.search,
          window.location.hash,
        )
      ) {
        return;
      }
      completeEmailConfirmationJourney();
      navigate(AUTH_PATHS.firstAccess, { replace: true });
      return;
    }

    completeStandardLoginJourney();
    navigate(redirectTo, { replace: true });
  }, [
    emailConfirmationCallbackFailed,
    isEmailConfirmed,
    navigate,
    redirectTo,
    sessionLoading,
    user,
  ]);

  const onValid = async (data: LoginIdentifierInput) => {
    if (sessionLoading || user || authActionInFlightRef.current) return;
    const parsed = parseAuthIdentifier(data.identifier);
    if (!parsed) return;
    if (!turnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança para continuar.",
        variant: "destructive",
      });
      return;
    }

    authActionInFlightRef.current = true;
    clearErrors("root.serverError");
    setPendingAction("login");
    const captchaToken = turnstile.token ?? undefined;

    try {
      if (parsed.kind === "username") {
        await signInWithUsername({
          username: parsed.value,
          password: data.password,
          captchaToken,
        });
      } else {
        await signIn({
          email: parsed.value,
          password: data.password,
          captchaToken,
        });
      }
    } catch (error) {
      authActionInFlightRef.current = false;
      turnstile.reset();

      if (parsed.kind === "email" && isEmailNotConfirmedError(error)) {
        prepareUnconfirmedEmailLogin(parsed.value, redirectTo);
        setPendingAction(null);
        navigate(AUTH_PATHS.signupConfirmation, {
          state: { email: parsed.value, redirectTo },
        });
        return;
      }

      const message = getAuthErrorMessage(
        error,
        "E-mail, usuário ou senha incorretos.",
      );
      setError("root.serverError", { type: "server", message });
      setError("password", {
        type: "server",
        message: "Confira seus dados e tente novamente.",
      });
      toast({
        title: "Não foi possível entrar",
        description: message,
        variant: "destructive",
      });
      setPendingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    if (
      sessionLoading ||
      user ||
      !googleAuthAvailable ||
      authActionInFlightRef.current
    ) {
      return;
    }
    authActionInFlightRef.current = true;
    setPendingAction("google");
    prepareGoogleLogin(redirectTo);
    try {
      await signInWithGoogle();
    } catch (error) {
      authActionInFlightRef.current = false;
      cancelGoogleLogin();
      toast({
        title: "Google indisponível",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      setPendingAction(null);
    }
  };

  const handleForgotPassword = () => {
    if (sessionLoading || user || authActionInFlightRef.current) return;
    const email =
      parsedIdentifier?.kind === "email" ? parsedIdentifier.value : null;
    navigate(buildPasswordResetRequestPath(email));
  };

  const isBusy =
    sessionLoading ||
    user !== null ||
    pendingAction !== null ||
    emailConfirmationSettling;
  const hasReturnContext = redirectTo !== "/";

  return (
    <>
      <Helmet>
        <title>Entrar | Achegue-se</title>
        <meta
          name="description"
          content="Entre por e-mail ou @usuário e continue de onde parou no Achegue-se."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="auth-concept-canvas min-h-[100dvh]">
        <AuthBrandHeader
          secondaryHref={AUTH_PATHS.signup}
          secondaryLabel="Criar conta"
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-3 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Sobre sua conta">
            <div className="max-w-[430px]">
              <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-primary">
                Seu lugar,<br />mais perto.
              </h1>
              <p className="mt-4 max-w-[340px] text-[17px] leading-6 text-foreground">
                Uma conta para participar e gerenciar seus perfis.
              </p>
              <img
                src="/auth/login-hero.webp"
                alt="Ilustração de um território conectado pela comunidade"
                className="mt-5 w-full max-w-[390px] object-cover"
              />
            </div>
          </section>

          <section className="w-full lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-7 lg:shadow-md">
            <div className="lg:hidden">
              <h1 className="max-w-[245px] font-heading text-[31px] font-extrabold leading-[1.04] tracking-[-0.045em] text-primary">
                Bom ter você por aqui.
              </h1>
              <p className="mt-1.5 text-[15px] leading-[21px] text-foreground">
                Entre para continuar sua conversa.
              </p>
            </div>

            <div className="hidden lg:block">
              <h2 className="font-heading text-[24px] font-extrabold tracking-[-0.035em] text-foreground">
                Entre na sua conta
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Depois de entrar, você volta ao que estava fazendo.
              </p>
            </div>

            {hasReturnContext ? (
              <div className="mt-4 flex min-h-[58px] items-center gap-3 rounded-xl bg-muted px-3.5 py-2.5 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <AuthConceptIcon name={returnContextIcon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">Você voltará para</p>
                  <p className="truncate text-[13px] font-bold text-foreground">
                    {returnContext.label}
                  </p>
                </div>
                <AuthConceptIcon name="chevron-right" className="h-4 w-4" />
              </div>
            ) : null}

            {showEmailConfirmationProgress ? (
              <div
                role="status"
                className="mt-4 flex items-start gap-3 rounded-xl bg-muted px-3.5 py-3 text-muted-foreground"
              >
                <span className="mt-0.5 h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-[12px] leading-4">
                  <strong>Confirmando seu e-mail…</strong>{" "}
                  Aguarde enquanto validamos o link.
                </p>
              </div>
            ) : null}

            {showEmailConfirmed || isPasswordReset ? (
              <div
                role="status"
                className="mt-4 flex items-start gap-3 rounded-xl bg-success/10 px-3.5 py-3 text-success"
              >
                <AuthConceptIcon name="check" />
                <p className="text-[12px] leading-4">
                  <strong>
                    {showEmailConfirmed ? "E-mail confirmado." : "Senha atualizada."}
                  </strong>{" "}
                  {showEmailConfirmed
                    ? "Continuando para seu primeiro acesso."
                    : "Entre para continuar."}
                </p>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit(onValid)}
              className="mt-5 space-y-3.5"
              noValidate
              aria-busy={isBusy}
            >
              {serverError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {serverError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label
                  htmlFor="login-identifier"
                  className="text-[14px] font-semibold text-foreground"
                >
                  E-mail ou @usuário
                </Label>
                <Input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={isBusy}
                  className={cn(
                    "h-11 rounded-lg border-input bg-card px-3 text-[16px] shadow-none",
                    errors.identifier && "border-destructive",
                  )}
                  aria-describedby={
                    errors.identifier ? "login-identifier-error" : undefined
                  }
                  {...register("identifier")}
                />
                <InlineFieldError
                  id="login-identifier-error"
                  message={errors.identifier?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-[14px] font-semibold text-foreground"
                >
                  Senha
                </Label>
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  disabled={isBusy}
                  invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  className="h-11 rounded-lg border-input bg-card text-[16px] shadow-none"
                  {...register("password")}
                />
                <InlineFieldError
                  id="login-password-error"
                  message={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isBusy}
                  className="ml-auto block min-h-8 rounded px-1 text-[12px] font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Esqueci minha senha
                </button>
              </div>

              {turnstile.enabled ? (
                <AuthTurnstileGate
                  action="login"
                  onVerify={turnstile.setToken}
                  onExpire={turnstile.reset}
                  onError={turnstile.reset}
                />
              ) : null}

              <button
                type="submit"
                disabled={isBusy || !turnstile.isReady}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-[15px] font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {pendingAction === "login" ? "Entrando…" : "Entrar"}
              </button>
            </form>

            {googleAuthAvailable ? (
              <>
                <div className="my-4 flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>ou</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isBusy}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card text-[14px] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55"
                >
                  <AuthConceptIcon name="google" />
                  {pendingAction === "google"
                    ? "Abrindo Google…"
                    : "Continuar com Google"}
                </button>
              </>
            ) : null}

            <p className="mt-4 text-center text-[12px] text-foreground">
              Ainda não tem conta?{" "}
              <Link
                to={buildSignupPath(redirectTo)}
                className="font-medium text-primary underline underline-offset-2"
              >
                Criar minha conta
              </Link>
            </p>

            <div className="my-4 h-px bg-border lg:hidden" />
            <Link
              to="/"
              className="flex min-h-10 items-center justify-between rounded-lg px-1 text-[13px] font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 lg:hidden"
            >
              <span>Continuar explorando sem conta</span>
              <AuthConceptIcon name="chevron-right" className="h-4 w-4" />
            </Link>

            <div className="mt-4 flex items-start gap-3 text-muted-foreground">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center text-primary lg:h-6 lg:w-6">
                <AuthConceptIcon name="shield-filled" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-foreground lg:hidden">
                  Verificação de segurança
                </p>
                <p className="text-[10.5px] leading-4 text-muted-foreground">
                  <span className="lg:hidden">
                    Seus dados são protegidos e criptografados.
                  </span>
                  <span className="hidden lg:inline">
                    Verificação de segurança quando solicitada.
                  </span>
                </p>
              </div>
            </div>

            <nav
              aria-label="Links legais"
              className="mt-3 hidden items-center justify-center gap-2 text-[11px] text-primary lg:flex"
            >
              <Link
                to={TERMS_OF_SERVICE_PATH}
                className="underline underline-offset-2"
              >
                Termos
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                to={PRIVACY_POLICY_PATH}
                className="underline underline-offset-2"
              >
                Privacidade
              </Link>
            </nav>
          </section>
        </main>

        <AuthFooter />
      </div>
    </>
  );
}
