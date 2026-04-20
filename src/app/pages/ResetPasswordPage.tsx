import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { InlineFieldError } from '@/shared/components/ui/InlineFieldError';
import { CheckCircle, Eye, EyeOff, Key, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/core/auth';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase';
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
  const { toast } = useToast();
  const { user, updatePassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');

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
    // Caso 1: URL já tem o marcador de recovery (redirect com ?mode=recovery)
    if (AuthService.isRecoveryRedirect()) {
      setRecoveryState('ready');
      return;
    }

    // Caso 2: usuário já autenticado via sessão de recovery ativa
    if (user) {
      setRecoveryState('ready');
      return;
    }

    // Caso 3: aguardar evento PASSWORD_RECOVERY do SDK Supabase
    // O SDK processa o hash/code de forma assíncrona e emite este evento
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryState('ready');
      }
    });

    // Timeout de segurança: se nenhum evento chegar em 3s, link é inválido
    const invalidTimer = window.setTimeout(() => {
      setRecoveryState((current) => (current === 'checking' ? 'invalid' : current));
    }, 3000);

    return () => {
      window.clearTimeout(invalidTimer);
      subscription.unsubscribe();
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
            <h1 className="text-xl font-bold">Link invalido ou expirado</h1>
            <p className="text-sm text-muted-foreground">
              Solicite uma nova recuperacao de senha a partir do login.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate('/login')}>
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
