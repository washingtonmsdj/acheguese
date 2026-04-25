/**
 * GastronomyVerticalStatus — Widget de status do vertical gastronômico
 *
 * Mostra o status do módulo gastronômico no dashboard da empresa:
 * - ✅ Ativo (com link para gerenciar)
 * - ⚠️ Não configurado (com CTA para ativar)
 * - ❌ Não elegível (componente não renderiza)
 *
 * Integrado ao dashboard business.
 */

import { UtensilsCrossed, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { GastronomyProfileService } from '@/modules/business/gastronomy/services/GastronomyProfileService';
import { getEligibleVerticals } from '@/core/verticals';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import type { BusinessCategory } from '@/core/business/types/Business';

interface GastronomyVerticalStatusProps {
  businessId: string;
  businessCategory: BusinessCategory;
}

export function GastronomyVerticalStatus({
  businessId,
  businessCategory,
}: GastronomyVerticalStatusProps) {
  // Verifica se a categoria é elegível
  const eligibleVerticals = getEligibleVerticals(businessCategory);
  const isEligible = eligibleVerticals.some((v) => v.key === 'gastronomy');

  // Busca o perfil gastronômico
  const { data: profileResult, isLoading } = useQuery({
    queryKey: ['gastronomy-profile', businessId],
    queryFn: () => GastronomyProfileService.getByBusinessId(businessId),
    enabled: isEligible && !!businessId,
  });

  // Não renderiza se não for elegível
  if (!isEligible) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const profile = profileResult?.data;
  const hasProfile = !!profile;
  const isActive = profile?.status === 'active';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Módulo Gastronomia</CardTitle>
          </div>
          {hasProfile && isActive && (
            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ativo
            </Badge>
          )}
          {hasProfile && !isActive && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30">
              <AlertCircle className="h-3.5 w-3.5" />
              Inativo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasProfile && (
          <>
            <p className="text-sm text-muted-foreground">
              Ative o módulo gastronômico para aparecer na listagem de gastronomia,
              criar cardápio digital e receber pedidos online.
            </p>
            <Button asChild className="w-full">
              <Link to={businessManagementRoutes.gastronomySetup(businessId)}>
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Ativar Módulo Gastronomia
              </Link>
            </Button>
          </>
        )}

        {hasProfile && (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo de culinária</p>
                <p className="font-medium capitalize">{profile.cuisine_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Faixa de preço</p>
                <p className="font-medium">{profile.price_range}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delivery</p>
                <p className="font-medium">{profile.delivery_enabled ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Retirada</p>
                <p className="font-medium">{profile.takeout_enabled ? 'Sim' : 'Não'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to={businessManagementRoutes.gastronomySetup(businessId)}>
                  Configurar
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to={businessManagementRoutes.planos(businessId)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Planos
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to={businessManagementRoutes.gastronomia(businessId)}>
                  Gerenciar Cardápio
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


