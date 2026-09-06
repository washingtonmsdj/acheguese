import { useEntitlements } from '@/core/billing/hooks/useEntitlements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { AlertTriangle, CheckCircle2, Crown, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

interface PlanStatusWidgetProps {
  /** Profile ID usado somente para a rota de planos. */
  businessId: string;
  /** business_data.id usado pelo contrato de Billing. */
  businessDataId: string;
  currentMenuItems?: number;
  currentImages?: number;
}

export function PlanStatusWidget({
  businessId,
  businessDataId,
  currentMenuItems = 0,
  currentImages = 0,
}: PlanStatusWidgetProps) {
  const { entitlements, isLoading } = useEntitlements({
    business_id: businessDataId,
    subscription_scope: 'business',
  });
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando plano...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!entitlements) {
    return null;
  }

  const menuItemsProgress = entitlements.maxMenuItems
    ? (currentMenuItems / entitlements.maxMenuItems) * 100
    : 0;
  const imagesProgress = entitlements.maxImages
    ? (currentImages / entitlements.maxImages) * 100
    : 0;
  const isDelivery = entitlements.planTier === 'delivery';
  const isPro = entitlements.planTier === 'pro';
  const isFree = entitlements.planTier === 'free';
  const badgeVariant = isDelivery ? 'default' : isPro ? 'secondary' : 'outline';
  const badgeIcon = isDelivery
    ? <Zap className="w-3 h-3 mr-1" />
    : isPro
      ? <Crown className="w-3 h-3 mr-1" />
      : null;
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
                {entitlements.planName}
              </Badge>
            </CardTitle>
            <CardDescription>
              {isFree && 'Recursos basicos para comecar'}
              {isPro && 'Recursos avancados para crescer'}
              {isDelivery && 'Recursos ampliados para operacao de pedidos'}
            </CardDescription>
          </div>
          {showUpgradeCTA && (
            <Link to={businessManagementRoutes.planos(businessId)}>
              <Button size="sm" variant="default">
                <TrendingUp className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {entitlements.maxMenuItems !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Itens do Cardapio</span>
              <span className="font-medium">
                {currentMenuItems} / {entitlements.maxMenuItems}
              </span>
            </div>
            <Progress value={menuItemsProgress} className="h-2" />
            {menuItemsProgress >= 90 && (
              <p className="flex items-start gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Voce esta proximo do limite. Faca upgrade para adicionar mais itens.</span>
              </p>
            )}
          </div>
        )}

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
              <p className="flex items-start gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Voce esta proximo do limite de imagens.</span>
              </p>
            )}
          </div>
        )}

        {(entitlements.maxMenuItems === null || entitlements.maxImages === null) && (
          <div className="pt-2 border-t">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              Recursos ilimitados disponiveis no seu plano
            </p>
          </div>
        )}

        {isFree && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-sm font-medium">Desbloqueie com Pro:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>- Pagina premium</li>
              <li>- Link curto (/p/seu-slug)</li>
              <li>- QR Code personalizado</li>
              <li>- Cardapio ilimitado</li>
            </ul>
          </div>
        )}

        {isPro && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-sm font-medium">Desbloqueie com Delivery:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>- Pedidos internos</li>
              <li>- Painel de pedidos</li>
              <li>- Configuracao de areas de entrega</li>
              <li>- Operacao de frota propria/manual</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
