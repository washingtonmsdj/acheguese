/**
 * 🔔 NICHE UPGRADE BANNER
 *
 * Banner para notificar empresas sobre upgrades disponíveis.
 *
 * @version 1.0.0
 */

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { ProfileNicheConfig } from '../types';

interface NicheUpgradeBannerProps {
  profile: ProfileNicheConfig;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export function NicheUpgradeBanner({
  profile,
  onUpgrade,
  onDismiss,
}: NicheUpgradeBannerProps) {
  if (!profile.needs_niche_upgrade && profile.missing_capabilities.length === 0) {
    return null;
  }

  const capabilityLabels: Record<string, string> = {
    slice_sales: 'Venda por Fatia',
    seasonal_flavors: 'Sabores Sazonais',
    loyalty_program: 'Programa de Fidelidade',
    sushi_piece_count: 'Contador de Peças',
    sushi_combinado_builder: 'Monte seu Combinado',
    acai_base_sizes: 'Tamanhos de Base',
    acai_toppings: 'Complementos',
    pastel_half_half: 'Meio a Meio',
    meat_weight_pricing: 'Preço por Peso',
  };

  const missingLabels = profile.missing_capabilities
    .map((cap) => capabilityLabels[cap] || cap)
    .slice(0, 3);

  const hasMore = profile.missing_capabilities.length > 3;

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold">
        Novas funcionalidades disponíveis!
      </AlertTitle>
      <AlertDescription className="text-blue-800">
        <p className="mb-3">
          Seu negócio pode aproveitar novos recursos para melhorar a experiência
          dos clientes:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {missingLabels.map((label) => (
            <Badge key={label} variant="secondary" className="bg-blue-100">
              {label}
            </Badge>
          ))}
          {hasMore && (
            <Badge variant="secondary" className="bg-blue-100">
              +{profile.missing_capabilities.length - 3} mais
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {onUpgrade && (
            <Button
              size="sm"
              onClick={onUpgrade}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Configurar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Mais Tarde
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
