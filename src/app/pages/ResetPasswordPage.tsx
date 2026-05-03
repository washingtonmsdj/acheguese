/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { InlineFieldError } from '@/shared/components/ui/InlineFieldError';
import { CheckCircle, Eye, EyeOff, Key, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/core/auth';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/core/auth/utils/authMessages';
import { getAuthPasswordRequirementStatus } from '@/core/auth/utils/passwordPolicy';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ResetPasswordFormSchema,
  type ResetPasswordFormInput,
} from '@/shared/validation/schemas/user.schema';

type RecoveryState = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, updatePassword, resetPasswordByIdentifier } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(
    // Se chegou com ?expired=1, já sabemos que é inválido
    searchParams.get('expired') === '1' ? 'invalid' : 'checking'
  );
  const [resendEmail, setResendEmail] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: 'onBlur',
  });

  // Derivado do watch para o PasswordStrengthIndicator em tempo real
  const newPasswordValue = watch('newPassword') ?? '';
  const passwordRequirements = useMemo(
    () => getAuthPasswordRequirementStatus(newPasswordValue),
    [newPasswordValue],
  );

  useEffect(() => {
    // Se já sabemos que é inválido (ex: ?expired=1), não precisa verificar
    if (recoveryState === 'invalid') return;

    // Caso 1: hash da URL tem access_token + type=recovery (implicit flow)
    // Com flowType='implicit' o SDK processa automaticamente, mas como fallback
    // também tentamos via setSession caso o hash ainda esteja disponível
    const hashParams = AuthService.captureAuthHash();
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');

    if (accessToken && hashType === 'recovery') {
      AuthService.applyRecoverySession(accessToken, refreshToken).then((isApplied) => {
        setRecoveryState(isApplied ? 'ready' : 'invalid');
      });
      return;
    }

    // Caso 2: URL já tem o marcador de recovery (redirect com ?mode=recovery)
    if (AuthService.isRecoveryRedirect()) {
      setRecoveryState('ready');
      return;
    }

    // Caso 3: usuário já autenticado via sessão de recovery ativa
    if (user) {
      setRecoveryState('ready');
      return;
    }

    // Caso 4: aguardar evento PASSWORD_RECOVERY do SDK Supabase (PKCE flow com ?code=)
    const unsubscribeRecovery = AuthService.onPasswordRecovery(() => {
      setRecoveryState('ready');
    });

    // Timeout de segurança: se nenhum evento chegar em 3s, link é inválido
    const invalidTimer = window.setTimeout(() => {
      setRecoveryState((current) => (current === 'checking' ? 'invalid' : current));
    }, 3000);

    return () => {
      window.clearTimeout(invalidTimer);
      unsubscribeRecovery();
    };
  }, [user]);

  const onValid = async (data: ResetPasswordFormInput) => {
    if (recoveryState !== 'ready') {
      toast({
        title: 'Link invalido ou expirado',
        description: 'Solicite um novo email de recuperacao.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updatePassword(data.newPassword);
      setDone(true);
      toast({ title: 'Senha redefinida com sucesso.' });
      window.setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleResendLink = async () => {
    if (!resendEmail.trim()) {
      toast({ title: 'Informe seu email para reenviar o link.', variant: 'destructive' });
      return;
    }
    setIsSendingLink(true);
    try {
      await resetPasswordByIdentifier(resendEmail.trim());
      toast({ title: 'Link enviado', description: 'Verifique sua caixa de entrada.' });
    } catch (error) {
      toast({ title: 'Erro ao enviar', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setIsSendingLink(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-xl font-bold">Senha redefinida</h1>
          <p className="text-sm text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (recoveryState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Link expirado</h1>
            <p className="text-sm text-muted-foreground">
              O link de recuperacao de senha expirou. Informe seu email para receber um novo link.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <label className="text-xs font-medium text-muted-foreground block">Email</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResendLink()}
            />
            <Button className="w-full" onClick={handleResendLink} disabled={isSendingLink}>
              {isSendingLink ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Enviar novo link
            </Button>
          </div>
          <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/login')}>
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina uma nova senha segura para acessar sua conta.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
          noValidate
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Nova senha
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
                aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <InlineFieldError id="new-password-error" message={errors.newPassword?.message} />
          </div>

          {/* PasswordStrengthIndicator — alimentado por watch('newPassword') */}
          <div className="space-y-1 rounded-xl border border-border/60 bg-secondary/30 p-3">
            {passwordRequirements.map((requirement) => (
              <div
                key={requirement.id}
                className={`text-xs ${requirement.satisfied ? 'text-success' : 'text-muted-foreground'}`}
              >
                {requirement.satisfied ? 'OK' : '•'} {requirement.label}
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Confirmar senha
            </label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              aria-describedby={errors.confirmNewPassword ? 'confirm-password-error' : undefined}
              {...register('confirmNewPassword')}
            />
            <InlineFieldError
              id="confirm-password-error"
              message={errors.confirmNewPassword?.message}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || recoveryState !== 'ready'}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : null}
            Redefinir senha
          </Button>
        </form>
      </div>
    </div>
  );
}

