/**
 * ══════════════════════════════════════════════════════════════════════════
 * CONSENT BANNER - LGPD / GDPR
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Banner de consentimento de cookies e processamento de dados.
 * Implementa conformidade com LGPD Art. 8º e Art. 14.
 *
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { ConsentService } from '@/core/privacy/services/ConsentService';

interface ConsentPreferences {
  necessary: boolean; // Sempre true - não pode ser desabilitado
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

  // Verificar se usuário já tem consentimento registrado
  const { data: existingConsents, isLoading } = useQuery({
    queryKey: ['user-consents-check', user?.id],
    queryFn: async () => ConsentService.getExistingConsents(user?.id),
    enabled: true,
  });

  // Mostrar banner se não tiver consentimento
  useEffect(() => {
    if (!isLoading && !existingConsents?.length) {
      // Delay para não mostrar imediatamente ao carregar
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, existingConsents]);

  // Mutação para salvar consentimentos
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
      queryClient.invalidateQueries({ queryKey: ['user-consents-check', user?.id] });
      setShowBanner(false);
      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de privacidade foram registradas.',
      });
    },
  });

  const handleAcceptAll = () => {
    const allConsents: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      geolocation: true,
    };
    setPreferences(allConsents);
    saveConsentsMutation.mutate(allConsents);
  };

  const handleRejectAll = () => {
    const minimalConsents: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      geolocation: false,
    };
    setPreferences(minimalConsents);
    saveConsentsMutation.mutate(minimalConsents);
  };

  const handleSavePreferences = () => {
    saveConsentsMutation.mutate(preferences);
    setShowDetails(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner flutuante */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-full shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-sm">
                  Privacidade e Cookies
                </h3>
                <p className="text-xs text-muted-foreground">
                  Utilizamos cookies e dados pessoais para melhorar sua experiência,
                  analisar tráfego e personalizar conteúdo. Ao continuar, você aceita
                  nossa{' '}
                  <a
                    href="/privacidade"
                    className="underline hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Política de Privacidade
                  </a>
                  {' '}e{' '}
                  <a
                    href="/termos"
                    className="underline hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Termos de Uso
                  </a>
                  .
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
              >
                Personalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                disabled={saveConsentsMutation.isPending}
              >
                Rejeitar
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                disabled={saveConsentsMutation.isPending}
              >
                Aceitar Todos
              </Button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-1 hover:bg-muted rounded ml-2"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de personalização */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Preferências de Privacidade
            </DialogTitle>
            <DialogDescription>
              Personalize como seus dados são utilizados. Você pode alterar
              essas preferências a qualquer momento em{' '}
              <a href="/conta/privacidade" className="underline">
                Configurações de Privacidade
              </a>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessários */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Cookies Necessários</Label>
                <p className="text-xs text-muted-foreground">
                  Essenciais para o funcionamento do site (login, segurança,
                  preferências básicas). Não podem ser desativados.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Analytics e Métricas</Label>
                <p className="text-xs text-muted-foreground">
                  Coleta anônima de dados de uso para melhorar nossos
                  serviços (Google Analytics, etc).
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Marketing e Promocional</Label>
                <p className="text-xs text-muted-foreground">
                  Permite envio de newsletters, ofertas personalizadas e
                  anúncios relevantes.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
              />
            </div>

            {/* Geolocation */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Geolocalização</Label>
                <p className="text-xs text-muted-foreground">
                  Acesso à sua localização precisa para encontrar negócios
                  e serviços próximos a você.
                </p>
              </div>
              <Switch
                checked={preferences.geolocation}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, geolocation: checked })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={saveConsentsMutation.isPending}
              className="w-full sm:w-auto"
            >
              Salvar Preferências
            </Button>
          </DialogFooter>

          {/* Links legais */}
          <div className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground">
            <a href="/privacidade" className="underline hover:text-primary mr-4">
              Política de Privacidade
            </a>
            <a href="/termos" className="underline hover:text-primary mr-4">
              Termos de Uso
            </a>
            <a href="/dpo" className="underline hover:text-primary">
              Falar com DPO
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
