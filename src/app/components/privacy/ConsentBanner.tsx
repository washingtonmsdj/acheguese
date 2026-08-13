import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cookie, Shield, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import { ConsentService } from "@/core/privacy/services/ConsentService";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { useToast } from "@/shared/hooks/use-toast";

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

export function ConsentBanner() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    geolocation: false,
  });

  const { data: existingConsents, isLoading } = useQuery({
    queryKey: ["user-consents-check", user?.id],
    queryFn: async () => ConsentService.getExistingConsents(user?.id),
    enabled: true,
  });

  useEffect(() => {
    if (!isLoading && !existingConsents?.length) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [existingConsents, isLoading]);

  const saveConsentsMutation = useMutation({
    mutationFn: async (consents: ConsentPreferences) => {
      await ConsentService.saveConsentPreferences({
        userId: user?.id,
        preferences: {
          analytics: consents.analytics,
          marketing: consents.marketing,
          geolocation: consents.geolocation,
        },
        userAgent: navigator.userAgent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-consents-check", user?.id],
      });
      setShowBanner(false);
      toast({
        title: "Preferências salvas",
        description: "Suas preferências de privacidade foram registradas.",
      });
    },
  });

  const isAuthSurface =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/cadastro/confirmacao" ||
    pathname === "/aceitar-termos" ||
    pathname === "/onboarding" ||
    pathname === "/reset-password";
  const mobileBannerBottomClass =
    isAuthSurface || pathname === "/"
      ? "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      : "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]";

  const rejectOptionalConsents = () =>
    saveConsentsMutation.mutate({
      necessary: true,
      analytics: false,
      marketing: false,
      geolocation: false,
    });

  const acceptAllConsents = () =>
    saveConsentsMutation.mutate({
      necessary: true,
      analytics: true,
      marketing: true,
      geolocation: true,
    });

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
                disabled={saveConsentsMutation.isPending}
              >
                {"N\u00e3o"}
              </Button>
              <Button
                size="sm"
                className="h-7 rounded-lg !bg-teal-700 px-2 text-[0.62rem] font-medium !text-white hover:!bg-teal-800"
                onClick={acceptAllConsents}
                disabled={saveConsentsMutation.isPending}
              >
                OK
              </Button>
              <button
                type="button"
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
        </div>
      ) : (
        <div
          data-consent-banner
          className={`fixed inset-x-3 ${mobileBannerBottomClass} z-50 mx-auto max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur-xl md:left-auto md:right-4 md:mx-0 md:w-[40rem] md:max-w-[40rem] md:rounded-2xl md:p-3.5`}
        >
          {/* Mobile compact */}
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
              disabled={saveConsentsMutation.isPending}
            >
              Rejeitar
            </Button>
            <Button
              size="sm"
              className="h-7 shrink-0 rounded-lg !bg-teal-700 px-2.5 text-[0.65rem] font-semibold !text-white hover:!bg-teal-800"
              onClick={acceptAllConsents}
              disabled={saveConsentsMutation.isPending}
            >
              Aceitar
            </Button>
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Personalizar cookies"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Desktop / Tablet */}
          <div className="hidden md:flex md:flex-nowrap md:items-center md:gap-3">
            <div className="shrink-0 rounded-full bg-primary/10 p-2">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
                Privacidade e Cookies
              </h3>
              <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
                Utilizamos cookies e dados pessoais para melhorar sua
                experiência.
              </p>
            </div>
            <div className="flex shrink-0 flex-nowrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 whitespace-nowrap rounded-xl px-3 text-xs !text-muted-foreground hover:!bg-white/10 hover:!text-foreground"
                onClick={() => setShowDetails(true)}
              >
                Personalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 whitespace-nowrap rounded-xl border-slate-300 !bg-white px-4 text-xs font-medium !text-slate-950 hover:!bg-slate-100"
                onClick={rejectOptionalConsents}
                disabled={saveConsentsMutation.isPending}
              >
                Rejeitar
              </Button>
              <Button
                size="sm"
                className="h-9 whitespace-nowrap rounded-xl !bg-teal-700 px-4 text-xs font-semibold !text-white hover:!bg-teal-800"
                onClick={acceptAllConsents}
                disabled={saveConsentsMutation.isPending}
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
        </div>
      )}

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Preferências de privacidade
            </DialogTitle>
            <DialogDescription>
              Personalize como seus dados são utilizados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Cookies necessários</Label>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Analytics e métricas</Label>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Marketing</Label>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Geolocalização</Label>
              </div>
              <Switch
                checked={preferences.geolocation}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, geolocation: checked })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                saveConsentsMutation.mutate(preferences);
                setShowDetails(false);
              }}
              disabled={saveConsentsMutation.isPending}
              className="w-full sm:w-auto"
            >
              Salvar preferências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
