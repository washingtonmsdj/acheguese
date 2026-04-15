import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { CheckCircle, Eye, EyeOff, Key, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/core/auth';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/core/auth/utils/authMessages';
import {
  getAuthPasswordRequirementStatus,
  validateAuthPassword,
} from '@/core/auth/utils/passwordPolicy';
import { useToast } from '@/shared/hooks/use-toast';

type RecoveryState = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(
    AuthService.isRecoveryRedirect() ? 'ready' : 'checking',
  );

  const passwordRequirements = useMemo(
    () => getAuthPasswordRequirementStatus(password),
    [password],
  );

  useEffect(() => {
    if (AuthService.isRecoveryRedirect() || user) {
      setRecoveryState('ready');
      return;
    }

    const invalidTimer = window.setTimeout(() => {
      setRecoveryState((current) => (current === 'checking' ? 'invalid' : current));
    }, 1200);

    return () => {
      window.clearTimeout(invalidTimer);
    };
  }, [user]);

  const handleSubmit = async () => {
    const passwordError = validateAuthPassword(password);

    if (passwordError) {
      toast({
        title: 'Senha invalida',
        description: passwordError,
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas nao coincidem',
        description: 'Repita a mesma senha nos dois campos.',
        variant: 'destructive',
      });
      return;
    }

    if (recoveryState !== 'ready') {
      toast({
        title: 'Link invalido ou expirado',
        description: 'Solicite um novo email de recuperacao.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setDone(true);
      toast({ title: 'Senha redefinida com sucesso.' });
      window.setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Nova senha
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

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
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading || recoveryState !== 'ready'} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : null}
            Redefinir senha
          </Button>
        </div>
      </div>
    </div>
  );
}
