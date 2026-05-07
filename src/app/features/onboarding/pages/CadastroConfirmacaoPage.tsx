import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Home, Loader2, MailCheck, RefreshCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/core/auth/utils/authMessages';
import { getPendingSignupEmail } from '@/core/auth/utils/pendingSignup';
import { useToast } from '@/shared/hooks/use-toast';

export default function CadastroConfirmacaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendConfirmationEmail } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const email = useMemo(() => {
    const stateEmail = (location.state as { email?: string } | null)?.email;
    return stateEmail || getPendingSignupEmail();
  }, [location.state]);

  const handleResend = async () => {
    if (!email) {
      toast({
        title: 'Email nao encontrado',
        description: 'Refaca o cadastro para solicitar um novo email de confirmacao.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);

    try {
      await resendConfirmationEmail(email);
      toast({
        title: 'Email reenviado',
        description: 'Verifique sua caixa de entrada e a pasta de spam.',
      });
    } catch (error) {
      toast({
        title: 'Nao foi possivel reenviar',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Helmet>
        <title>Confirmar email | Achegue-se</title>
        <meta
          name="description"
          content="Confirme seu email para ativar sua conta Achegue-se e concluir seu acesso à comunidade."
        />
      </Helmet>

      <main id="main-content" tabIndex={-1} className="w-full max-w-sm space-y-6 text-center focus:outline-none">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <MailCheck className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Confirme seu email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enviamos um link de confirmacao para{' '}
            {email ? (
              <span className="font-medium text-foreground">{email}</span>
            ) : (
              'o email informado no cadastro'
            )}
            . Abra a mensagem e conclua a ativacao da sua conta.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 text-left space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Proximos passos
          </p>
          <ol className="space-y-2">
            {[
              'Abra sua caixa de entrada',
              'Procure o email do Achegue-se',
              'Clique em "Confirmar email"',
              'Volte para fazer login ou continuar autenticado',
            ].map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full h-11 gap-2"
            onClick={() => navigate('/login')}
          >
            Ir para o login
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Reenviar email
          </Button>

          <Button
            variant="ghost"
            className="w-full h-11 gap-2 text-muted-foreground"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
            Voltar ao inicio
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Nao recebeu o email? Verifique a pasta de spam ou{' '}
          <button
            onClick={() => navigate('/cadastro')}
            className="text-primary hover:underline font-medium"
          >
            refaca o cadastro
          </button>
          .
        </p>
      </main>
    </div>
  );
}
