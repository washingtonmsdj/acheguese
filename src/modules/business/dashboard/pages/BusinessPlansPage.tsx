import { Link } from "react-router-dom";
import { CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

export default function BusinessPlansPage() {
  const { businessId, planTier, entitlements, isGastronomyActive } =
    useBusinessDashboardContext();
  const showCoupons = isLaunchSurfaceEnabled("coupons");
  const showMobility = isLaunchSurfaceEnabled("mobility");
  const showAnalytics = isLaunchSurfaceEnabled("publicAnalytics");

  const entitledFeatures = [
    ["Cardapio avancado", entitlements.canUseAdvancedCatalog],
    ...(showCoupons ? [["Promocoes", entitlements.canUsePromotions] as const] : []),
    ["Pedidos internos", entitlements.canUseInternalOrders ?? entitlements.canReceiveInternalOrders],
    ["Carrinho", entitlements.canReceiveInternalOrders],
    ["Checkout", entitlements.canManageOrderStatus],
    ["Painel de pedidos", entitlements.canUseOrdersPanel],
    ...(showMobility
      ? [
          ["Solicitacao de entrega", entitlements.canUseDeliveryRequests] as const,
          ["Rede de motoboy", entitlements.canUseMotoboyNetwork] as const,
          ["Rastreamento", entitlements.canUseDeliveryTracking] as const,
        ]
      : []),
    ...(showAnalytics
      ? [
          ["Analytics basico", entitlements.canUseBasicAnalytics] as const,
          ["Analytics avancado", entitlements.canUseAdvancedAnalytics] as const,
        ]
      : []),
  ] as const;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Plano da empresa</CardTitle>
          <CardDescription>
            A assinatura pertence a empresa e controla os recursos por vertical.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="uppercase">
            {planTier}
          </Badge>
          <Link to="/planos">
            <Button size="sm">Upgrade ou downgrade</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recursos liberados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {entitledFeatures.map(([label, allowed]) => (
            <div key={label} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              {allowed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso por vertical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Gastronomia:{" "}
            <span className="font-medium">{isGastronomyActive ? "ativa" : "nao ativa"}</span>
          </p>
          <p className="text-muted-foreground">
            Pedidos internos e delivery so ficam disponiveis no plano Delivery.
          </p>
          <Link to={businessManagementRoutes.gastronomia(businessId)}>
            <Button variant="outline" size="sm">
              Abrir gastronomia
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
