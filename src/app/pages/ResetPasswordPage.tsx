import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

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
  buildPasswordResetSuccessLoginPath,
} from "@/core/auth/constants/authFlow";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthCallbackError } from "@/core/auth/utils/authCallback";
import {
  getPasswordRecoveryResendRemainingMs,
  startPasswordRecoveryResendCooldown,
} from "@/core/auth/utils/authJourney";
import {
  getAuthErrorMessage,
  isAuthRateLimitError,
  isRecoverySessionDisposalError,
} from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { AUTH_BROWSER_STORAGE_CONFIG } from "@/shared/config/security.config";
import {
  PRIVACY_POLICY_PATH,
  SUPPORT_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { getPasswordConceptRequirementStatus } from "@/shared/validation/passwordPolicy";
import {
  ResetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@/shared/validation/schemas/user.schema";

type RecoveryView =
  | "request"
  | "sent"
  | "checking"
  | "reset"
  | "dispose-error"
  | "success"
  | "invalid";

function getRecoveryCooldownSeconds(email: string): number {
  return Math.ceil(getPasswordRecoveryResendRemainingMs(email) / 1000);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { resetPasswordByIdentifier } = useAuth();
  const requestTurnstile = useAuthTurnstile();
  const recoveryRequestInFlight = useRef(false);
  const passwordSaveInFlight = useRef(false);
  const recoverySessionDisposalInFlight = useRef(false);

  const initialMode = searchParams.get(AUTH_QUERY_KEYS.mode);
  const initialEmail = searchParams.get(AUTH_QUERY_KEYS.email) ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [view, setView] = useState<RecoveryView>(() => {
    if (
      searchParams.get(AUTH_QUERY_KEYS.expired) === AUTH_QUERY_VALUES.enabled
    ) {
      return "invalid";
    }
    if (initialMode === AUTH_QUERY_VALUES.recovery) return "checking";
    return "request";
  });
  const [sending, setSending] = useState(false);
  const [disposingRecoverySession, setDisposingRecoverySession] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(() =>
    getRecoveryCooldownSeconds(initialEmail),
  );

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onBlur",
  });
  const newPassword = form.watch("newPassword") ?? "";
  const requirements = useMemo(
    () => getPasswordConceptRequirementStatus(newPassword),
    [newPassword],
  );

  useEffect(() => {
    const syncCooldown = () =>
      setResendCooldown(getRecoveryCooldownSeconds(email));
    syncCooldown();
    const timer = window.setInterval(syncCooldown, 1000);
    return () => window.clearInterval(timer);
  }, [email]);

  useEffect(() => {
    if (view !== "checking") return;

    if (getAuthCallbackError(location.search, location.hash)) {
      setView("invalid");
      return;
    }

    // PASSWORD_RECOVERY + replay de claims verificados são a única autoridade
    // para liberar a mutação. Query, hash, user persistido e tokens presentes
    // na URL jamais promovem a tela para "reset" por conta própria.
    const unsubscribe = AuthService.onPasswordRecovery(() => setView("reset"));
    const timeout = window.setTimeout(() => {
      setView((current) => (current === "checking" ? "invalid" : current));
    }, AUTH_BROWSER_STORAGE_CONFIG.recoveryEventTimeoutMs);

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [location.hash, location.search, view]);

  const sendRecovery = async (nextView: "sent" = "sent") => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }

    if (recoveryRequestInFlight.current) return;
    const remainingMs = getPasswordRecoveryResendRemainingMs(normalizedEmail);
    if (remainingMs > 0) {
      setResendCooldown(Math.ceil(remainingMs / 1000));
      return;
    }
    if (!requestTurnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    recoveryRequestInFlight.current = true;
    setSending(true);
    try {
      await resetPasswordByIdentifier(
        normalizedEmail,
        requestTurnstile.token ?? undefined,
      );
      setEmail(normalizedEmail);
      setView(nextView);
      startPasswordRecoveryResendCooldown(normalizedEmail);
      setResendCooldown(getRecoveryCooldownSeconds(normalizedEmail));
    } catch (error) {
      if (isAuthRateLimitError(error)) {
        // O Auth é autoritativo. Espelhamos a janela apenas para evitar cliques
        // repetidos e reload como bypass visual enquanto o servidor limita.
        startPasswordRecoveryResendCooldown(normalizedEmail);
        setResendCooldown(getRecoveryCooldownSeconds(normalizedEmail));
      }
      toast({
        title: "Não foi possível enviar agora",
        description: getAuthErrorMessage(
          error,
          "Confira sua conexão e tente novamente.",
        ),
        variant: "destructive",
      });
    } finally {
      requestTurnstile.reset();
      recoveryRequestInFlight.current = false;
      setSending(false);
    }
  };

  const saveNewPassword = form.handleSubmit(async (data) => {
    if (view !== "reset" || passwordSaveInFlight.current) return;
    passwordSaveInFlight.current = true;
    try {
      const compromise = await checkPasswordCompromise(data.newPassword);
      if (compromise.blocked) {
        form.setError("newPassword", {
          type: "compromised",
          message: compromise.message,
        });
        return;
      }
      await AuthService.updateRecoveredPassword(data.newPassword);
      setView("success");
    } catch (error) {
      if (isRecoverySessionDisposalError(error)) {
        setView("dispose-error");
        return;
      }
      toast({
        title: "Não foi possível salvar a nova senha",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      passwordSaveInFlight.current = false;
    }
  });

  const retryRecoverySessionDisposal = async () => {
    if (recoverySessionDisposalInFlight.current) return;
    recoverySessionDisposalInFlight.current = true;
    setDisposingRecoverySession(true);
    try {
      await AuthService.signOut();
      setView("success");
    } catch {
      toast({
        title: "Ainda não foi possível encerrar a sessão temporária",
        description:
          "Não repita a troca de senha. Tente encerrar a sessão novamente antes de entrar com a nova senha.",
        variant: "destructive",
      });
    } finally {
      recoverySessionDisposalInFlight.current = false;
      setDisposingRecoverySession(false);
    }
  };

  const title =
    view === "request"
      ? "Recuperar acesso"
      : view === "sent"
        ? "Confira seu e-mail"
        : view === "reset"
          ? "Nova senha"
          : view === "dispose-error"
            ? "Finalizar recuperação"
            : view === "success"
              ? "Senha atualizada"
              : view === "invalid"
                ? "Link expirado"
                : "Validando link";

  const requestGate = requestTurnstile.enabled ? (
    <AuthTurnstileGate
      action="password_reset"
      onVerify={requestTurnstile.setToken}
      onExpire={requestTurnstile.reset}
      onError={requestTurnstile.reset}
    />
  ) : null;

  return (
    <>
      <Helmet>
        <title>{title} | Achegue-se</title>
        <meta
          name="description"
          content="Recupere o acesso à sua conta Achegue-se com segurança."
        />
      </Helmet>

      <div className="auth-concept-canvas min-h-[100dvh]">
        <AuthBrandHeader
          secondaryHref={AUTH_PATHS.login}
          secondaryLabel="Entrar"
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-5 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Recuperar acesso">
            <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-primary">
              Vamos ajudar<br />você a voltar.
            </h1>
            <p className="mt-4 max-w-[350px] text-[17px] leading-6 text-foreground">
              Use o e-mail cadastrado, mesmo que entre com @usuário.
            </p>
            <img
              src="/auth/recovery-hero.webp"
              alt="Ilustração de um território e placas de orientação"
              className="mt-5 w-full max-w-[390px] object-cover"
            />
          </section>

          <section className="w-full lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-7 lg:shadow-md">
            {view === "request" ? (
              <div>
                <h1 className="font-heading text-[31px] font-extrabold leading-[1.05] tracking-[-0.045em] text-foreground lg:text-[24px]">
                  <span className="lg:hidden">
                    Vamos recuperar<br />seu acesso.
                  </span>
                  <span className="hidden lg:inline">E-mail cadastrado</span>
                </h1>
                <p className="mt-2 text-[14px] leading-5 text-muted-foreground lg:hidden">
                  Informe o e-mail usado na sua conta.
                </p>

                <div className="mt-6 space-y-2 lg:mt-7">
                  <Label
                    htmlFor="recovery-email"
                    className="text-[14px] font-semibold text-foreground"
                  >
                    E-mail
                  </Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void sendRecovery();
                      }
                    }}
                    className="h-11 rounded-lg border-input bg-card px-3 text-[16px] shadow-none"
                  />
                  <p className="text-[11px] leading-4 text-muted-foreground lg:hidden">
                    A recuperação é feita por e-mail, mesmo quando você entra com
                    @usuário.
                  </p>
                </div>

                {requestTurnstile.enabled ? (
                  <div className="mt-4">{requestGate}</div>
                ) : (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted px-4 py-3 lg:hidden">
                    <AuthConceptIcon name="shield" className="text-primary" />
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">
                        Verificação de segurança
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Conclua quando solicitada.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void sendRecovery()}
                  disabled={
                    sending ||
                    resendCooldown > 0 ||
                    !requestTurnstile.isReady
                  }
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-[14px] font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-55"
                >
                  {sending
                    ? "Enviando…"
                    : resendCooldown > 0
                      ? `Aguarde ${resendCooldown}s`
                      : "Enviar link de recuperação"}
                </button>

                <p className="mt-4 hidden text-center text-[11px] leading-4 text-muted-foreground lg:block">
                  Se houver uma conta associada, enviaremos as instruções.
                </p>

                <button
                  type="button"
                  onClick={() => navigate(AUTH_PATHS.login)}
                  className="mx-auto mt-4 block min-h-10 rounded px-2 text-[13px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 lg:hidden"
                >
                  Voltar para entrar
                </button>

                <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted px-4 py-3 lg:hidden">
                  <AuthConceptIcon name="help" className="text-primary" />
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    Não consegue acessar esse e-mail?<br />
                    <Link
                      to={SUPPORT_PATH}
                      className="font-medium text-primary underline underline-offset-2"
                    >
                      Preciso de ajuda
                    </Link>
                  </p>
                </div>

                <div className="my-5 hidden h-px bg-border lg:block" />
                <div className="hidden space-y-2 text-center text-[12px] text-primary lg:block">
                  <button
                    type="button"
                    onClick={() => navigate(AUTH_PATHS.login)}
                    className="rounded px-2 py-1 underline underline-offset-2"
                  >
                    Voltar para entrar
                  </button>
                  <div>
                    <Link
                      to={SUPPORT_PATH}
                      className="rounded px-2 py-1 underline underline-offset-2"
                    >
                      Não tenho acesso ao e-mail
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {view === "sent" ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span style={{ transform: "scale(1.55)" }}>
                    <AuthConceptIcon name="mail" />
                  </span>
                </div>
                <h1 className="mt-4 font-heading text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground">
                  Confira sua caixa<br />de entrada
                </h1>
                <p className="mx-auto mt-3 max-w-[310px] text-[13px] leading-5 text-muted-foreground">
                  Se houver uma conta associada a esse e-mail, você receberá as
                  instruções de recuperação.
                </p>

                <div className="mt-5 rounded-xl bg-muted p-3 text-left">
                  <p className="text-[11px] text-muted-foreground">E-mail informado</p>
                  <p className="mt-0.5 break-all text-[14px] font-medium text-foreground">
                    {email}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-info/10 p-3 text-left text-[11px] text-muted-foreground">
                  <AuthConceptIcon name="info" className="text-info" />
                  <span>Confira também o spam.</span>
                </div>

                {requestTurnstile.enabled ? (
                  <div className="mt-4">{requestGate}</div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void sendRecovery()}
                  disabled={
                    sending ||
                    resendCooldown > 0 ||
                    !requestTurnstile.isReady
                  }
                  className="mt-5 h-11 w-full rounded-lg border border-border bg-card text-[14px] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55"
                >
                  {sending
                    ? "Enviando…"
                    : resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : "Reenviar link"}
                </button>
                <p className="mt-2 text-[10.5px] text-muted-foreground">
                  O reenvio pode exigir uma breve espera.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setView("request");
                    setEmail("");
                    setResendCooldown(0);
                  }}
                  className="mt-4 min-h-10 rounded px-2 text-[13px] font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  Usar outro e-mail
                </button>
                <div className="my-4 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => navigate(AUTH_PATHS.login)}
                  className="min-h-10 rounded px-2 text-[13px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  Voltar para entrar
                </button>
              </div>
            ) : null}

            {view === "checking" ? (
              <div role="status" className="py-16 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
                <h1 className="font-heading text-xl font-bold text-foreground">
                  Validando seu link…
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aguarde enquanto confirmamos a recuperação.
                </p>
              </div>
            ) : null}

            {view === "reset" ? (
              <form onSubmit={saveNewPassword} noValidate>
                <h1 className="font-heading text-[25px] font-extrabold leading-tight tracking-[-0.035em] text-foreground">
                  Escolha uma nova senha
                </h1>
                <div className="mt-3 space-y-1.5">
                  <Label
                    htmlFor="new-password"
                    className="text-[13px] font-semibold text-foreground"
                  >
                    Nova senha
                  </Label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    invalid={Boolean(form.formState.errors.newPassword)}
                    className="h-11 rounded-lg border-input bg-card shadow-none"
                    aria-describedby={
                      form.formState.errors.newPassword
                        ? "new-password-error"
                        : undefined
                    }
                    {...form.register("newPassword")}
                  />
                  <InlineFieldError
                    id="new-password-error"
                    message={form.formState.errors.newPassword?.message}
                  />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label
                    htmlFor="confirm-new-password"
                    className="text-[13px] font-semibold text-foreground"
                  >
                    Confirmar nova senha
                  </Label>
                  <PasswordInput
                    id="confirm-new-password"
                    autoComplete="new-password"
                    invalid={Boolean(form.formState.errors.confirmNewPassword)}
                    className="h-11 rounded-lg border-input bg-card shadow-none"
                    aria-describedby={
                      form.formState.errors.confirmNewPassword
                        ? "confirm-password-error"
                        : undefined
                    }
                    {...form.register("confirmNewPassword")}
                  />
                  <InlineFieldError
                    id="confirm-password-error"
                    message={form.formState.errors.confirmNewPassword?.message}
                  />
                </div>

                <p className="mt-3 text-[12px] font-semibold text-foreground">
                  Sua senha deve conter:
                </p>
                <ul className="mt-2 space-y-1">
                  {requirements.map((requirement) => (
                    <li
                      key={requirement.id}
                      className={`flex items-center gap-2 text-[11px] ${
                        requirement.satisfied
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          requirement.satisfied ? "bg-success" : "bg-border"
                        }`}
                      />
                      {requirement.label}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted px-4 py-3 text-[11px] leading-4 text-muted-foreground">
                  <AuthConceptIcon name="lightbulb" className="text-primary" />
                  <span>
                    Use uma senha que você não utiliza em outros serviços.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="mt-4 h-11 w-full rounded-lg bg-primary text-[14px] font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-55"
                >
                  {form.formState.isSubmitting
                    ? "Salvando…"
                    : "Salvar nova senha"}
                </button>

                <nav
                  aria-label="Links legais"
                  className="mt-4 text-center text-[10.5px] leading-4 text-muted-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mx-auto mb-3 block h-px w-8 bg-border"
                  />
                  <Link
                    to={TERMS_OF_SERVICE_PATH}
                    className="underline underline-offset-2"
                  >
                    Termos de Uso
                  </Link>
                  <span aria-hidden="true"> · </span>
                  <Link
                    to={PRIVACY_POLICY_PATH}
                    className="underline underline-offset-2"
                  >
                    Política de Privacidade
                  </Link>
                </nav>
              </form>
            ) : null}

            {view === "dispose-error" ? (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AuthConceptIcon name="warning" />
                  </span>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Senha atualizada</p>
                    <h1 className="mt-1 font-heading text-[18px] font-extrabold text-foreground">
                      Falta encerrar a sessão temporária.
                    </h1>
                    <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                      Sua nova senha já foi salva. Por segurança, não repita a troca de senha: tente apenas encerrar esta sessão de recuperação.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void retryRecoverySessionDisposal()}
                  disabled={disposingRecoverySession}
                  className="mt-4 h-11 w-full rounded-lg bg-primary text-[14px] font-extrabold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-55"
                >
                  {disposingRecoverySession
                    ? "Encerrando sessão…"
                    : "Tentar encerrar sessão"}
                </button>
                <Link
                  to={SUPPORT_PATH}
                  className="mx-auto mt-3 flex min-h-9 w-fit items-center gap-2 rounded px-2 text-[11px] text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <AuthConceptIcon name="help" />
                  Preciso de ajuda
                </Link>
              </div>
            ) : null}

            {view === "success" ? (
              <div className="rounded-xl bg-success/10 p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-success-foreground">
                    <AuthConceptIcon name="check" />
                  </span>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Após salvar</p>
                    <h1 className="mt-2 font-heading text-[18px] font-extrabold text-foreground">
                      Senha atualizada.
                    </h1>
                    <p className="text-[12px] text-muted-foreground">
                      Entre com a nova senha.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(buildPasswordResetSuccessLoginPath(), {
                      replace: true,
                    })
                  }
                  className="mt-4 h-11 w-full rounded-lg bg-primary text-[14px] font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Ir para entrar
                </button>
              </div>
            ) : null}

            {view === "invalid" ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <span style={{ transform: "scale(1.55)" }}>
                    <AuthConceptIcon name="warning" />
                  </span>
                </div>
                <h1 className="mt-5 font-heading text-[27px] font-extrabold leading-[1.06] tracking-[-0.04em] text-foreground">
                  Este link não está<br />mais disponível.
                </h1>
                <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
                  Ele pode ter expirado ou já ter sido usado.
                  <br />Solicite um novo link.
                </p>

                <div className="mt-6 space-y-1.5 text-left">
                  <Label
                    htmlFor="expired-email"
                    className="text-[13px] font-semibold text-foreground"
                  >
                    E-mail
                  </Label>
                  <Input
                    id="expired-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-lg border-input bg-card shadow-none"
                  />
                </div>
                {requestTurnstile.enabled ? (
                  <div className="mt-4 text-left">{requestGate}</div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void sendRecovery()}
                  disabled={
                    sending ||
                    resendCooldown > 0 ||
                    !requestTurnstile.isReady
                  }
                  className="mt-4 h-11 w-full rounded-lg bg-primary text-[14px] font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-55"
                >
                  {sending
                    ? "Enviando…"
                    : resendCooldown > 0
                      ? `Aguarde ${resendCooldown}s`
                      : "Enviar novo link"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(AUTH_PATHS.login)}
                  className="mx-auto mt-4 block min-h-10 rounded px-2 text-[13px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  Voltar para entrar
                </button>
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-info/10 p-4 text-left text-[11px] leading-5 text-muted-foreground">
                  <AuthConceptIcon name="info" className="text-info" />
                  <p>
                    Sua senha não foi alterada por este link.
                    <br />
                    <Link
                      to={SUPPORT_PATH}
                      className="font-medium text-primary underline underline-offset-2"
                    >
                      Preciso de ajuda
                    </Link>
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
