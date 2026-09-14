import { lazy, Suspense, useEffect, useState } from "react";
import { Cookie, Shield, X } from "lucide-react";

import { PRELAUNCH_LOCKDOWN_ENABLED } from "@/app/config/launchScope";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { ConsentService } from "@/core/privacy/services/ConsentService";
import { useSessionUserId } from "@/core/session/hooks/useSessionUserId";
import { Button } from "@/shared/components/ui/button";
import type { ConsentPreferences } from "./ConsentPreferencesDialog";

const loadConsentPreferencesDialog = () => import("./ConsentPreferencesDialog");
const ConsentPreferencesDialog = lazy(loadConsentPreferencesDialog);

type ExistingConsent = {
  consent_type: string;
  granted: boolean;
};

export interface ConsentBannerContentProps {
  pathname: string;
}

export function ConsentBannerContent({ pathname }: ConsentBannerContentProps) {
  const userId = useSessionUserId();
  const [existingConsents, setExistingConsents] = useState<ExistingConsent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    geolocation: false,
  });

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setSaveError(null);

    void ConsentService.getExistingConsents(userId ?? undefined)
      .then((consents) => {
        if (cancelled) return;
        setExistingConsents(consents);
      })
      .catch(() => {
        if (cancelled) return;
        // Falha na leitura nao deve suprimir a escolha do usuario.
        setExistingConsents(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (isLoading || existingConsents?.length) {
      setShowBanner(false);
      return;
    }

    const timer = window.setTimeout(() => setShowBanner(true), 1000);
    return () => window.clearTimeout(timer);
  }, [existingConsents, isLoading]);

  const saveConsentPreferences = async (consents: ConsentPreferences) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await ConsentService.saveConsentPreferences({
        userId: userId ?? undefined,
        preferences: {
          analytics: consents.analytics,
          marketing: consents.marketing,
          geolocation: consents.geolocation,
        },
        userAgent: navigator.userAgent,
      });
      setShowBanner(false);
      setShowDetails(false);
      setExistingConsents([
        { consent_type: "cookies", granted: true },
        { consent_type: "analytics", granted: consents.analytics },
        { consent_type: "marketing", granted: consents.marketing },
        { consent_type: "geolocation", granted: consents.geolocation },
        { consent_type: "privacy_policy", granted: true },
      ]);
    } catch {
      setSaveError("Não foi possível salvar suas preferências. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const isAuthSurface =
    pathname === AUTH_PATHS.login ||
    pathname === AUTH_PATHS.signup ||
    pathname === AUTH_PATHS.signupConfirmation ||
    pathname === AUTH_PATHS.termsAcceptance ||
    pathname === "/onboarding" ||
    pathname === AUTH_PATHS.passwordReset;
  const mobileBannerBottomClass =
    isAuthSurface || pathname === "/"
      ? "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      : "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]";

  const rejectOptionalConsents = () => {
    void saveConsentPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      geolocation: false,
    });
  };

  const acceptAllConsents = () => {
    void saveConsentPreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      geolocation: true,
    });
  };

  const warmPreferencesDialog = () => {
    void loadConsentPreferencesDialog();
  };

  if (pathname === "/onboarding") return null;
  if (PRELAUNCH_LOCKDOWN_ENABLED && pathname === "/") return null;
  if (!showBanner) return null;

  return (
    <>
      {isAuthSurface ? (
        <div
          data-consent-banner
          className={`fixed inset-x-4 ${mobileBannerBottomClass} z-50 mx-auto max-w-[20rem] rounded-[20px] border border-border/70 bg-background/94 px-2.5 py-2 shadow-[0_20px_48px_-28px_rgba(0,0,0,0.85)] backdrop-blur-xl`}
        >
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Cookie className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0">
              <p className="text-[0.66rem] font-semibold leading-none text-foreground">
                Cookies
              </p>
              <p className="mt-0.5 truncate text-[0.56rem] leading-none text-muted-foreground">
                {"Seguran\u00e7a e prefer\u00eancias."}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-lg border-slate-300 !bg-white px-2 text-[0.62rem] font-medium !text-slate-950 hover:!bg-slate-100"
                onClick={rejectOptionalConsents}
                disabled={isSaving}
              >
                {"N\u00e3o"}
              </Button>
              <Button
                size="sm"
                className="h-7 rounded-lg !bg-teal-700 px-2 text-[0.62rem] font-medium !text-white hover:!bg-teal-800"
                onClick={acceptAllConsents}
                disabled={isSaving}
              >
                OK
              </Button>
              <button
                type="button"
                onMouseEnter={warmPreferencesDialog}
                onFocus={warmPreferencesDialog}
                onClick={() => setShowDetails(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-100 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Personalizar cookies"
              >
                <Shield className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-100 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {saveError ? (
            <p role="alert" className="mt-2 text-[0.62rem] text-destructive">
              {saveError}
            </p>
          ) : null}
        </div>
      ) : (
        <div
          data-consent-banner
          className={`fixed inset-x-3 ${mobileBannerBottomClass} z-50 mx-auto max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur-xl md:left-auto md:right-4 md:mx-0 md:w-[40rem] md:max-w-[40rem] md:rounded-2xl md:p-3.5`}
        >
          <div className="flex items-center gap-2 md:hidden">
            <div className="shrink-0 rounded-full bg-primary/10 p-1.5">
              <Cookie className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="min-w-0 flex-1 truncate text-[0.7rem] font-medium leading-tight text-foreground">
              Usamos cookies para melhorar sua experiência.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 shrink-0 rounded-lg border-slate-300 !bg-white px-2 text-[0.65rem] font-semibold !text-slate-950 hover:!bg-slate-100"
              onClick={rejectOptionalConsents}
              disabled={isSaving}
            >
              Rejeitar
            </Button>
            <Button
              size="sm"
              className="h-7 shrink-0 rounded-lg !bg-teal-700 px-2.5 text-[0.65rem] font-semibold !text-white hover:!bg-teal-800"
              onClick={acceptAllConsents}
              disabled={isSaving}
            >
              Aceitar
            </Button>
            <button
              type="button"
              onMouseEnter={warmPreferencesDialog}
              onFocus={warmPreferencesDialog}
              onClick={() => setShowDetails(true)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Personalizar cookies"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="hidden md:flex md:flex-nowrap md:items-center md:gap-3">
            <div className="shrink-0 rounded-full bg-primary/10 p-2">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
                Privacidade e Cookies
              </h3>
              <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
                Utilizamos cookies e dados pessoais para melhorar sua experiência.
              </p>
            </div>
            <div className="flex shrink-0 flex-nowrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 whitespace-nowrap rounded-xl px-3 text-xs !text-muted-foreground hover:!bg-white/10 hover:!text-foreground"
                onMouseEnter={warmPreferencesDialog}
                onFocus={warmPreferencesDialog}
                onClick={() => setShowDetails(true)}
              >
                Personalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 whitespace-nowrap rounded-xl border-slate-300 !bg-white px-4 text-xs font-medium !text-slate-950 hover:!bg-slate-100"
                onClick={rejectOptionalConsents}
                disabled={isSaving}
              >
                Rejeitar
              </Button>
              <Button
                size="sm"
                className="h-9 whitespace-nowrap rounded-xl !bg-teal-700 px-4 text-xs font-semibold !text-white hover:!bg-teal-800"
                onClick={acceptAllConsents}
                disabled={isSaving}
              >
                Aceitar todos
              </Button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {saveError ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {saveError}
            </p>
          ) : null}
        </div>
      )}

      {showDetails ? (
        <Suspense fallback={null}>
          <ConsentPreferencesDialog
            open={showDetails}
            onOpenChange={setShowDetails}
            preferences={preferences}
            onPreferencesChange={setPreferences}
            onSave={() => {
              void saveConsentPreferences(preferences);
            }}
            isSaving={isSaving}
            saveError={saveError}
          />
        </Suspense>
      ) : null}
    </>
  );
}
