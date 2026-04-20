/**
 * /perfil/conta - Configuracoes da conta, separado da identidade de perfil.
 *
 * Conta = auth.users (email, senha, sessoes, exclusao)
 * Perfil = identidade publica/operacional
 */

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { getAuthErrorMessage } from '@/core/auth/utils/authMessages';
import { ChangePasswordForm } from '@/modules/profile/components/ChangePasswordForm';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import type { UpdatePasswordInput } from '@/shared/validation/schemas/user.schema';

export default function PerfilContaPage() {
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
      toast.success('Senha alterada com sucesso');
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Erro ao alterar senha'));
      throw error; // Re-throw para que ChangePasswordForm não chame reset()
    }
  };

  const handleResetPassword = async () => {
    setSendingReset(true);

    try {
      await resetPassword(user.email);
      setResetSent(true);
      toast.success('Email de redefinicao enviado');
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Erro ao enviar email'));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Minha Conta</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.central)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Minha conta</h1>
            <p className="text-xs text-muted-foreground">
              Configuracoes de acesso, recuperacao e seguranca
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Autenticacao</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{user.email}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta superficie cuida apenas de acesso e seguranca. Privacidade da identidade,
            membros e configuracoes operacionais ficam em areas separadas.
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Este e o email usado para acessar sua conta. Para altera-lo, entre em
              contato com o suporte.
            </p>
          </CardContent>
        </Card>

        {/* ChangePasswordForm agora gerencia seu próprio estado interno via RHF */}
        <ChangePasswordForm
          onSave={handleChangePassword}
          onCancel={() => {/* estado interno ao componente */}}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recuperacao por email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Envie um fluxo de redefinicao para o email principal da conta.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetPassword}
              disabled={resetSent || sendingReset}
            >
              {sendingReset ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Enviando...
                </>
              ) : resetSent ? 'Email enviado' : 'Redefinir por email'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Zona de perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              A exclusao da conta e permanente e remove todos os seus perfis, dados e
              conteudo. Esta acao nao pode ser desfeita.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() =>
                toast.error('Para excluir sua conta, entre em contato com o suporte.')
              }
            >
              Solicitar exclusao da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
