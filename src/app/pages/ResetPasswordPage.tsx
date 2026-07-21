/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle, Key, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate, useAuthTurnstile } from "@/app/components/auth/AuthTurnstileGate";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { AUTH_BROWSER_STORAGE_CONFIG } from "@/config/security.config";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/core/auth/utils/passwordPolicy";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useToast } from "@/shared/hooks/use-toast";
import {
  ResetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@/shared/validation/schemas/user.schema";

type RecoveryState = "checking" | "ready" | "invalid";

function AuthStatusCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-card/78 p-6 text-center shadow-[0_32px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8">
      <div className="space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground font-heading">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, updatePassword, resetPasswordByIdentifier } = useAuth();
  const [done, setDone] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(
    searchParams.get("expired") === "1" ? "invalid" : "checking",
  );
  const [resendEmail, setResendEmail] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTurnstile = useAuthTurnstile();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onBlur",
  });

  const newPasswordValue = watch("newPassword") ?? "";

  useEffect(() => {
    if (recoveryState === "invalid") return;

    if (AuthService.isRecoveryRedirect()) {
      setRecoveryState("ready");
      return;
    }

    if (user) {
      setRecoveryState("ready");
      return;
    }

    const unsubscribeRecovery = AuthService.onPasswordRecovery(() => {
      setRecoveryState("ready");
    });

    const invalidTimer = window.setTimeout(() => {
      setRecoveryState((current) => (current === "checking" ? "invalid" : current));
    }, AUTH_BROWSER_STORAGE_CONFIG.recoveryEventTimeoutMs);

    return () => {
      window.clearTimeout(invalidTimer);
      unsubscribeRecovery();
    };
  }, [user]);

  const onValid = async (data: ResetPasswordFormInput) => {
    if (recoveryState !== "ready") {
      toast({
        title: "Link inválido ou expirado",
        description: "Solicite um novo email de recuperação.",
        variant: "destructive",
      });
      return;
    }

    try {
      const compromise = await checkPasswordCompromise(data.newPassword);
      if (compromise.blocked) {
        toast({
          title: "Senha comprometida",
          description: compromise.message,
          variant: "destructive",
        });
        return;
      }

      await updatePassword(data.newPassword);
      setDone(true);
      toast({ title: "Senha redefinida com sucesso." });
      window.setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleResendLink = async () => {
    if (!resendEmail.trim()) {
      toast({
        title: "Informe seu email para reenviar o link.",
        variant: "destructive",
      });
      return;
    }
    if (resendCooldown > 0 || isSendingLink) return;

    setIsSendingLink(true);
    try {
      await resetPasswordByIdentifier(resendEmail.trim());
      toast({ title: "Link enviado", description: "Verifique sua caixa de entrada." });
      setResendCooldown(60);
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSendingLink(false);
    }
  };

  if (done) {
    return (
      <>
        <Helmet>
          <title>Senha redefinida | Achegue-se</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />
          <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-start justify-center px-4 pb-28 pt-6 focus:outline-none sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:pb-10 sm:pt-10 lg:items-center">
            <AuthStatusCard
              icon={<CheckCircle className="h-6 w-6" />}
              title="Senha redefinida"
              description="Sua senha foi atualizada. Você será redirecionado em instantes."
            />
          </main>
          <AuthFooter />
        </div>
      </>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <>
        <Helmet>
          <title>Link expirado | Achegue-se</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />
          <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-start justify-center px-4 pb-28 pt-6 focus:outline-none sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:pb-10 sm:pt-10 lg:items-center">
            <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-card/78 p-6 shadow-[0_32px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8">
              <div className="space-y-6">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Key className="h-5.5 w-5.5" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                      Recuperação
                    </p>
                    <h1 className="font-heading text-2xl font-bold text-foreground">
                      Link expirado
                    </h1>
                    <p className="text-sm leading-6 text-muted-foreground">
                      O link expirou. Informe seu email para receber uma nova recuperação.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleResendLink()}
                    className="h-11"
                  />
                  <Button
                    className="h-11 w-full"
                    onClick={handleResendLink}
                    disabled={isSendingLink || resendCooldown > 0}
                    aria-live="polite"
                  >
                    {isSendingLink ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Enviar novo link"}
                  </Button>
                </div>

                <Button variant="ghost" className="w-full text-sm" onClick={() => navigate("/login")}>
                  Voltar ao login
                </Button>
              </div>
            </div>
          </main>
          <AuthFooter />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Redefinir senha | Achegue-se</title>
        <meta
          name="description"
          content="Defina uma nova senha segura para acessar sua conta no Achegue-se."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />
        <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-start justify-center px-4 pb-28 pt-6 focus:outline-none sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:pb-10 sm:pt-10 lg:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-card/78 p-6 shadow-[0_32px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8">
            <div className="space-y-6">
              <div className="space-y-3 text-center sm:space-y-4">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                    Segurança da conta
                  </p>
                  <h1 className="font-heading text-2xl font-bold text-foreground sm:text-[2rem]">
                    Redefinir senha
                  </h1>
                  <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                    Defina uma nova senha segura para voltar a acessar sua conta.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit(onValid)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nova senha
                  </label>
                  <PasswordInput
                    placeholder={`M\u00ednimo ${AUTH_PASSWORD_MIN_LENGTH} caracteres`}
                    autoComplete="new-password"
                    invalid={Boolean(errors.newPassword)}
                    showStrength
                    strengthValue={newPasswordValue}
                    aria-describedby={errors.newPassword ? "new-password-error" : undefined}
                    {...register("newPassword")}
                  />
                  <InlineFieldError id="new-password-error" message={errors.newPassword?.message} />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Confirmar senha
                  </label>
                  <PasswordInput
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    invalid={Boolean(errors.confirmNewPassword)}
                    aria-describedby={errors.confirmNewPassword ? "confirm-password-error" : undefined}
                    {...register("confirmNewPassword")}
                  />
                  <InlineFieldError
                    id="confirm-password-error"
                    message={errors.confirmNewPassword?.message}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || recoveryState !== "ready"}
                  className="h-11 w-full"
                >
                  {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Redefinir senha
                </Button>
              </form>
            </div>
          </div>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
