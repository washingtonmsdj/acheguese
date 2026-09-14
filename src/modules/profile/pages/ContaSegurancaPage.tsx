import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useMFA } from "@/core/auth/hooks/useMFA";
import type { MFAEnrollmentData } from "@/core/auth/services/MFAService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { ChangePasswordForm } from "@/modules/profile/components/ChangePasswordForm";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { UpdatePasswordInput } from "@/shared/validation/schemas/user.schema";

function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-territory-border bg-territory-surface ${className}`}>
      {children}
    </section>
  );
}

export default function ContaSegurancaPage() {
  const appUrls = useAppUrls();
  const { user, updatePassword, resetPassword } = useAuth();
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
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
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
                Sua conta já exige o segundo fator configurado.
              </div>
            ) : null}

            {enrollment ? (
              <div className="mt-5 space-y-4 border-t border-territory-border pt-5">
                <div>
                  <p className="font-semibold text-territory-ink">1. Abra seu aplicativo autenticador</p>
                  <p className="mt-1 text-sm text-territory-muted">Escaneie o QR code ou use a chave manual.</p>
                </div>
                <div className="flex justify-center rounded-2xl bg-white p-4">
                  <img src={enrollment.qrCode} alt="QR code para configurar autenticação em duas etapas" className="h-44 w-44" />
                </div>
                <div className="rounded-xl bg-territory-raised p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-territory-muted">Chave manual</p>
                  <code className="mt-1 block break-all text-sm text-territory-ink">{enrollment.secret}</code>
                </div>
                <div>
                  <Label htmlFor="mfa-code">2. Digite o código de 6 dígitos</Label>
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
                <Button
                  type="button"
                  className="min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
                  onClick={handleVerifyMfa}
                  disabled={verificationCode.length !== 6 || verifying}
                >
                  {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmar ativação
                </Button>
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
                  A lista de dispositivos ainda não está disponível para esta conta.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="mt-5 min-h-11 w-full" disabled>
              Sair dos outros dispositivos
            </Button>
            <p className="mt-2 text-center text-xs text-territory-muted">
              O recurso será habilitado quando houver autoridade de sessão para revogação seletiva.
            </p>
          </Surface>
        </div>

        <div id="acesso" className="mt-4 grid gap-4 lg:grid-cols-2">
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

        <Surface className="mt-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-base font-bold text-territory-ink">Proteção da conta</h2>
              <p className="mt-1 text-sm leading-5 text-territory-muted">
                Senha, recuperação e autenticação em duas etapas usam os serviços canônicos de autenticação do projeto. Nenhuma credencial é armazenada nesta tela.
              </p>
            </div>
          </div>
        </Surface>
      </AccountSettingsShell>
    </>
  );
}
