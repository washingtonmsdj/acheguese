import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  clearPendingAuthReturn,
  getPendingAuthReturn,
} from "@/core/auth/utils/pendingAuthReturn";
import {
  COMMUNITY_GUIDELINES_PATH,
  hasCurrentTermsAcceptance,
  TERMS_OF_SERVICE_PATH,
  TERMS_OF_SERVICE_VERSION,
} from "@/core/legal/termsOfService";
import { PrivacySettingsService } from "@/core/privacy/services/PrivacySettingsService";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

type AcceptanceState = "checking" | "needs-acceptance" | "accepted" | "signed-out";

export default function AceiteTermosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<AcceptanceState>("checking");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const returnTo = useMemo(
    () => resolveSafeInternalPath(getPendingAuthReturn(), "/"),
    [],
  );

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
    if (!user || !accepted || submitting) return;
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

  const continueSafely = () => {
    clearPendingAuthReturn();
    navigate(returnTo, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Aceitar termos | Achegue-se</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33]">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[430px] px-6 pb-6 pt-4 focus:outline-none">
          <section className="rounded-2xl border border-[#d6dedc] bg-white p-5 shadow-[0_18px_55px_rgba(17,55,59,.06)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#0b5b59]">
                <AuthConceptIcon name="shield" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b5b59]">Conta e comunidade</p>
                <h1 className="mt-1 font-heading text-[24px] font-extrabold tracking-[-0.035em]">Termos de Uso</h1>
                <p className="mt-2 text-[13px] leading-5 text-[#526a6d]">
                  As Diretrizes da Comunidade fazem parte dos Termos e orientam a participação segura no Achegue-se.
                </p>
              </div>
            </div>

            {state === "checking" ? (
              <div role="status" className="flex items-center gap-3 py-10 text-[13px] text-[#607477]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd5d3] border-t-[#0b5b59]" />
                Verificando o aceite da sua conta…
              </div>
            ) : null}

            {state === "signed-out" ? (
              <div className="mt-7 space-y-4">
                <p className="text-[13px] leading-5 text-[#607477]">Conclua sua autenticação para registrar o aceite.</p>
                <Link
                  to={returnTo === "/" ? "/login" : `/login?redirect=${encodeURIComponent(returnTo)}`}
                  className="flex h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33]"
                >
                  Ir para entrar
                </Link>
              </div>
            ) : null}

            {state === "needs-acceptance" ? (
              <div className="mt-7 space-y-5">
                <div className="rounded-xl bg-[#f3f1ea] p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox id="terms-acceptance" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} className="mt-0.5" />
                    <Label htmlFor="terms-acceptance" className="cursor-pointer text-[13px] font-normal leading-5">
                      Li e aceito os Termos de Uso, incluindo as Diretrizes da Comunidade.
                    </Label>
                  </div>
                  <p className="mt-3 pl-8 text-[11px] leading-4 text-[#607477]">
                    Consulte os <Link to={TERMS_OF_SERVICE_PATH} target="_blank" rel="noreferrer" className="font-medium underline">Termos</Link> e as <Link to={COMMUNITY_GUIDELINES_PATH} target="_blank" rel="noreferrer" className="font-medium underline">Diretrizes da comunidade</Link>.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!accepted || submitting}
                  onClick={() => void handleAccept()}
                  className="h-11 w-full rounded-[9px] bg-[#ffc91a] text-[14px] font-extrabold text-[#102f33] disabled:opacity-55"
                >
                  {submitting ? "Registrando…" : "Registrar aceite e continuar"}
                </button>
              </div>
            ) : null}

            {state === "accepted" ? (
              <div className="mt-7 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-[#eaf7ef] p-4 text-[#276a4d]">
                  <AuthConceptIcon name="check" />
                  <p className="text-[12px] leading-5">O aceite da versão {TERMS_OF_SERVICE_VERSION} está registrado.</p>
                </div>
                <button type="button" onClick={continueSafely} className="h-11 w-full rounded-[9px] bg-[#0b5b59] text-[14px] font-bold text-white">
                  Continuar para o Achegue-se
                </button>
              </div>
            ) : null}
          </section>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
