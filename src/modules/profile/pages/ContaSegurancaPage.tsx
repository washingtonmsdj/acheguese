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
  LockKeyhole,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
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
import type { UpdatePasswordInput } from "@/shared/validation/schemas/user.schema";

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

export default function ContaSegurancaPage() {
  const appUrls = useAppUrls();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProfile } = useMultiProfileContext();
  const {
    user,
    updatePassword,
    resetPassword,
    googleAuthAvailable,
    signOutOtherSessions,
  } = useAuth();
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

  if (!user) {
    return <Navigate to={appUrls.auth.login} replace />;
  }

  const handleChangePassword = async (data: UpdatePasswordInput) => {
    try {
      await updatePassword(data.newPassword);
      toast.success("Senha alterada com sucesso");
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
  const handle = activeProfile?.handle ? `@${activeProfile.handle}` : "Nome de usuário ainda não definido";

  if (accessView) {
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
                  className="min-h-9 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline disabled:text-territory-muted"
                  onClick={handleResetPassword}
                  disabled={sendingReset || resetSent}
                >
                  {sendingReset ? "Enviando..." : resetSent ? "Recuperação enviada" : "Enviar recuperação por e-mail"}
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
                  onClick={() => navigate("/conta/seguranca")}
                >
                  Alterar senha
                </button>
              }
            />
            <AccessRow
              icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
              title="Acesso com Google"
              value={
                googleAuthAvailable
                  ? "O provedor Google está disponível. O estado de vínculo não é inferido sem confirmação do serviço de autenticação."
                  : "O acesso com Google não está habilitado neste ambiente."
              }
              meta={
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${googleAuthAvailable ? "bg-territory-brand/10 text-territory-brand" : "bg-territory-raised text-territory-muted"}`}>
                  {googleAuthAvailable ? "Disponível" : "Indisponível"}
                </span>
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

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Surface className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="font-heading text-base font-bold text-territory-ink">E-mail de acesso</h2>
                <p className="mt-1 break-all text-sm font-medium text-territory-ink">{user.email}</p>
                <p className="mt-1 text-sm text-territory-muted">Usado para login e recuperação da conta.</p>
              </div>
            </div>
            <Button type="button" variant="outline" className="mt-5 min-h-11 w-full" onClick={handleResetPassword} disabled={resetSent || sendingReset}>
              {sendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {resetSent ? "E-mail enviado" : "Enviar recuperação por e-mail"}
            </Button>
          </Surface>

          <Surface className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-territory-brand" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Senha</h2>
                <p className="text-sm text-territory-muted">Mantenha uma senha exclusiva e atualizada.</p>
              </div>
            </div>
            <ChangePasswordForm onSave={handleChangePassword} onCancel={() => undefined} />
          </Surface>
        </div>

        <Surface className="mt-4 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => navigate(SUPPORT_PATH)}
            className="flex min-h-16 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            <CircleHelp className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-territory-ink">Não reconhece um acesso?</span>
              <span className="mt-0.5 block text-xs text-territory-muted">Preciso de ajuda</span>
            </span>
            <ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" />
          </button>
        </Surface>

        <Surface className="mt-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-base font-bold text-territory-ink">Proteção da conta</h2>
              <p className="mt-1 text-sm leading-5 text-territory-muted">
                Senha, recuperação, sessões e autenticação em duas etapas usam os serviços canônicos de autenticação. Nenhuma credencial é armazenada nesta tela.
              </p>
            </div>
          </div>
        </Surface>
      </AccountSettingsShell>
    </>
  );
}
