import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import {
  BusinessSubscriptionService,
  PlanTier,
} from "@/core/billing";
import { useBillingPlans } from "@/core/billing/hooks/useBillingPlans";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";

function resolveBusinessPlanTier(planCode: string): PlanTier | null {
  if (planCode === PlanTier.FREE) return PlanTier.FREE;
  if (planCode === PlanTier.PRO) return PlanTier.PRO;
  if (planCode === PlanTier.DELIVERY) return PlanTier.DELIVERY;
  return null;
}

export default function BusinessPlansPage() {
  const {
    businessId,
    businessDataId,
    business,
    planTier,
    entitlements,
    isGastronomyActive,
  } = useBusinessDashboardContext();
  const { data: billingPlans = [], isLoading: loadingPlans } = useBillingPlans();
  const {
    permissions,
    loading: loadingAccess,
  } = useDashboardAccess(business.profile_id);
  const canManageBilling = permissions.role === "owner";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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

  const handleSelectPlan = async (planCode: string) => {
    if (!canManageBilling) {
      toast.error("Somente o Proprietario pode alterar a assinatura da empresa.");
      return;
    }

    const targetTier = resolveBusinessPlanTier(planCode);
    if (!targetTier) {
      toast.error("Este plano ainda nao esta disponivel para assinatura Business.");
      return;
    }
    if (targetTier === planTier) return;

    setLoadingPlan(planCode);
    try {
      const result = await BusinessSubscriptionService.updatePlan(
        businessDataId,
        targetTier,
      );
      if (result.error) {
        toast.error("Nao foi possivel iniciar a alteracao do plano.");
      }
    } catch {
      toast.error("Nao foi possivel iniciar a alteracao do plano.");
    } finally {
      setLoadingPlan(null);
    }
  };

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
          <span className="text-sm text-muted-foreground">
            As alteracoes abaixo usam a assinatura desta empresa, nao o plano pessoal da conta.
          </span>
          {!loadingAccess && !canManageBilling ? (
            <Badge variant="outline">
              Somente o Proprietario pode alterar a assinatura
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planos disponiveis para a empresa</CardTitle>
          <CardDescription>
            Upgrade pago segue para o checkout Business. Retorno ao Free e gestao do contrato
            atual usam o portal de cobranca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando planos...
            </div>
          ) : billingPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum plano Business publicado esta disponivel no momento.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {billingPlans.map((plan) => {
                const targetTier = resolveBusinessPlanTier(plan.code);
                const isCurrent = targetTier === planTier;
                const isSupported = targetTier !== null;

                return (
                  <div key={plan.id} className="flex flex-col rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{plan.name}</p>
                      {isCurrent ? <Badge variant="outline">Atual</Badge> : null}
                    </div>
                    <p className="mt-1 text-lg font-bold">{plan.priceDisplay}</p>
                    {plan.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {plan.description}
                      </p>
                    ) : null}
                    <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                      {plan.features.slice(0, 5).map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      className="mt-4"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={
                        isCurrent ||
                        !isSupported ||
                        loadingPlan !== null ||
                        loadingAccess ||
                        !canManageBilling
                      }
                      onClick={() => void handleSelectPlan(plan.code)}
                    >
                      {loadingPlan === plan.code ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Abrindo...
                        </>
                      ) : isCurrent ? (
                        "Plano atual"
                      ) : isSupported ? (
                        targetTier === PlanTier.FREE ? "Gerenciar / Free" : "Escolher plano"
                      ) : (
                        "Indisponivel"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
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
