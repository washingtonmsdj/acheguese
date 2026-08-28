/**
 * BusinessOwnerQuickAccess
 *
 * Widget de acesso rápido para donos de empresas.
 * Exibe cards destacados com links diretos para dashboards e funcionalidades principais.
 *
 * PROPÓSITO:
 * - Resolver problema de donos não encontrarem como gerenciar suas empresas
 * - Fornecer acesso visual e intuitivo aos dashboards
 * - Destacar funcionalidades principais (cardápio, analytics, pedidos)
 *
 * FASE 6 - P2: Badges visuais já resolvidos no backend
 * - biz.subscription.canUse* vem de ProfileService
 * - ProfileService usa EntitlementResolver para popular subscription
 * - Componente apenas exibe, não calcula elegibilidade
 * - Aceitável para P2 (baixo risco - apenas visual)
 */

import { Building2, BarChart3, Package, Settings, UtensilsCrossed, Crown, ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import type { ProfileBusinessModuleSnapshot } from "@/core/profiles/services/ProfileBusinessTypes";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";

interface BusinessOwnerQuickAccessProps {
  businesses: readonly ProfileBusinessModuleSnapshot[];
  onNavigate: (url: string) => void;
}

export function BusinessOwnerQuickAccess({ businesses, onNavigate }: BusinessOwnerQuickAccessProps) {
  if (businesses.length === 0) return null;

  const showMobility = isLaunchSurfaceEnabled("mobility");
  const showPublicAnalytics = isLaunchSurfaceEnabled("publicAnalytics");

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-primary p-3 shadow-md">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">
              Área do Proprietário
            </h3>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie suas empresas, produtos e pedidos
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {businesses.length} {businesses.length === 1 ? 'empresa' : 'empresas'}
        </Badge>
      </div>

      {/* Business Cards */}
      <div className="space-y-4">
        {businesses.map((biz) => (
          <div
            key={biz.businessId}
            className="rounded-xl border-2 border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Business Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-base text-foreground">
                    {biz.name}
                  </h4>
                  {biz.isPremium && (
                    <Badge variant="default" className="text-[10px]">
                      Premium
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {biz.category}
                  </Badge>
                  {biz.gastronomy.active && (
                    <Badge variant="outline" className="text-[10px]">
                      🍽️ Gastronomia
                    </Badge>
                  )}
                  {biz.gastronomy.deliveryEnabled && (
                    <Badge variant="outline" className="text-[10px]">
                      🚚 Delivery
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Dashboard Principal - Sempre visível */}
              <Button
                size="sm"
                variant="default"
                className="gap-2 font-semibold"
                onClick={() => onNavigate(biz.dashboardUrl)}
              >
                <Settings className="h-4 w-4" />
                Dashboard
              </Button>

              {/* Botão de Página Pública */}
              {biz.publicUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onNavigate(biz.publicUrl!)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Página
                </Button>
              )}

              {/* Botões específicos de Gastronomia */}
              {biz.gastronomy.active && (
                <>
                  {biz.gastronomy.menuUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => onNavigate(biz.gastronomy.menuUrl!)}
                    >
                      <UtensilsCrossed className="h-4 w-4" />
                      Cardápio
                    </Button>
                  )}

                  {showPublicAnalytics && biz.gastronomy.analyticsUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => onNavigate(biz.gastronomy.analyticsUrl!)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Button>
                  )}

                  {biz.gastronomy.ordersUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => onNavigate(biz.gastronomy.ordersUrl!)}
                    >
                      <Package className="h-4 w-4" />
                      Pedidos
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Recursos do Plano */}
            {biz.subscription && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Plano: <span className="font-semibold">{biz.subscription.planTier}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {biz.subscription.canUseOrdersPanel && (
                    <Badge variant="secondary" className="text-[9px]">
                      Painel de Pedidos
                    </Badge>
                  )}
                  {showMobility && biz.subscription.canUseMotoboyNetwork && (
                    <Badge variant="secondary" className="text-[9px]">
                      Rede Motoboy
                    </Badge>
                  )}
                  {showMobility && biz.subscription.canTrackDelivery && (
                    <Badge variant="secondary" className="text-[9px]">
                      Rastreio
                    </Badge>
                  )}
                  {biz.subscription.canUsePremiumPublicPage && (
                    <Badge variant="secondary" className="text-[9px]">
                      Página Premium
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer com dica */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          Dica: Clique em "Dashboard" para acessar todas as funcionalidades de gerenciamento
        </p>
      </div>
    </Card>
  );
}
