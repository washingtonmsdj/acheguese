/**
 * PlanStatusWidget — Widget de status do plano no dashboard gastronômico
 *
 * Mostra:
 * - Plano atual
 * - Recursos disponíveis
 * - Limites e uso atual
 * - CTAs de upgrade
 *
 * SSOT: Usa useBusinessSubscription do core/billing
 */

import { useBusinessSubscription } from '@/core/billing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Crown, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlanStatusWidgetProps {
  businessId: string;
  currentMenuItems?: number;
  currentImages?: number;
  currentPromotions?: number;
}

export function PlanStatusWidget({
  businessId,
  currentMenuItems = 0,
  currentImages = 0,
  currentPromotions = 0,
}: PlanStatusWidgetProps) {
  const { planTier, entitlements, isLoading, isPro, isDelivery } = useBusinessSubscription(businessId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando plano...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Calcular progresso dos limites
  const menuItemsProgress = entitlements.maxMenuItems
    ? (currentMenuItems / entitlements.maxMenuItems) * 100
    : 0;

  const imagesProgress = entitlements.maxImages
    ? (currentImages / entitlements.maxImages) * 100
    : 0;

  const promotionsProgress = entitlements.maxPromotions
    ? (currentPromotions / entitlements.maxPromotions) * 100
    : 0;

  // Determinar cor do badge
  const badgeVariant = isDelivery ? 'default' : isPro ? 'secondary' : 'outline';
  const badgeIcon = isDelivery ? <Zap className="w-3 h-3 mr-1" /> : isPro ? <Crown className="w-3 h-3 mr-1" /> : null;

  // Determinar se deve mostrar CTA de upgrade
  const showUpgradeCTA = !isDelivery;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Plano Atual
              <Badge variant={badgeVariant} className="flex items-center">
                {badgeIcon}
                {planTier === 'free' && 'Free'}
                {planTier === 'pro' && 'Pro'}
                {planTier === 'delivery' && 'Delivery'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {planTier === 'free' && 'Recursos básicos para começar'}
              {planTier === 'pro' && 'Recursos avançados para crescer'}
              {planTier === 'delivery' && 'Todos os recursos + pedidos internos'}
            </CardDescription>
          </div>
          {showUpgradeCTA && (
            <Link to={`/dashboard/business/${businessId}/gastronomy/plans`}>
              <Button size="sm" variant="default">
                <TrendingUp className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Limite de Itens do Cardápio */}
        {entitlements.maxMenuItems !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Itens do Cardápio</span>
              <span className="font-medium">
                {currentMenuItems} / {entitlements.maxMenuItems}
              </span>
            </div>
            <Progress value={menuItemsProgress} className="h-2" />
            {menuItemsProgress >= 90 && (
              <p className="text-xs text-amber-600">
                ⚠️ Você está próximo do limite. Faça upgrade para adicionar mais itens.
              </p>
            )}
          </div>
        )}

        {/* Limite de Imagens */}
        {entitlements.maxImages !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Imagens</span>
              <span className="font-medium">
                {currentImages} / {entitlements.maxImages}
              </span>
            </div>
            <Progress value={imagesProgress} className="h-2" />
            {imagesProgress >= 90 && (
              <p className="text-xs text-amber-600">
                ⚠️ Você está próximo do limite de imagens.
              </p>
            )}
          </div>
        )}

        {/* Limite de Promoções */}
        {entitlements.maxPromotions !== null && entitlements.canUsePromotions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Promoções</span>
              <span className="font-medium">
                {currentPromotions} / {entitlements.maxPromotions}
              </span>
            </div>
            <Progress value={promotionsProgress} className="h-2" />
            {promotionsProgress >= 90 && (
              <p className="text-xs text-amber-600">
                ⚠️ Você está próximo do limite de promoções.
              </p>
            )}
          </div>
        )}

        {/* Recursos Ilimitados */}
        {(entitlements.maxMenuItems === null || entitlements.maxImages === null) && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              ✨ Recursos ilimitados disponíveis no seu plano
            </p>
          </div>
        )}

        {/* Recursos Bloqueados (Free) */}
        {planTier === 'free' && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-sm font-medium">Desbloqueie com Pro:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Página premium</li>
              <li>• Link curto (/p/seu-slug)</li>
              <li>• QR Code personalizado</li>
              <li>• Cardápio ilimitado</li>
              <li>• Promoções</li>
              <li>• Analytics</li>
            </ul>
          </div>
        )}

        {/* Recursos Bloqueados (Pro) */}
        {planTier === 'pro' && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-sm font-medium">Desbloqueie com Delivery:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Pedidos internos</li>
              <li>• Painel de pedidos</li>
              <li>• Rede de motoboys</li>
              <li>• Rastreamento de entrega</li>
              <li>• Analytics avançado</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
