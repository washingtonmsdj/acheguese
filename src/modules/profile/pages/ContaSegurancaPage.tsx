/**
 * /conta/seguranca - Configurações da conta, separado da identidade pública.
 *
 * Conta = auth.users (email, senha, sessões, exclusão)
 * Perfil público = identidade pública/social visível para outros usuários
 */

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { ChangePasswordForm } from "@/modules/profile/components/ChangePasswordForm";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

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
      toast.success("Email de redefinição enviado");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Erro ao enviar email"));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Minha conta | Segurança</title>
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.home)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Minha conta</h1>
            <p className="text-xs text-muted-foreground">
              Configurações de acesso, recuperação e segurança
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Autenticação</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{user.email}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta superfície cuida apenas de acesso e segurança. Privacidade da identidade,
            membros e configurações operacionais ficam em áreas separadas.
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Email de login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Este é o email usado para acessar sua conta. Para alterá-lo, entre em contato
              com o suporte.
            </p>
          </CardContent>
        </Card>

        <ChangePasswordForm
          onSave={handleChangePassword}
          onCancel={() => {
            return;
          }}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Recuperação por email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Envie um fluxo de redefinição para o email principal da conta.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetPassword}
              disabled={resetSent || sendingReset}
            >
              {sendingReset ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : resetSent ? (
                "Email enviado"
              ) : (
                "Redefinir por email"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Zona de perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              A exclusão da conta é permanente e remove todos os seus perfis, dados e
              conteúdo. Esta ação não pode ser desfeita.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => {
                toast.error("Para excluir sua conta, entre em contato com o suporte.");
              }}
            >
              Solicitar exclusão da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
