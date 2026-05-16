import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { InlineFieldError } from '@/shared/components/ui/InlineFieldError';
import { AtSign, CheckCircle2, Eye, EyeOff, Home, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { parseAuthIdentifier } from '@/core/auth/utils/authIdentifier';
import { getAuthErrorMessage } from '@/core/auth/utils/authMessages';
import { clearPendingSignupEmail } from '@/core/auth/utils/pendingSignup';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/cn';
import {
  LoginIdentifierSchema,
  type LoginIdentifierInput,
} from '@/shared/validation/schemas/user.schema';

type PendingAction = 'login' | 'recovery' | 'google' | null;

export default function LoginPage() {
  const {
    user,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    resetPasswordByIdentifier,
    googleAuthAvailable,
  } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectTo = (location.state as any)?.redirectTo || searchParams.get('redirect') || '/';
  const isEmailConfirmed = searchParams.get('confirmed') === '1';
  const isPasswordReset = searchParams.get('passwordReset') === '1';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginIdentifierInput>({
    resolver: zodResolver(LoginIdentifierSchema),
    mode: 'onBlur',
  });

  // Derivado do watch para detecção de tipo de identificador (UX: ícone AtSign vs Mail)
  const identifierValue = watch('identifier') ?? '';
  const parsedIdentifier = parseAuthIdentifier(identifierValue);
  const isUsername = parsedIdentifier?.kind === 'username';

  const statusMessage = useMemo(() => {
    if (isEmailConfirmed) {
      return {
        icon: CheckCircle2,
        title: 'Email confirmado',
        description: 'Sua conta esta pronta para login.',
      };
    }

    if (isPasswordReset) {
      return {
        icon: ShieldCheck,
        title: 'Senha atualizada',
        description: 'Entre com a nova senha para continuar.',
      };
    }

    return null;
  }, [isEmailConfirmed, isPasswordReset]);
  const StatusIcon = statusMessage?.icon;

  useEffect(() => {
    if (isEmailConfirmed) {
      clearPendingSignupEmail();
    }
  }, [isEmailConfirmed]);

  useEffect(() => {
    if (!user) return;
    clearPendingSignupEmail();
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);

  const onValid = async (data: LoginIdentifierInput) => {
    const parsed = parseAuthIdentifier(data.identifier);
    if (!parsed) return;

    setPendingAction('login');

    try {
      if (parsed.kind === 'username') {
        await signInWithUsername({ username: parsed.value, password: data.password });
        return;
      }
      await signIn({ email: parsed.value, password: data.password });
    } catch (error) {
      toast({
        title: 'Erro ao entrar',
        description: getAuthErrorMessage(error, 'Verifique suas credenciais e tente novamente.'),
        variant: 'destructive',
      });
      setPendingAction(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!parsedIdentifier) {
      toast({
        title: 'Informe email ou usuario',
        description: 'Usamos esse identificador para enviar a recuperacao de senha.',
        variant: 'destructive',
      });
      return;
    }

    setPendingAction('recovery');

    try {
      await resetPasswordByIdentifier(parsedIdentifier.raw);
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch {
      // Evita vazamento de existencia de conta via UX.
      toast({
        title: 'Solicitacao recebida',
        description:
          'Se o identificador estiver cadastrado, voce recebera as instrucoes de recuperacao em instantes.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    setPendingAction('google');

    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: 'Google indisponivel',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null;

  return (
    <>
      <Helmet>
        <title>Entrar | Achegue-se</title>
        <meta
          name="description"
          content="Entre na sua conta Achegue-se para acessar seu perfil, seus negocios e a sua comunidade."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full max-w-sm space-y-6 focus:outline-none"
        >
          <div className="text-center space-y-3">
            <button
              onClick={() => navigate('/')}
              className="mx-auto flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Voltar ao inicio"
            >
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-heading">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Entre para acessar seu perfil, seus negocios e a sua comunidade.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
              <div className="flex items-start gap-3">
                {StatusIcon && <StatusIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{statusMessage.title}</p>
                  <p className="text-xs text-muted-foreground">{statusMessage.description}</p>
                </div>
              </div>
            </div>
          )}

          {googleAuthAvailable && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2 border-border"
                onClick={handleGoogleLogin}
                disabled={isBusy}
              >
                {pendingAction === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Entrar com Google
              </Button>
            </div>
          )}

          {googleAuthAvailable && (
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>
          )}

          <form onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-identifier">Email ou nome de usuario</Label>
              <div className="relative">
                <Input
                  id="login-identifier"
                  type="text"
                  placeholder="seu@email.com ou @seunome"
                  className={cn('h-11 pr-10', errors.identifier && 'border-destructive')}
                  autoComplete="username"
                  autoCapitalize="none"
                  disabled={isBusy}
                  aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
                  {...register('identifier')}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {isUsername ? <AtSign className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </div>
              </div>
              <InlineFieldError id="login-identifier-error" message={errors.identifier?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Senha</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  className={cn('h-11 pr-10', errors.password && 'border-destructive')}
                  autoComplete="current-password"
                  disabled={isBusy}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <InlineFieldError id="login-password-error" message={errors.password?.message} />
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary font-medium block ml-auto hover:underline"
                disabled={pendingAction === 'recovery'}
              >
                {pendingAction === 'recovery' ? 'Enviando recuperacao...' : 'Esqueci minha senha'}
              </button>
              <p className="text-xs text-muted-foreground">
                A recuperacao funciona com email ou @usuario.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isBusy}
            >
              {pendingAction === 'login' ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-1.5" />
              )}
              Entrar
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Nao tem conta?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10 font-semibold gap-1.5"
              onClick={() => navigate('/cadastro')}
            >
              Criar conta gratis
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
