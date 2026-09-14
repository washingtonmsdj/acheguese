import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/core/auth/hooks/useAuth";
import { parseAuthIdentifier } from "@/core/auth/utils/authIdentifier";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import {
  clearPendingSignupContext,
  getPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
    user,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    googleAuthAvailable,
  } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const turnstile = useAuthTurnstile();

  const isEmailConfirmed = searchParams.get("confirmed") === "1";
  const isPasswordReset = searchParams.get("passwordReset") === "1";

  const redirectTo = useMemo(() => {
    const stateRedirect = (location.state as LoginLocationState)?.redirectTo;
    const queryRedirect = searchParams.get("redirect");
    const pendingSignupRedirect = isEmailConfirmed ? getPendingSignupRedirect() : null;
    return resolveSafeInternalPath(
      stateRedirect ?? queryRedirect ?? pendingSignupRedirect,
      "/",
    );
  }, [isEmailConfirmed, location.state, searchParams]);

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
    if (!user) return;

    if (isEmailConfirmed) {
      navigate("/cadastro/primeiro-acesso", { replace: true });
      return;
    }

    clearPendingSignupContext();
    navigate(redirectTo, { replace: true });
  }, [isEmailConfirmed, navigate, redirectTo, user]);

  const onValid = async (data: LoginIdentifierInput) => {
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

    clearErrors("root.serverError");
    setPendingAction("login");

    try {
      if (parsed.kind === "username") {
        await signInWithUsername({ username: parsed.value, password: data.password });
      } else {
        await signIn({ email: parsed.value, password: data.password });
      }
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        "E-mail, usuário ou senha incorretos.",
      );
      setError("root.serverError", { type: "server", message });
      setError("password", { type: "server", message: "Confira seus dados e tente novamente." });
      toast({ title: "Não foi possível entrar", description: message, variant: "destructive" });
      setPendingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    setPendingAction("google");
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Google indisponível",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      setPendingAction(null);
    }
  };

  const handleForgotPassword = () => {
    const email = parsedIdentifier?.kind === "email" ? parsedIdentifier.value : "";
    const query = new URLSearchParams({ mode: "request" });
    if (email) query.set("email", email);
    navigate(`/reset-password?${query.toString()}`);
  };

  const isBusy = pendingAction !== null;
  const hasReturnContext = redirectTo !== "/";

  return (
    <>
      <Helmet>
        <title>Entrar | Achegue-se</title>
        <meta
          name="description"
          content="Entre por e-mail ou @usuário e continue de onde parou no Achegue-se."
        />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33] lg:bg-[radial-gradient(circle_at_16%_32%,rgba(216,234,224,.55),transparent_31%),radial-gradient(circle_at_70%_18%,rgba(255,236,185,.28),transparent_30%),#fffdfa]">
        <AuthBrandHeader secondaryHref="/cadastro" secondaryLabel="Criar conta" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-3 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Sobre sua conta">
            <div className="max-w-[430px]">
              <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-[#0b3b3f]">
                Seu lugar,<br />mais perto.
              </h1>
              <p className="mt-4 max-w-[340px] text-[17px] leading-6 text-[#244448]">
                Uma conta para participar e gerenciar seus perfis.
              </p>
              <img
                src="/auth/login-hero.webp"
                alt="Ilustração de um território conectado pela comunidade"
                className="mt-5 w-full max-w-[390px] object-cover"
              />
            </div>
          </section>

          <section className="w-full lg:rounded-[10px] lg:bg-white lg:p-7 lg:shadow-[0_18px_55px_rgba(17,55,59,.08)]">
            <div className="lg:hidden">
              <h1 className="max-w-[280px] font-heading text-[31px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#0b3b3f]">
                Bom ter você por aqui.
              </h1>
              <p className="mt-1.5 text-[15px] leading-[21px] text-[#263f43]">
                Entre para continuar sua conversa.
              </p>
            </div>

            <div className="hidden lg:block">
              <h2 className="font-heading text-[24px] font-extrabold tracking-[-0.035em] text-[#102f33]">
                Entre na sua conta
              </h2>
              <p className="mt-1 text-sm text-[#607477]">Depois de entrar, você volta à conversa.</p>
            </div>

            {hasReturnContext ? (
              <div className="mt-4 flex min-h-[58px] items-center gap-3 rounded-xl bg-[#f3f1ea] px-3.5 py-2.5 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e1ece9] text-[#0b5b59]">
                  <AuthConceptIcon name="store" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#607477]">Você voltará para</p>
                  <p className="truncate text-[13px] font-bold text-[#18383c]">onde parou</p>
                </div>
                <span aria-hidden="true" className="text-xl">›</span>
              </div>
            ) : null}

            {(isEmailConfirmed || isPasswordReset) ? (
              <div role="status" className="mt-4 flex items-start gap-3 rounded-xl bg-[#eaf7ef] px-3.5 py-3 text-[#155c43]">
                <AuthConceptIcon name="check" />
                <p className="text-[12px] leading-4">
                  <strong>{isEmailConfirmed ? "E-mail confirmado." : "Senha atualizada."}</strong>{" "}
                  Entre para continuar.
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
                <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="login-identifier" className="text-[14px] font-semibold text-[#15383c]">
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
                    "h-11 rounded-lg border-[#b9c5c6] bg-white px-3 text-[16px] shadow-none",
                    errors.identifier && "border-destructive",
                  )}
                  aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
                  {...register("identifier")}
                />
                <InlineFieldError id="login-identifier-error" message={errors.identifier?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-[14px] font-semibold text-[#15383c]">Senha</Label>
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  disabled={isBusy}
                  invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className="h-11 rounded-lg border-[#b9c5c6] bg-white text-[16px] shadow-none"
                  {...register("password")}
                />
                <InlineFieldError id="login-password-error" message={errors.password?.message} />
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="ml-auto block min-h-8 rounded px-1 text-[12px] font-medium text-[#0b4e52] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
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
                className="flex h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] px-4 text-[15px] font-extrabold text-[#102f33] shadow-[0_3px_10px_rgba(226,171,0,.16)] transition-colors hover:bg-[#f7bf00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {pendingAction === "login" ? "Entrando…" : "Entrar"}
              </button>
            </form>

            {googleAuthAvailable ? (
              <>
                <div className="my-4 flex items-center gap-3 text-[12px] text-[#607477]">
                  <span className="h-px flex-1 bg-[#c7d0d0]" />
                  <span>ou</span>
                  <span className="h-px flex-1 bg-[#c7d0d0]" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isBusy}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-[9px] border border-[#8da1a3] bg-white text-[14px] font-bold text-[#17363a] transition-colors hover:bg-[#f7f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 disabled:opacity-55"
                >
                  <AuthConceptIcon name="google" />
                  {pendingAction === "google" ? "Abrindo Google…" : "Continuar com Google"}
                </button>
              </>
            ) : null}

            <p className="mt-4 text-center text-[12px] text-[#244448]">
              Ainda não tem conta?{" "}
              <Link
                to={redirectTo === "/" ? "/cadastro" : `/cadastro?redirect=${encodeURIComponent(redirectTo)}`}
                className="font-medium underline underline-offset-2"
              >
                Criar minha conta
              </Link>
            </p>

            <div className="my-4 h-px bg-[#d4d8d5] lg:hidden" />
            <Link
              to="/"
              className="flex min-h-10 items-center justify-between rounded-lg px-1 text-[13px] font-medium text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 lg:hidden"
            >
              <span>Continuar explorando sem conta</span>
              <span aria-hidden="true" className="text-xl">›</span>
            </Link>

            <div className="mt-4 flex items-start gap-3 text-[#35575a]">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6efed] text-[#0b5b59] lg:h-6 lg:w-6 lg:bg-transparent">
                <AuthConceptIcon name="shield" />
              </span>
              <div>
                <p className="text-[11px] font-semibold lg:hidden">Verificação de segurança</p>
                <p className="text-[10.5px] leading-4 text-[#607477]">
                  <span className="lg:hidden">Seus dados são protegidos e criptografados.</span>
                  <span className="hidden lg:inline">Verificação de segurança quando solicitada.</span>
                </p>
              </div>
            </div>

            <nav aria-label="Links legais" className="mt-3 hidden items-center justify-center gap-2 text-[11px] text-[#0b4e52] lg:flex">
              <Link to={TERMS_OF_SERVICE_PATH} className="underline underline-offset-2">Termos</Link>
              <span aria-hidden="true">·</span>
              <Link to={PRIVACY_POLICY_PATH} className="underline underline-offset-2">Privacidade</Link>
            </nav>
          </section>
        </main>

        <AuthFooter />
      </div>
    </>
  );
}
