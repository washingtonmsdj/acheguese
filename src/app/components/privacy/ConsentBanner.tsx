import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cookie, X, Shield } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { ConsentService } from "@/core/privacy/services/ConsentService";

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

export function ConsentBanner() {
  const { user } = useAuth();
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
  }, [isLoading, existingConsents]);

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
      queryClient.invalidateQueries({ queryKey: ["user-consents-check", user?.id] });
      setShowBanner(false);
      toast({
        title: "Preferencias salvas",
        description: "Suas preferencias de privacidade foram registradas.",
      });
    },
  });

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-50 rounded-2xl border bg-background/95 p-3 shadow-2xl backdrop-blur md:inset-x-0 md:bottom-0 md:rounded-none md:border-x-0 md:border-b-0 md:border-t md:p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-1 items-start gap-3 pr-8 sm:pr-0">
              <div className="shrink-0 rounded-full bg-primary/10 p-2">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Privacidade e Cookies</h3>
                <p className="text-xs text-muted-foreground">
                  Utilizamos cookies e dados pessoais para melhorar sua experiencia.
                </p>
              </div>
            </div>
            <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full sm:w-auto"
                onClick={() => setShowDetails(true)}
              >
                Personalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full sm:w-auto"
                onClick={() =>
                  saveConsentsMutation.mutate({
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    geolocation: false,
                  })
                }
                disabled={saveConsentsMutation.isPending}
              >
                Rejeitar
              </Button>
              <Button
                size="sm"
                className="col-span-2 h-9 w-full sm:col-span-1 sm:w-auto"
                onClick={() =>
                  saveConsentsMutation.mutate({
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    geolocation: true,
                  })
                }
                disabled={saveConsentsMutation.isPending}
              >
                Aceitar Todos
              </Button>
              <button
                onClick={() => setShowBanner(false)}
                className="absolute right-0 top-0 rounded p-1 hover:bg-muted sm:static sm:ml-2"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Preferencias de Privacidade
            </DialogTitle>
            <DialogDescription>
              Personalize como seus dados sao utilizados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Cookies Necessarios</Label>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Analytics e Metricas</Label>
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
                <Label className="font-medium">Geolocalizacao</Label>
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
              Salvar Preferencias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
