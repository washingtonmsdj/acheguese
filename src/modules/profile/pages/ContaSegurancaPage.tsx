import { useState, type ReactNode } from "react";
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
  LockKeyhole,
  Mail,
  Pencil,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useLinkedAuthProviders } from "@/core/auth/hooks/useLinkedAuthProviders";
import { useMFA } from "@/core/auth/hooks/useMFA";
import type { MFAEnrollmentData } from "@/core/auth/services/MFAService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { ChangePasswordForm } from "@/modules/profile/components/ChangePasswordForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SUPPORT_PATH } from "@/shared/constants/legal";
import {
  ForgotPasswordSchema,
  type ResetPasswordFormInput,
} from "@/shared/validation/schemas/user.schema";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
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
  icon: ReactNode;
  title: string;
  value?: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[82px] items-start gap-3 px-4 py-4 lg:min-h-[88px] lg:border-b lg:border-territory-border lg:px-0 lg:last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-territory-ink lg:h-10 lg:w-10 lg:rounded-xl lg:bg-territory-brand/10 lg:text-territory-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-bold text-territory-ink">{title}</h2>
          {meta}
        </div>
        {value ? <p className="mt-1 break-all text-sm leading-5 text-territory-muted">{value}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

function StepNumber({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-territory-sun/35 text-sm font-bold text-territory-ink">
      {children}
    </span>
  );
}

function HelpRow({
  onClick,
  prompt = "Segurança e acesso à conta",
  actionLabel = "Preciso de ajuda",
}: {
  onClick: () => void;
  prompt?: string;
  actionLabel?: string;
}) {
  return (
    <Surface className="px-4 sm:px-5">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        <CircleHelp className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-territory-ink">{prompt}</span>
          <span className="mt-0.5 block text-sm font-medium text-territory-brand">{actionLabel}</span>
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
    isResolved: providersResolved,
    refresh: refreshProviders,
  } = useLinkedAuthProviders();
  const {
    isMFAEnabled,
    isMFAStatusResolved,
    loading: mfaLoading,
    error: mfaError,
    loadStatus,
    startEnrollment,
    verifyAndEnable,
    disable,
    listFactors,
  } = useMFA();

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [enrollment, setEnrollment] = useState<MFAEnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [disablingMfa, setDisablingMfa] = useState(false);
  const [cancellingEnrollment, setCancellingEnrollment] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [emailRequestSent, setEmailRequestSent] = useState(false);

  if (!user) return <Navigate to={appUrls.auth.login} replace />;

  const handleChangePassword = async (data: ResetPasswordFormInput) => {
    try {
      await updatePassword(data.newPassword);
      toast.success("Senha alterada com sucesso");
      navigate(ACCOUNT_PATHS.security, { replace: true });
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

  const handleStartMfa = async (openDedicatedFlow = false) => {
    const next = await startEnrollment();
    if (!next) {
      toast.error("Não foi possível iniciar a autenticação em duas etapas.");
      return;
    }
    setEnrollment(next);
    setVerificationCode("");
    if (openDedicatedFlow) navigate(ACCOUNT_PATHS.mfa);
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
      navigate(ACCOUNT_PATHS.security, { replace: true });
      return;
    }
    toast.error("Código inválido. Confira o aplicativo autenticador.");
  };

  const handleCancelMfaEnrollment = async () => {
    if (!enrollment) {
      navigate(ACCOUNT_PATHS.security, { replace: true });
      return;
    }

    setCancellingEnrollment(true);
    const removed = await disable(enrollment.factorId);
    setCancellingEnrollment(false);
    if (!removed) {
      toast.error("Não foi possível cancelar a configuração com segurança.");
      return;
    }

    setEnrollment(null);
    setVerificationCode("");
    navigate(ACCOUNT_PATHS.security, { replace: true });
  };

  const handleDisableMfa = async () => {
    setDisablingMfa(true);
    try {
      const factors = await listFactors();
      if (factors === null) {
        toast.error("Não foi possível confirmar os métodos cadastrados. Nenhuma alteração foi feita.");
        return;
      }
      if (factors.length === 0) {
        await loadStatus();
        toast.error("Nenhum método de autenticação em duas etapas foi encontrado para remover.");
        return;
      }

      for (const factor of factors) {
        const disabled = await disable(factor.id);
        if (!disabled) {
          toast.error("Não foi possível remover todos os métodos de autenticação em duas etapas.");
          return;
        }
      }

      toast.success("Autenticação em duas etapas desativada.");
    } finally {
      setDisablingMfa(false);
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
  const mfaView = location.hash === "#mfa";
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
                  {updatingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {updatingEmail ? "Enviando..." : "Enviar confirmação"}
                </Button>
              </div>
            )}
          </Surface>
          <div className="mt-4"><HelpRow onClick={() => navigate(SUPPORT_PATH)} /></div>
        </AccountSettingsShell>
      </>
    );
  }

  if (passwordView) {
    return (
      <>
        <Helmet><title>Alterar senha | Achegue-se</title></Helmet>
        <AccountSettingsShell title="Alterar senha" description="Escolha uma senha forte e exclusiva para a sua conta.">
          <Surface className="p-4 sm:p-5">
            <ChangePasswordForm onSave={handleChangePassword} onCancel={() => navigate(ACCOUNT_PATHS.security)} />
          </Surface>
          <Surface className="mt-4 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-bold text-territory-ink">Recuperação por e-mail</h2>
                <p className="mt-1 break-all text-sm text-territory-muted">{user.email}</p>
              </div>
            </div>
            <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={handleResetPassword} disabled={resetSent || sendingReset}>
              {sendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {resetSent ? "E-mail enviado" : "Enviar recuperação por e-mail"}
            </Button>
          </Surface>
          <div className="mt-4"><HelpRow onClick={() => navigate(SUPPORT_PATH)} /></div>
        </AccountSettingsShell>
      </>
    );
  }

  if (mfaView) {
    return (
      <>
        <Helmet><title>Configurar autenticação | Achegue-se</title></Helmet>
        <AccountSettingsShell
          eyebrow="Configurar autenticação"
          title="Adicione uma camada de proteção"
          mobileDescription=""
          desktopDescription="Use um aplicativo autenticador para confirmar novos acessos."
        >
          {enrollment ? (
            <section className="lg:rounded-2xl lg:border lg:border-territory-border lg:bg-territory-surface lg:p-5">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <StepNumber>1</StepNumber>
                  <div>
                    <p className="font-semibold text-territory-ink">Abra seu aplicativo autenticador</p>
                    <p className="mt-1 text-sm text-territory-muted">Use um aplicativo autenticador compatível.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <StepNumber>2</StepNumber>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-territory-ink">Escaneie o código</p>
                    <div className="mx-auto mt-3 flex w-fit justify-center rounded-2xl bg-territory-raised p-3">
                      <img src={enrollment.qrCode} alt="QR code para configurar autenticação em duas etapas" className="h-40 w-40 sm:h-44 sm:w-44" />
                    </div>
                    <details className="group mt-2 text-center">
                      <summary className="inline-flex min-h-9 cursor-pointer list-none items-center text-sm font-medium text-territory-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand [&::-webkit-details-marker]:hidden">
                        Não consigo escanear
                      </summary>
                      <div className="mt-2 rounded-xl border border-territory-border bg-territory-raised p-3 text-left">
                        <p className="text-xs text-territory-muted">Digite esta chave manualmente no autenticador:</p>
                        <code className="mt-1 block break-all text-sm text-territory-ink">{enrollment.secret}</code>
                      </div>
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

                <Button type="button" className="min-h-12 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90" onClick={handleVerifyMfa} disabled={verificationCode.length !== 6 || verifying || cancellingEnrollment}>
                  {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {verifying ? "Confirmando..." : "Confirmar ativação"}
                </Button>
                <p className="text-center text-xs leading-4 text-territory-muted">A proteção só será ativada depois da confirmação do código.</p>
                <Button type="button" variant="ghost" className="min-h-10 w-full text-xs text-territory-muted" onClick={() => void handleCancelMfaEnrollment()} disabled={verifying || cancellingEnrollment}>
                  {cancellingEnrollment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {cancellingEnrollment ? "Cancelando..." : "Cancelar configuração"}
                </Button>
              </div>
            </section>
          ) : mfaLoading ? (
            <Surface className="flex min-h-40 items-center justify-center p-5">
              <div className="text-center" role="status">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-territory-brand" aria-hidden="true" />
                <p className="mt-2 text-sm text-territory-muted">Confirmando o estado de segurança da conta...</p>
              </div>
            </Surface>
          ) : !isMFAStatusResolved ? (
            <Surface className="p-4 sm:p-5">
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Não foi possível confirmar o estado da autenticação em duas etapas.</p>
                <p className="mt-1 leading-5">Nenhuma nova configuração será criada enquanto o serviço de autenticação estiver indisponível.</p>
                <button type="button" onClick={() => void loadStatus()} className="mt-3 inline-flex min-h-9 items-center gap-2 font-semibold underline-offset-4 hover:underline">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente
                </button>
              </div>
            </Surface>
          ) : isMFAEnabled ? (
            <Surface className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-bold text-territory-ink">Proteção já ativada</h2>
                  <p className="mt-1 text-sm leading-5 text-territory-muted">Sua conta já está protegida por um aplicativo autenticador.</p>
                </div>
              </div>
              <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={() => navigate(ACCOUNT_PATHS.security, { replace: true })}>
                Voltar para Segurança
              </Button>
            </Surface>
          ) : (
            <Surface className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-bold text-territory-ink">Começar configuração</h2>
                  <p className="mt-1 text-sm leading-5 text-territory-muted">O QR code só será criado quando você iniciar a configuração.</p>
                </div>
              </div>
              <Button type="button" className="mt-5 min-h-12 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90" onClick={() => void handleStartMfa()}>
                Gerar código de configuração
              </Button>
            </Surface>
          )}
          <div className="mt-4">
            <HelpRow onClick={() => navigate(SUPPORT_PATH)} prompt="Perdeu acesso ao autenticador?" />
          </div>
        </AccountSettingsShell>
      </>
    );
  }

  if (accessView) {
    const providersUnknown = providersError !== null || !providersResolved;
    const googleStatusLabel = providersLoading
      ? "Consultando"
      : providersUnknown
        ? "Não confirmado"
        : googleLinked
          ? "Conectado"
          : googleAuthAvailable
            ? "Disponível"
            : "Indisponível";
    const googleStatusClass = providersUnknown
      ? "bg-territory-raised text-territory-muted"
      : googleLinked
        ? "bg-emerald-100 text-emerald-800"
        : googleAuthAvailable
          ? "bg-territory-brand/10 text-territory-brand"
          : "bg-territory-raised text-territory-muted";
    const googleDescription = providersLoading
      ? "Consultando os métodos vinculados à sua conta..."
      : providersUnknown
        ? "Não foi possível confirmar agora se uma identidade Google está vinculada."
        : googleLinked
          ? "Uma identidade Google está vinculada a esta conta."
          : googleAuthAvailable
            ? "O provedor Google está disponível, mas nenhum vínculo foi confirmado para esta conta."
            : "O acesso com Google não está habilitado neste ambiente.";

    return (
      <>
        <Helmet><title>Dados de acesso | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Dados de acesso"
          description="Revise como você entra e identifica sua conta."
          mobileDescription=""
        >
          <div className="grid gap-3 lg:block lg:rounded-2xl lg:border lg:border-territory-border lg:bg-territory-surface lg:px-5">
            <div className="rounded-2xl border border-territory-border bg-territory-surface lg:contents">
              <AccessRow
                icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                title="E-mail de acesso"
                value={user.email}
                meta={user.emailConfirmed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Confirmado</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Confirmação pendente</span>
                )}
                action={(
                  <button type="button" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline" onClick={() => navigate(ACCOUNT_PATHS.email)}>
                    Alterar e-mail <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              />
            </div>

            <div className="rounded-2xl border border-territory-border bg-territory-surface lg:contents">
              <AccessRow
                icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
                title="Nome de usuário"
                value={handle}
                action={activeProfile?.id ? (
                  <button type="button" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline" onClick={() => navigate(appUrls.profile.edit(activeProfile.id))}>
                    Editar <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              />
            </div>

            <div className="rounded-2xl border border-territory-border bg-territory-surface lg:contents">
              <AccessRow
                icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
                title="Senha"
                action={(
                  <button type="button" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline" onClick={() => navigate(ACCOUNT_PATHS.password)}>
                    Alterar senha <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              />
            </div>

            <div className="rounded-2xl border border-territory-border bg-territory-surface lg:contents">
              <AccessRow
                icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
                title="Acesso com Google"
                value={googleDescription}
                meta={<span className={`rounded-full px-2 py-1 text-xs font-semibold ${googleStatusClass}`}>{googleStatusLabel}</span>}
                action={providersError ? (
                  <button type="button" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline" onClick={() => void refreshProviders()}>
                    Tentar novamente <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              />
              <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl bg-territory-raised px-3 py-2.5 text-xs leading-4 text-territory-muted lg:mx-0 lg:mb-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
                <span>Não remova seu único método de acesso.</span>
              </div>
            </div>
          </div>

          {activeProfile?.id ? (
            <Surface className="mt-4 px-4 sm:px-5">
              <button type="button" onClick={() => navigate(appUrls.profile.edit(activeProfile.id))} className="flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
                <span className="flex h-9 w-9 items-center justify-center text-territory-brand lg:h-10 lg:w-10 lg:rounded-xl lg:bg-territory-brand/10"><Pencil className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-territory-ink">Editar nome e foto em Meus perfis</span>
                  <span className="mt-1 hidden text-sm text-territory-muted lg:block">Esses dados pertencem ao perfil e não às credenciais de autenticação.</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" />
              </button>
            </Surface>
          ) : null}
        </AccountSettingsShell>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Senha e segurança | Achegue-se</title></Helmet>
      <AccountSettingsShell
        title="Senha e segurança"
        mobileDescription=""
        desktopDescription="Mantenha sua conta protegida."
      >
        <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:items-start">
          <Surface className="p-4 sm:p-5 lg:col-start-1 lg:row-start-1">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-territory-ink lg:h-10 lg:w-10 lg:rounded-xl lg:bg-territory-brand/10 lg:text-territory-brand"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-base font-bold text-territory-ink">Autenticação em duas etapas</h2>
                  {!mfaLoading && isMFAStatusResolved ? (
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isMFAEnabled ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                      {isMFAEnabled ? "Ativada" : "Não ativada"}
                    </span>
                  ) : !mfaLoading && mfaError ? (
                    <span className="rounded-full bg-territory-raised px-2 py-1 text-xs font-semibold text-territory-muted">Indisponível</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-5 text-territory-muted">Use um aplicativo autenticador para confirmar seu acesso.</p>
              </div>
            </div>

            {mfaError ? (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                <p>Não foi possível consultar o estado da autenticação agora.</p>
                <button type="button" onClick={() => void loadStatus()} className="mt-2 inline-flex min-h-9 items-center gap-2 font-semibold underline-offset-4 hover:underline"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente</button>
              </div>
            ) : null}

            {isMFAStatusResolved && !isMFAEnabled ? (
              <Button type="button" className="mt-5 min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90" onClick={() => void handleStartMfa(true)} disabled={mfaLoading}>
                {mfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Configurar autenticação
              </Button>
            ) : isMFAStatusResolved && isMFAEnabled ? (
              <>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />Autenticação em duas etapas ativa nesta conta.</div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" className="mt-2 min-h-10 w-full text-destructive hover:bg-destructive/5 hover:text-destructive" disabled={disablingMfa || mfaLoading}>
                      <ShieldOff className="mr-2 h-4 w-4" aria-hidden="true" />
                      Desativar autenticação em duas etapas
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar proteção adicional?</AlertDialogTitle>
                      <AlertDialogDescription>Os aplicativos autenticadores cadastrados serão removidos. Novos acessos deixarão de exigir o código de segurança.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter ativada</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handleDisableMfa()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Desativar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : null}
          </Surface>

          <Surface className="px-4 sm:px-5 lg:col-start-1 lg:row-start-2">
            <button type="button" onClick={() => navigate(ACCOUNT_PATHS.password)} className="group flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
              <KeyRound className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-territory-ink">Alterar senha</span>
                <span className="mt-0.5 hidden text-xs text-territory-muted lg:block">Atualize sua senha ou acesse a recuperação por e-mail.</span>
              </span>
              <ChevronRight className="h-5 w-5 text-territory-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </Surface>

          <section className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:rounded-2xl lg:border lg:border-territory-border lg:bg-territory-surface lg:p-5">
            <h2 className="mb-2 font-heading text-lg font-bold text-territory-ink lg:hidden">Acessos à conta</h2>
            <div className="hidden items-start gap-3 lg:flex">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand"><Laptop className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Acessos à conta</h2>
                <p className="mt-2 text-sm leading-5 text-territory-muted">Encerre outras sessões sem desconectar o navegador que está usando agora.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-territory-border bg-territory-raised p-3 text-territory-muted lg:mt-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-territory-surface text-territory-brand">
                <Laptop className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm leading-5">A lista de dispositivos não está disponível agora.</p>
            </div>

            <Button type="button" variant="outline" className="mt-4 min-h-11 w-full border-territory-brand text-territory-brand hover:bg-territory-brand/5" onClick={handleSignOutOtherSessions} disabled={revokingSessions}>
              {revokingSessions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {revokingSessions ? "Encerrando..." : "Sair dos outros dispositivos"}
            </Button>
            <p className="mt-2 text-center text-xs text-territory-muted">Este dispositivo permanece conectado quando a operação é concluída.</p>
          </section>
        </div>

        <div className="mt-4">
          <HelpRow onClick={() => navigate(SUPPORT_PATH)} prompt="Não reconhece um acesso?" />
        </div>
      </AccountSettingsShell>
    </>
  );
}