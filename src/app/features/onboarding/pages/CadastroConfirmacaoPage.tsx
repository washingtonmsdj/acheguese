import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, MailCheck, RefreshCcw } from "lucide-react";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { getPendingSignupEmail } from "@/core/auth/utils/pendingSignup";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";

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
        title: "Email não encontrado",
        description: "Refaça o cadastro para solicitar um novo email de confirmação.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      await resendConfirmationEmail(email);
      toast({
        title: "Email reenviado",
        description: "Verifique sua caixa de entrada e a pasta de spam.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível reenviar",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Confirmar email | Achegue-se</title>
        <meta
          name="description"
          content="Confirme seu email para ativar sua conta Achegue-se e concluir seu acesso à comunidade."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-start justify-center px-4 pb-28 pt-6 focus:outline-none sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:pb-10 sm:pt-10 lg:items-center"
        >
          <section className="w-full max-w-md rounded-[28px] border border-border/70 bg-card/78 p-5 text-center shadow-[0_32px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary sm:h-12 sm:w-12">
                  <MailCheck className="h-6 w-6" />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                    Confirmação de conta
                  </p>
                  <h1 className="font-heading text-2xl font-bold text-foreground sm:text-[2rem]">
                    Confirme seu email
                  </h1>
                  <p className="text-sm leading-5 text-muted-foreground sm:leading-6">
                    Enviamos um link de confirmação para{" "}
                    {email ? <span className="font-medium text-foreground">{email}</span> : "o email informado"}.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 text-left sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                  Próximos passos
                </p>
                <ol className="mt-3 space-y-2">
                  {[
                    "Abra sua caixa de entrada.",
                    "Procure o email do Achegue-se.",
                    'Clique em "Confirmar email".',
                    "Volte para entrar na sua conta.",
                  ].map((step, index) => (
                    <li key={step} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[0.68rem] font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="leading-5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <Button className="h-10.5 w-full gap-2 sm:h-11" onClick={() => navigate("/login")}>
                  Ir para o login
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10.5 w-full gap-2 sm:h-11"
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
                  className="h-10.5 w-full text-sm text-muted-foreground sm:h-11"
                  onClick={() => navigate("/cadastro")}
                >
                  Voltar ao cadastro
                </Button>
              </div>

              <p className="text-[0.76rem] leading-5 text-muted-foreground">
                Não recebeu o email? Verifique a pasta de spam ou tente reenviar.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
