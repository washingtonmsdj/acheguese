import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AtSign,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import {
  AuthTurnstileGate,
  useAuthTurnstile,
} from "@/app/components/auth/AuthTurnstileGate";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { parseAuthIdentifier } from "@/core/auth/utils/authIdentifier";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { clearPendingSignupEmail } from "@/core/auth/utils/pendingSignup";
import { Button } from "@/shared/components/ui/button";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";
import { cn } from "@/shared/utils/cn";
import {
  LoginIdentifierSchema,
  type LoginIdentifierInput,
} from "@/shared/validation/schemas/user.schema";

type PendingAction = "login" | "recovery" | "google" | null;
type LoginLocationState = { redirectTo?: unknown } | null;

export default function LoginPage() {
  const {
    user,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    resetPasswordByIdentifier,
    googleAuthAvailable,
  } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const turnstile = useAuthTurnstile();

  const redirectTo = useMemo(() => {
    const stateRedirect = (location.state as LoginLocationState)?.redirectTo;
    return resolveSafeInternalPath(stateRedirect ?? searchParams.get("redirect"), "/");
  }, [location.state, searchParams]);

  const isEmailConfirmed = searchParams.get("confirmed") === "1";
  const isPasswordReset = searchParams.get("passwordReset") === "1";

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

  const serverError = (errors as { root?: { serverError?: { message?: string } } })
    .root?.serverError?.message;

  const identifierValue = watch("identifier") ?? "";
  const parsedIdentifier = parseAuthIdentifier(identifierValue);
  const isUsername = parsedIdentifier?.kind === "username";
  const loginHighlights = [
    "Perfil, conta e módulos no mesmo acesso.",
    "Entrada por e-mail ou @usuário.",
    "Recuperação por e-mail cadastrado.",
  ] as const;

  const statusMessage = useMemo(() => {
    if (isEmailConfirmed) {
      return {
        icon: CheckCircle2,
        title: "E-mail confirmado",
        description: "Sua conta está pronta para login.",
      };
    }

    if (isPasswordReset) {
      return {
        icon: ShieldCheck,
        title: "Senha atualizada",
        description: "Entre com a nova senha para continuar.",
      };
    }

    return null;
  }, [isEmailConfirmed, isPasswordReset]);

  const StatusIcon = statusMessage?.icon;

  useEffect(() => {
    if (isEmailConfirmed) {
      clearPendingSignupEmail();
    }
  }, [isEmailConfirmed]);

  useEffect(() => {
    if (!user) return;
    clearPendingSignupEmail();
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);

  const onValid = async (data: LoginIdentifierInput) => {
    const parsed = parseAuthIdentifier(data.identifier);
    if (!parsed) return;
    if (!turnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Complete o desafio de segurança para continuar.",
        variant: "destructive",
      });
      return;
    }

    clearErrors("root.serverError");
    setPendingAction("login");

    try {
      if (parsed.kind === "username") {
        await signInWithUsername({ username: parsed.value, password: data.password });
        return;
      }

      await signIn({ email: parsed.value, password: data.password });
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        "Verifique suas credenciais e tente novamente.",
      );
      const raw =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

      if (/invalid login credentials|incorretos|not found|invalid/i.test(raw)) {
        setError("password", { type: "server", message });
      } else if (/email|e-?mail|usu[aá]rio|username/i.test(raw)) {
        setError("identifier", { type: "server", message });
      }
      setError("root.serverError", { type: "server", message });

      toast({
        title: "Erro ao entrar",
        description: message,
        variant: "destructive",
      });
      setPendingAction(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!parsedIdentifier) {
      toast({
        title: "Informe o e-mail",
        description: "Usamos o e-mail cadastrado para enviar a recuperação de senha.",
        variant: "destructive",
      });
      return;
    }

    if (parsedIdentifier.kind !== "email") {
      toast({
        title: "Informe o e-mail cadastrado",
        description: "A recuperação de senha não resolve @usuário por segurança.",
        variant: "destructive",
      });
      return;
    }

    setPendingAction("recovery");

    try {
      await resetPasswordByIdentifier(parsedIdentifier.raw);
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    } catch {
      toast({
        title: "Solicitação recebida",
        description:
          "Se o identificador estiver cadastrado, você receberá as instruções de recuperação em instantes.",
      });
    } finally {
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

  const isBusy = pendingAction !== null;

  return (
    <>
      <Helmet>
        <title>Entrar | Achegue-se</title>
        <meta
          name="description"
          content="Entre na sua conta Achegue-se para acessar seu perfil, seus negócios e a sua comunidade."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AuthBrandHeader secondaryHref="/cadastro" secondaryLabel="Criar conta" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-start justify-center px-4 pb-28 pt-5 focus:outline-none sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:pb-10 sm:pt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-center lg:gap-10"
        >
          <section className="hidden lg:block">
            <div className="max-w-xl space-y-5">
              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                  Acesso unificado
                </p>
                <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
                  Entre e continue do ponto certo.
                </h1>
                <p className="max-w-lg text-base leading-7 text-muted-foreground">
                  O login precisa ser direto no mobile e claro no desktop. Esta tela concentra
                  conta, identidade e entrada na comunidade sem ruído visual.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {loginHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-card/78 p-5 shadow-[0_32px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8">
            <div className="space-y-6">
              <div className="space-y-3 text-center sm:space-y-4">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                    Acesso da conta
                  </p>
                  <h1 className="font-heading text-2xl font-bold text-foreground sm:text-[2rem]">
                    Bem-vindo de volta
                  </h1>
                <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                    Entre para acessar seu perfil, seus negócios e a sua comunidade.
                  </p>
                </div>
              </div>

              {statusMessage ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
                  <div className="flex items-start gap-3">
                    {StatusIcon ? <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{statusMessage.title}</p>
                      <p className="text-xs text-muted-foreground">{statusMessage.description}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {googleAuthAvailable ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full gap-2 border-border/80 bg-background/60"
                    onClick={handleGoogleLogin}
                    disabled={isBusy}
                  >
                    {pendingAction === "google" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    Entrar com Google
                  </Button>
                </div>
              ) : null}

              {googleAuthAvailable ? (
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <Separator className="flex-1" />
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit(onValid)}
                className="space-y-4"
                noValidate
                aria-busy={isBusy}
              >
                {serverError ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    {serverError}
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="login-identifier">E-mail ou nome de usuário</Label>
                  <p className="-mt-0.5 text-xs text-muted-foreground">
                    Use o mesmo identificador que você usa no perfil público.
                  </p>
                  <div className="relative">
                    <Input
                      id="login-identifier"
                      type="text"
                      placeholder="seu@email.com ou @seunome"
                      className={cn("h-11 pr-10", errors.identifier && "border-destructive")}
                      autoComplete="username"
                      autoCapitalize="none"
                      disabled={isBusy}
                      aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
                      {...register("identifier")}
                    />
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {isUsername ? <AtSign className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                  </div>
                  <InlineFieldError id="login-identifier-error" message={errors.identifier?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Senha</Label>
                  <PasswordInput
                    id="login-password"
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    disabled={isBusy}
                    invalid={Boolean(errors.password)}
                    showStrength
                    showRequirements={false}
                    strengthValue={watch("password") ?? ""}
                    aria-describedby={errors.password ? "login-password-error" : undefined}
                    {...register("password")}
                  />
                  <InlineFieldError id="login-password-error" message={errors.password?.message} />
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="ml-auto block text-xs font-medium text-primary hover:underline"
                    disabled={pendingAction === "recovery"}
                  >
                    {pendingAction === "recovery" ? "Enviando recuperação..." : "Esqueci minha senha"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    A recuperação é enviada para o e-mail cadastrado.
                  </p>
                </div>

                {turnstile.enabled ? (
                  <AuthTurnstileGate
                    action="login"
                    onVerify={(token) => turnstile.setToken(token)}
                    onExpire={turnstile.reset}
                    onError={turnstile.reset}
                  />
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  disabled={isBusy || !turnstile.isReady}
                >
                  {pendingAction === "login" ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-1.5 h-4 w-4" />
                  )}
                  Entrar
                </Button>
              </form>


              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">Não tem conta?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-1.5 border-primary/30 font-semibold text-primary hover:bg-primary/10"
                  onClick={() => navigate("/cadastro")}
                >
                  Criar conta grátis
                </Button>
              </div>
            </div>
          </div>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
