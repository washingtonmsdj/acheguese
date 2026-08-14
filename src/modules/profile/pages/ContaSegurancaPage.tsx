import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { ChangePasswordForm } from "@/modules/profile/components/ChangePasswordForm";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { UpdatePasswordInput } from "@/shared/validation/schemas/user.schema";

export default function ContaSegurancaPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user, updatePassword, resetPassword } = useAuth();
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  return (
    <>
      <Helmet>
        <title>Minha conta | Segurança</title>
      </Helmet>

      <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
        <main className="mx-auto w-full max-w-[1080px] px-3 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
          <div className="sticky top-0 z-20 -mx-3 mb-5 border-b border-territory-border bg-territory-canvas/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => navigate(appUrls.profile.home)}
                  type="button"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Conta e acesso
                  </p>
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Segurança da conta
                  </h1>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Senha, recuperação e proteção do login.
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                Conta protegida
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                      Autenticação
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      {user.email}
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      Esta área cuida apenas do acesso da conta. Identidade
                      pública, perfis vinculados e configurações operacionais
                      seguem separados.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-auto sm:grid-cols-1">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                      <p className="font-medium text-foreground">
                        Email principal
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Login e recuperação
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                      <p className="font-medium text-foreground">Senha forte</p>
                      <p className="mt-1 text-muted-foreground">
                        Obrigatória para acesso
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    Email de login
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {user.email}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Esse e-mail é usado para entrar na conta e receber fluxos de
                    recuperação. Alterações devem passar pelo suporte.
                  </p>
                </CardContent>
              </Card>

              <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-5 sm:p-6">
                <ChangePasswordForm
                  onSave={handleChangePassword}
                  onCancel={() => {
                    return;
                  }}
                />
              </section>

              <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    Recuperação por e-mail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Envie um fluxo de redefinição para o e-mail principal da
                    conta.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center sm:w-auto"
                    onClick={handleResetPassword}
                    disabled={resetSent || sendingReset}
                  >
                    {sendingReset ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Enviando...
                      </>
                    ) : resetSent ? (
                      "E-mail enviado"
                    ) : (
                      "Redefinir por e-mail"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-territory-highlight border-destructive/30 bg-territory-surface shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Zona de risco
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Excluir a conta remove perfis, dados e conteudo associados.
                    Essa ação é permanente.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center border-destructive/30 text-destructive hover:bg-destructive/5 sm:w-auto"
                    onClick={() => {
                      toast.error(
                        "Para excluir sua conta, entre em contato com o suporte.",
                      );
                    }}
                  >
                    Solicitar exclusao da conta
                  </Button>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <LockKeyhole className="h-4 w-4" />
                    Boas praticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    Use uma senha exclusiva para o Achegue-se.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    Renove a senha se houver suspeita de acesso indevido.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    Mantenha e-mail e acesso sob sua própria gestão.
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
