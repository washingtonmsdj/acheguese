import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  COMMUNITY_GUIDELINES_PATH,
  hasCurrentTermsAcceptance,
  TERMS_OF_SERVICE_PATH,
  TERMS_OF_SERVICE_VERSION,
} from "@/core/legal/termsOfService";
import { PrivacySettingsService } from "@/core/privacy/services/PrivacySettingsService";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";

type AcceptanceState =
  | "checking"
  | "needs-acceptance"
  | "accepted"
  | "signed-out";

export default function AceiteTermosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<AcceptanceState>("checking");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setState("signed-out");
      return;
    }

    let active = true;
    setState("checking");

    void PrivacySettingsService.getUserConsents(user.id)
      .then((consents) => {
        if (!active) return;
        setState(
          consents.some((consent) => hasCurrentTermsAcceptance(consent))
            ? "accepted"
            : "needs-acceptance",
        );
      })
      .catch(() => {
        if (active) setState("needs-acceptance");
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleAccept = async () => {
    if (!user || !accepted) return;

    setSubmitting(true);
    try {
      await PrivacySettingsService.recordConsent({
        userId: user.id,
        consentType: "terms_of_service",
        granted: true,
        userAgent: navigator.userAgent,
        termsVersion: TERMS_OF_SERVICE_VERSION,
      });
      setState("accepted");
      toast({ title: "Aceite registrado" });
    } catch {
      toast({
        title: "Não foi possível registrar o aceite",
        description: "Tente novamente antes de continuar.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = state === "accepted";

  return (
    <>
      <Helmet>
        <title>Aceitar termos | Achegue-se</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-xl px-4 py-10 sm:py-16"
        >
          <section className="w-full rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Conta e comunidade
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">
                  Aceite dos Termos de Uso
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  As Diretrizes da Comunidade fazem parte dos Termos de Uso e
                  orientam a participação segura na plataforma.
                </p>
              </div>
            </div>

            {state === "checking" ? (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando o aceite da sua conta...
              </div>
            ) : null}

            {state === "signed-out" ? (
              <div className="mt-8 space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Conclua sua autenticação para registrar o aceite dos Termos de
                  Uso.
                </p>
                <Button asChild className="w-full">
                  <Link to="/login">Ir para entrar</Link>
                </Button>
              </div>
            ) : null}

            {state === "needs-acceptance" ? (
              <div className="mt-8 space-y-5">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms-acceptance"
                      checked={accepted}
                      onCheckedChange={(checked) =>
                        setAccepted(checked === true)
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="terms-acceptance"
                      className="cursor-pointer text-sm leading-6 text-foreground"
                    >
                      Li e aceito os Termos de Uso, incluindo as Diretrizes da
                      Comunidade.
                    </Label>
                  </div>
                  <p className="mt-3 pl-7 text-xs leading-5 text-muted-foreground">
                    Consulte os{" "}
                    <Link
                      to={TERMS_OF_SERVICE_PATH}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e as{" "}
                    <Link
                      to={COMMUNITY_GUIDELINES_PATH}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Diretrizes da Comunidade
                    </Link>
                    .
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!accepted || submitting}
                  onClick={() => void handleAccept()}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Registrar aceite e continuar
                </Button>
              </div>
            ) : null}

            {canContinue ? (
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-foreground">
                    O aceite da versão {TERMS_OF_SERVICE_VERSION} está
                    registrado para sua conta.
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Continuar para o Achegue-se
                </Button>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </>
  );
}
