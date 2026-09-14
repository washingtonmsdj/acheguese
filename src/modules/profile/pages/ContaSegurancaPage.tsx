import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Globe2,
  KeyRound,
  Laptop,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useLinkedAuthProviders } from "@/core/auth/hooks/useLinkedAuthProviders";
import { useMFA } from "@/core/auth/hooks/useMFA";
import type { MFAEnrollmentData } from "@/core/auth/services/MFAService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { ChangePasswordForm } from "@/modules/profile/components/ChangePasswordForm";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SUPPORT_PATH } from "@/shared/constants/legal";
import {
  ForgotPasswordSchema,
  type UpdatePasswordInput,
} from "@/shared/validation/schemas/user.schema";

function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-territory-border bg-territory-surface ${className}`}>
      {children}
    </section>
  );
}

function AccessRow({
  icon,
  title,
  value,
  meta,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[88px] items-start gap-3 border-b border-territory-border py-4 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-bold text-territory-ink">{title}</h2>
          {meta}
        </div>
        <p className="mt-1 break-all text-sm text-territory-muted">{value}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-territory-sun/35 text-sm font-bold text-territory-ink">
      {children}
    </span>
  );
}

function HelpRow({ onClick }: { onClick: () => void }) {
  return (
    <Surface className="px-4 sm:px-5">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        <CircleHelp className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-territory-ink">Preciso de ajuda</span>
          <span className="mt-0.5 block text-xs text-territory-muted">Segurança e acesso à conta</span>
        </span>
        <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
      </button>
    </Surface>
  );
}

export default function ContaSegurancaPage() {
  const appUrls = useAppUrls();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProfile } = useMultiProfileContext();
  const {
    user,
    updatePassword,
    updateEmail,
    resetPassword,
    googleAuthAvailable,
    signOutOtherSessions,
  } = useAuth();
  const {
    hasGoogle: googleLinked,
    loading: providersLoading,
    error: providersError,
    refresh: refreshProviders,
  } = useLinkedAuthProviders();
  const {
    isMFAEnabled,
    loading: mfaLoading,
    error: mfaError,
    startEnrollment,
    verifyAndEnable,
  } = useMFA();
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [enrollment, setEnrollment] = useState<MFAEnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [emailRequestSent, setEmailRequestSent] = useState(false);

  if (!user) {
    return <Navigate to={appUrls.auth.login} replace />;
  }

  const handleChangePassword = async (data: UpdatePasswordInput) => {
    try {
      await updatePassword(data.newPassword);
      toast.success("Senha alterada com sucesso");
      navigate("/conta/seguranca", { replace: true });
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Erro ao alterar senha"));
      throw error;
    }
  };

  const handleResetPassword = async () => {
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      setResetSent(true);
      toast.success("E-mail de redefinição enviado");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Erro ao enviar e-mail"));
    } finally {
      setSendingReset(false);
    }
  };

  const handleUpdateEmail = async () => {
    const candidate = newEmail.trim();
    const parsed = ForgotPasswordSchema.shape.email.safeParse(candidate);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Informe um e-mail válido.");
      return;
    }
    if (candidate.toLocaleLowerCase() === user.email.toLocaleLowerCase()) {
      setEmailError("Informe um e-mail diferente do atual.");
      return;
    }

    setUpdatingEmail(true);
    setEmailError(null);
    try {
      await updateEmail(candidate);
      setEmailRequestSent(true);
      toast.success("Alteração de e-mail solicitada", {
        description: "Conclua as confirmações enviadas pelo serviço de autenticação.",
      });
    } catch (error) {
      const message = getAuthErrorMessage(error, "Não foi possível solicitar a troca de e-mail");
      setEmailError(message);
      toast.error(message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleStartMfa = async () => {
    const next = await startEnrollment();
    if (!next) {
      toast.error("Não foi possível iniciar a autenticação em duas etapas.");
      return;
    }
    setEnrollment(next);
    setVerificationCode("");
  };

  const handleVerifyMfa = async () => {
    if (!enrollment || verificationCode.trim().length !== 6) return;
    setVerifying(true);
    const ok = await verifyAndEnable(enrollment.factorId, verificationCode.trim());
    setVerifying(false);
    if (ok) {
      setEnrollment(null);
      setVerificationCode("");
      toast.success("Autenticação em duas etapas ativada.");
    } else {
      toast.error("Código inválido. Confira o aplicativo autenticador.");
    }
  };

  const handleSignOutOtherSessions = async () => {
    setRevokingSessions(true);
    try {
      await signOutOtherSessions();
      toast.success("Outras sessões encerradas", {
        description: "Este dispositivo continua conectado.",
      });
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Não foi possível encerrar as outras sessões"));
    } finally {
      setRevokingSessions(false);
    }
  };

  const accessView = location.hash === "#acesso";
  const emailView = location.hash === "#email";
  const passwordView = location.hash === "#senha";
  const handle = activeProfile?.handle ? `@${activeProfile.handle}` : "Nome de usuário ainda não definido";

  if (emailView) {
    return (
      <>
        <Helmet><title>Alterar e-mail | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Alterar e-mail de acesso"
          description="O novo endereço precisa ser confirmado antes de substituir o e-mail atual."
        >
          <Surface className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-bold text-territory-ink">E-mail atual</h2>
                <p className="mt-1 break-all text-sm text-territory-muted">{user.email}</p>
              </div>
            </div>

            {emailRequestSent ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  Solicitação enviada
                </div>
                <p className="mt-2 leading-5">
                  A conta continuará mostrando o e-mail atual até que o provedor de autenticação confirme a alteração.
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <Label htmlFor="new-email">Novo e-mail</Label>
                <Input
                  id="new-email"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    setEmailError(null);
                  }}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "new-email-error" : undefined}
                  className="mt-2 h-12"
                  placeholder="voce@exemplo.com"
                />
                {emailError ? (
                  <p id="new-email-error" className="mt-2 text-sm font-medium text-destructive" role="alert">
                    {emailError}
                  </p>
                ) : null}
                <Button
                  type="button"
                  className="mt-4 min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
                  onClick={handleUpdateEmail}
                  disabled={updatingEmail || !newEmail.trim()}
                >
                  {updatingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {updatingEmail ? "Enviando..." : "Enviar confirmação"}
                </Button>
              </div>
            )}
          </Surface>

          <div className="mt-4">
            <HelpRow onClick={() => navigate(SUPPORT_PATH)} />
          </div>
        </AccountSettingsShell>
      </>
    );
  }

  if (passwordView) {
    return (
      <>
        <Helmet><title>Alterar senha | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Alterar senha"
          description="Escolha uma senha forte e exclusiva para a sua conta."
        >
          <Surface className="p-4 sm:p-5">
            <ChangePasswordForm onSave={handleChangePassword} onCancel={() => navigate("/conta/seguranca")} />
          </Surface>

          <Surface className="mt-4 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-bold text-territory-ink">Recuperação por e-mail</h2>
                <p className="mt-1 break-all text-sm text-territory-muted">{user.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11 w-full"
              onClick={handleResetPassword}
              disabled={resetSent || sendingReset}
            >
              {sendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {resetSent ? "E-mail enviado" : "Enviar recuperação por e-mail"}
            </Button>
          </Surface>

          <div className="mt-4">
            <HelpRow onClick={() => navigate(SUPPORT_PATH)} />
          </div>
        </AccountSettingsShell>
      </>
    );
  }

  if (accessView) {
    const googleStatusLabel = providersLoading
      ? "Consultando"
      : googleLinked
        ? "Conectado"
        : googleAuthAvailable
          ? "Disponível"
          : "Indisponível";
    const googleStatusClass = googleLinked
      ? "bg-emerald-100 text-emerald-800"
      : googleAuthAvailable
        ? "bg-territory-brand/10 text-territory-brand"
        : "bg-territory-raised text-territory-muted";
    const googleDescription = providersLoading
      ? "Consultando os métodos vinculados à sua conta..."
      : providersError
        ? "Não foi possível confirmar agora se uma identidade Google está vinculada."
        : googleLinked
          ? "Uma identidade Google está vinculada a esta conta."
          : googleAuthAvailable
            ? "O provedor Google está disponível, mas nenhum vínculo foi confirmado para esta conta."
            : "O acesso com Google não está habilitado neste ambiente.";

    return (
      <>
        <Helmet>
          <title>Dados de acesso | Achegue-se</title>
        </Helmet>
        <AccountSettingsShell
          title="Dados de acesso"
          description="Revise como você entra e identifica sua conta."
        >
          <Surface className="p-4 sm:p-5">
            <AccessRow
              icon={<Mail className="h-5 w-5" aria-hidden="true" />}
              title="E-mail de acesso"
              value={user.email}
              meta={
                user.emailConfirmed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Confirmado
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                    Confirmação pendente
                  </span>
                )
              }
              action={
                <button
                  type="button"
                  className="min-h-9 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline"
                  onClick={() => navigate("/conta/seguranca#email")}
                >
                  Alterar e-mail
                </button>
              }
            />
            <AccessRow
              icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
              title="Nome de usuário"
              value={handle}
              action={
                activeProfile?.id ? (
                  <button
                    type="button"
                    className="min-h-9 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline"
                    onClick={() => navigate(appUrls.profile.edit(activeProfile.id))}
                  >
                    Editar perfil
                  </button>
                ) : null
              }
            />
            <AccessRow
              icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
              title="Senha"
              value="Altere sua senha pela área segura da conta."
              action={
                <button
                  type="button"
                  className="min-h-9 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline"
                  onClick={() => navigate("/conta/seguranca#senha")}
                >
                  Alterar senha
                </button>
              }
            />
            <AccessRow
              icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
              title="Acesso com Google"
              value={googleDescription}
              meta={
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${googleStatusClass}`}>
                  {googleStatusLabel}
                </span>
              }
              action={
                providersError ? (
                  <button
                    type="button"
                    className="min-h-9 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline"
                    onClick={() => void refreshProviders()}
                  >
                    Tentar novamente
                  </button>
                ) : null
              }
            />
          </Surface>

          {activeProfile?.id ? (
            <Surface className="mt-4 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => navigate(appUrls.profile.edit(activeProfile.id))}
                className="flex min-h-12 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                  <Pencil className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-territory-ink">Editar nome, foto e identidade</span>
                  <span className="mt-1 block text-sm text-territory-muted">Esses dados pertencem ao perfil e não às credenciais de autenticação.</span>
                </span>
              </button>
            </Surface>
          ) : null}
        </AccountSettingsShell>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Senha e segurança | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title="Senha e segurança"
        description="Mantenha sua conta protegida."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-base font-bold text-territory-ink">Autenticação em duas etapas</h2>
                  {!mfaLoading ? (
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isMFAEnabled ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                      {isMFAEnabled ? "Ativada" : "Não ativada"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-5 text-territory-muted">
                  Confirme novos acessos com um aplicativo autenticador compatível.
                </p>
              </div>
            </div>

            {mfaError ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                Não foi possível consultar o estado da autenticação agora.
              </p>
            ) : null}

            {!isMFAEnabled && !enrollment ? (
              <Button
                type="button"
                className="mt-5 min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
                onClick={handleStartMfa}
                disabled={mfaLoading}
              >
                {mfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Configurar autenticação
              </Button>
            ) : null}

            {isMFAEnabled ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                Autenticação em duas etapas ativa nesta conta.
              </div>
            ) : null}

            {enrollment ? (
              <div className="mt-5 space-y-5 border-t border-territory-border pt-5">
                <div className="flex items-start gap-3">
                  <StepNumber>1</StepNumber>
                  <div>
                    <p className="font-semibold text-territory-ink">Abra seu aplicativo autenticador</p>
                    <p className="mt-1 text-sm text-territory-muted">Use um aplicativo compatível com códigos TOTP.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <StepNumber>2</StepNumber>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-territory-ink">Escaneie o código</p>
                    <div className="mt-3 flex justify-center rounded-2xl bg-white p-4">
                      <img src={enrollment.qrCode} alt="QR code para configurar autenticação em duas etapas" className="h-44 w-44" />
                    </div>
                    <details className="mt-2 rounded-xl border border-territory-border bg-territory-raised px-3 py-2">
                      <summary className="cursor-pointer text-sm font-semibold text-territory-brand">Não consigo escanear</summary>
                      <p className="mt-2 text-xs text-territory-muted">Digite esta chave manualmente no autenticador:</p>
                      <code className="mt-1 block break-all text-sm text-territory-ink">{enrollment.secret}</code>
                    </details>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <StepNumber>3</StepNumber>
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="mfa-code" className="font-semibold text-territory-ink">Digite o código do aplicativo</Label>
                    <Input
                      id="mfa-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="mt-2 h-12 text-lg tracking-[0.28em]"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
                  onClick={handleVerifyMfa}
                  disabled={verificationCode.length !== 6 || verifying}
                >
                  {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmar ativação
                </Button>
                <p className="text-center text-xs leading-4 text-territory-muted">
                  A proteção só será ativada depois da confirmação do código.
                </p>
              </div>
            ) : null}
          </Surface>

          <Surface className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                <Laptop className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Acessos à conta</h2>
                <p className="mt-2 text-sm leading-5 text-territory-muted">
                  A lista detalhada de dispositivos não está disponível, mas você pode encerrar todas as outras sessões sem sair deste dispositivo.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-5 min-h-11 w-full border-territory-brand text-territory-brand hover:bg-territory-brand/5"
              onClick={handleSignOutOtherSessions}
              disabled={revokingSessions}
            >
              {revokingSessions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {revokingSessions ? "Encerrando..." : "Sair dos outros dispositivos"}
            </Button>
            <p className="mt-2 text-center text-xs text-territory-muted">
              Sua sessão atual permanece conectada.
            </p>
          </Surface>
        </div>

        <Surface className="mt-4 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => navigate("/conta/seguranca#senha")}
            className="group flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            <KeyRound className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-territory-ink">Alterar senha</span>
              <span className="mt-0.5 block text-xs text-territory-muted">Atualize sua senha ou acesse a recuperação por e-mail.</span>
            </span>
            <ChevronRight className="h-5 w-5 text-territory-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </Surface>

        <div className="mt-4">
          <HelpRow onClick={() => navigate(SUPPORT_PATH)} />
        </div>
      </AccountSettingsShell>
    </>
  );
}
