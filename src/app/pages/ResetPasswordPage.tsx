import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate } from "@/app/components/auth/AuthTurnstileGate";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
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

type RecoveryView = "request" | "sent" | "checking" | "reset" | "success" | "invalid";
const RESEND_SECONDS = 60;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, updatePassword, resetPasswordByIdentifier } = useAuth();
  const requestTurnstile = useAuthTurnstile();

  const initialMode = searchParams.get("mode");
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [view, setView] = useState<RecoveryView>(() => {
    if (searchParams.get("expired") === "1") return "invalid";
    if (initialMode === "recovery") return "checking";
    return "request";
  });
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (view !== "checking") return;

    const hashError = AuthService.getAuthHashError();
    if (hashError) {
      setView("invalid");
      return;
    }

    const hash = AuthService.captureAuthHash();
    const hasRecoveryMarker =
      searchParams.get("code") !== null ||
      searchParams.get("type") === "recovery" ||
      hash.get("type") === "recovery" ||
      hash.get("access_token") !== null;

    if (user && hasRecoveryMarker) {
      setView("reset");
      return;
    }

    const unsubscribe = AuthService.onPasswordRecovery(() => setView("reset"));
    const timeout = window.setTimeout(() => {
      setView((current) => (current === "checking" ? "invalid" : current));
    }, AUTH_BROWSER_STORAGE_CONFIG.recoveryEventTimeoutMs);

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [searchParams, user, view]);

  const sendRecovery = async (nextView: "sent" = "sent") => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }
    if (sending || resendCooldown > 0) return;
    if (!requestTurnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await resetPasswordByIdentifier(normalizedEmail);
      setEmail(normalizedEmail);
      setView(nextView);
      setResendCooldown(RESEND_SECONDS);
      requestTurnstile.reset();
    } catch (error) {
      toast({
        title: "Não foi possível enviar agora",
        description: getAuthErrorMessage(error, "Confira sua conexão e tente novamente."),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const saveNewPassword = form.handleSubmit(async (data) => {
    if (view !== "reset") return;
    try {
      const compromise = await checkPasswordCompromise(data.newPassword);
      if (compromise.blocked) {
        form.setError("newPassword", { type: "compromised", message: compromise.message });
        return;
      }
      await updatePassword(data.newPassword);
      setView("success");
    } catch (error) {
      toast({
        title: "Não foi possível salvar a nova senha",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    }
  });

  const title =
    view === "request" ? "Recuperar acesso" :
    view === "sent" ? "Confira seu e-mail" :
    view === "reset" ? "Nova senha" :
    view === "success" ? "Senha atualizada" :
    view === "invalid" ? "Link expirado" : "Validando link";

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
        <meta name="description" content="Recupere o acesso à sua conta Achegue-se com segurança." />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33] lg:bg-[radial-gradient(circle_at_16%_32%,rgba(216,234,224,.55),transparent_31%),radial-gradient(circle_at_70%_18%,rgba(255,236,185,.28),transparent_30%),#fffdfa]">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-5 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Recuperar acesso">
            <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-[#0b3b3f]">
              Vamos ajudar<br />você a voltar.
            </h1>
            <p className="mt-4 max-w-[350px] text-[17px] leading-6 text-[#244448]">
              Use o e-mail cadastrado, mesmo que entre com @usuário.
            </p>
            <img
              src="/auth/recovery-hero.webp"
              alt="Ilustração de um território e placas de orientação"
              className="mt-5 w-full max-w-[390px] object-cover"
            />
          </section>

          <section className="w-full lg:rounded-[10px] lg:bg-white lg:p-7 lg:shadow-[0_18px_55px_rgba(17,55,59,.08)]">
            {view === "request" ? (
              <div>
                <h1 className="font-heading text-[31px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#102f33] lg:text-[24px]">
                  <span className="lg:hidden">Vamos recuperar<br />seu acesso.</span>
                  <span className="hidden lg:inline">E-mail cadastrado</span>
                </h1>
                <p className="mt-2 text-[14px] leading-5 text-[#3a5659] lg:hidden">
                  Informe o e-mail usado na sua conta.
                </p>

                <div className="mt-6 space-y-2 lg:mt-7">
                  <Label htmlFor="recovery-email" className="text-[14px] font-semibold text-[#15383c]">E-mail</Label>
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
                    className="h-11 rounded-lg border-[#b9c5c6] bg-white px-3 text-[16px] shadow-none"
                  />
                  <p className="text-[11px] leading-4 text-[#607477] lg:hidden">
                    A recuperação é feita por e-mail, mesmo quando você entra com @usuário.
                  </p>
                </div>

                {requestTurnstile.enabled ? (
                  <div className="mt-4">{requestGate}</div>
                ) : (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#eef2f2] px-4 py-3 lg:hidden">
                    <AuthConceptIcon name="shield" className="text-[#0b5b59]" />
                    <div>
                      <p className="text-[12px] font-semibold">Verificação de segurança</p>
                      <p className="text-[11px] text-[#607477]">Conclua quando solicitada.</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void sendRecovery()}
                  disabled={sending || !requestTurnstile.isReady}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] hover:bg-[#f7bf00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40 disabled:opacity-55"
                >
                  {sending ? "Enviando…" : "Enviar link de recuperação"}
                </button>

                <p className="mt-4 hidden text-center text-[11px] leading-4 text-[#607477] lg:block">
                  Se houver uma conta associada, enviaremos as instruções.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mx-auto mt-4 block min-h-10 rounded px-2 text-[13px] text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 lg:hidden"
                >
                  Voltar para entrar
                </button>

                <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#eef2f2] px-4 py-3 lg:hidden">
                  <AuthConceptIcon name="help" className="text-[#0b5b59]" />
                  <p className="text-[11px] leading-5 text-[#445f62]">
                    Não consegue acessar esse e-mail?<br />
                    <Link to={SUPPORT_PATH} className="font-medium text-[#0b4e52] underline underline-offset-2">Preciso de ajuda</Link>
                  </p>
                </div>

                <div className="my-5 hidden h-px bg-[#d4d8d5] lg:block" />
                <div className="hidden space-y-2 text-center text-[12px] text-[#0b4e52] lg:block">
                  <button type="button" onClick={() => navigate("/login")} className="rounded px-2 py-1 underline underline-offset-2">
                    Voltar para entrar
                  </button>
                  <div>
                    <Link to={SUPPORT_PATH} className="rounded px-2 py-1 underline underline-offset-2">
                      Não tenho acesso ao e-mail
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {view === "sent" ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2f3] text-[#173e43]">
                  <span style={{ transform: "scale(1.55)" }}><AuthConceptIcon name="mail" /></span>
                </div>
                <h1 className="mt-4 font-heading text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#102f33]">
                  Confira sua caixa<br />de entrada
                </h1>
                <p className="mx-auto mt-3 max-w-[310px] text-[13px] leading-5 text-[#3a5659]">
                  Se houver uma conta associada a esse e-mail, você receberá as instruções de recuperação.
                </p>

                <div className="mt-5 rounded-xl bg-[#eef2f3] p-3 text-left">
                  <p className="text-[11px] text-[#607477]">E-mail informado</p>
                  <p className="mt-0.5 break-all text-[14px] font-medium">{email}</p>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#eef2f3] p-3 text-left text-[11px] text-[#4f676a]">
                  <AuthConceptIcon name="info" className="text-[#5f99a1]" />
                  <span>Confira também o spam.</span>
                </div>

                {requestTurnstile.enabled ? <div className="mt-4">{requestGate}</div> : null}

                <button
                  type="button"
                  onClick={() => void sendRecovery()}
                  disabled={sending || resendCooldown > 0 || !requestTurnstile.isReady}
                  className="mt-5 h-11 w-full rounded-[9px] border border-[#31575a] bg-white text-[14px] font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 disabled:opacity-55"
                >
                  {sending ? "Enviando…" : resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar link"}
                </button>
                <p className="mt-2 text-[10.5px] text-[#607477]">O reenvio pode exigir uma breve espera.</p>

                <button
                  type="button"
                  onClick={() => {
                    setView("request");
                    setEmail("");
                    setResendCooldown(0);
                  }}
                  className="mt-4 min-h-10 rounded px-2 text-[13px] font-medium text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
                >
                  Usar outro e-mail
                </button>
                <div className="my-4 h-px bg-[#d4d8d5]" />
                <button type="button" onClick={() => navigate("/login")} className="min-h-10 rounded px-2 text-[13px] text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                  Voltar para entrar
                </button>
              </div>
            ) : null}

            {view === "checking" ? (
              <div role="status" className="py-16 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#cad5d3] border-t-[#0b5b59]" />
                <h1 className="font-heading text-xl font-bold">Validando seu link…</h1>
                <p className="mt-2 text-sm text-[#607477]">Aguarde enquanto confirmamos a recuperação.</p>
              </div>
            ) : null}

            {view === "reset" ? (
              <form onSubmit={saveNewPassword} noValidate>
                <h1 className="font-heading text-[25px] font-extrabold leading-tight tracking-[-0.035em] text-[#102f33]">
                  Escolha uma nova senha
                </h1>
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="new-password" className="text-[13px] font-semibold">Nova senha</Label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    invalid={Boolean(form.formState.errors.newPassword)}
                    className="h-11 rounded-lg border-[#b9c5c6] bg-white shadow-none"
                    aria-describedby={form.formState.errors.newPassword ? "new-password-error" : undefined}
                    {...form.register("newPassword")}
                  />
                  <InlineFieldError id="new-password-error" message={form.formState.errors.newPassword?.message} />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="confirm-new-password" className="text-[13px] font-semibold">Confirmar nova senha</Label>
                  <PasswordInput
                    id="confirm-new-password"
                    autoComplete="new-password"
                    invalid={Boolean(form.formState.errors.confirmNewPassword)}
                    className="h-11 rounded-lg border-[#b9c5c6] bg-white shadow-none"
                    aria-describedby={form.formState.errors.confirmNewPassword ? "confirm-password-error" : undefined}
                    {...form.register("confirmNewPassword")}
                  />
                  <InlineFieldError id="confirm-password-error" message={form.formState.errors.confirmNewPassword?.message} />
                </div>

                <p className="mt-3 text-[12px] font-semibold">Sua senha deve conter:</p>
                <ul className="mt-2 space-y-1">
                  {requirements.map((requirement) => (
                    <li key={requirement.id} className={`flex items-center gap-2 text-[11px] ${requirement.satisfied ? "text-[#247c5b]" : "text-[#556d70]"}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${requirement.satisfied ? "bg-[#43a876]" : "bg-[#b9c3c4]"}`} />
                      {requirement.label}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#eef2f3] px-4 py-3 text-[11px] leading-4 text-[#526a6d]">
                  <AuthConceptIcon name="lightbulb" className="text-[#174d55]" />
                  <span>Use uma senha que você não utiliza em outros serviços.</span>
                </div>

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="mt-4 h-11 w-full rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] hover:bg-[#f7bf00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40 disabled:opacity-55"
                >
                  {form.formState.isSubmitting ? "Salvando…" : "Salvar nova senha"}
                </button>

                <div className="mt-4 text-center text-[10.5px] leading-4 text-[#607477]">
                  <span aria-hidden="true" className="mx-auto mb-3 block h-px w-8 bg-[#cbd3d2]" />
                  Ao continuar, você concorda com nossos{" "}
                  <Link to={TERMS_OF_SERVICE_PATH} className="underline underline-offset-2">Termos de Uso</Link>{" "}
                  e{" "}
                  <Link to={PRIVACY_POLICY_PATH} className="underline underline-offset-2">Política de Privacidade</Link>.
                </div>
              </form>
            ) : null}

            {view === "success" ? (
              <div className="rounded-xl bg-[#e8f8ed] p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#43a876] text-white">
                    <AuthConceptIcon name="check" />
                  </span>
                  <div>
                    <p className="text-[11px] text-[#376354]">Após salvar</p>
                    <h1 className="mt-2 font-heading text-[18px] font-extrabold">Senha atualizada.</h1>
                    <p className="text-[12px] text-[#42645a]">Entre com a nova senha.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/login?passwordReset=1", { replace: true })}
                  className="mt-4 h-11 w-full rounded-[9px] bg-[#075c55] text-[14px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
                >
                  Ir para entrar
                </button>
              </div>
            ) : null}

            {view === "invalid" ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fde9e7] text-[#b83b33]">
                  <span style={{ transform: "scale(1.55)" }}><AuthConceptIcon name="warning" /></span>
                </div>
                <h1 className="mt-5 font-heading text-[27px] font-extrabold leading-[1.06] tracking-[-0.04em]">
                  Este link não está<br />mais disponível.
                </h1>
                <p className="mt-3 text-[13px] leading-5 text-[#435d60]">
                  Ele pode ter expirado ou já ter sido usado.<br />Solicite um novo link.
                </p>

                <div className="mt-6 space-y-1.5 text-left">
                  <Label htmlFor="expired-email" className="text-[13px] font-semibold">E-mail</Label>
                  <Input
                    id="expired-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-lg border-[#b9c5c6] bg-white shadow-none"
                  />
                </div>
                {requestTurnstile.enabled ? <div className="mt-4 text-left">{requestGate}</div> : null}
                <button
                  type="button"
                  onClick={() => void sendRecovery()}
                  disabled={sending || !requestTurnstile.isReady}
                  className="mt-4 h-11 w-full rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] hover:bg-[#f7bf00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40 disabled:opacity-55"
                >
                  {sending ? "Enviando…" : "Enviar novo link"}
                </button>
                <button type="button" onClick={() => navigate("/login")} className="mx-auto mt-4 block min-h-10 rounded px-2 text-[13px] text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                  Voltar para entrar
                </button>
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#eef2f3] p-4 text-left text-[11px] leading-5 text-[#4f676a]">
                  <AuthConceptIcon name="info" className="text-[#174d55]" />
                  <p>Sua senha não foi alterada por este link.<br /><Link to={SUPPORT_PATH} className="font-medium underline underline-offset-2">Preciso de ajuda</Link></p>
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
