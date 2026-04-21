/**
 * DeliverySection - Seção de delivery do perfil
 * 
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Lógica clara e organizada
 * 
 * FASE 6: Entitlements já resolvidos no backend
 * - businessModules.subscription.canUse* vem de ProfileService
 * - ProfileService usa EntitlementResolver para popular subscription
 * - Componente apenas exibe, não calcula elegibilidade
 * 
 * TODO P2: Migrar para useEntitlements() com cache React Query
 * Atualmente usa props que já vêm resolvidas do backend (aceitável para P2)
 */

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { SectionFrame, EmptyPanel } from "@/modules/profile/components/hub";

import type { DeliverySectionProps } from "./types";

function formatPlanLabel(value?: string | null): string {
  switch (value) {
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "delivery":
      return "Delivery";
    case "basic":
      return "Basico";
    case "premium":
      return "Premium";
    case "enterprise":
      return "Enterprise";
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : "Basico";
  }
}

export function DeliverySection({
  businessModules,
  setActiveSection,
  navigate,
}: DeliverySectionProps) {
  const deliveryModules = businessModules.filter((item) =>
    item.gastronomy.deliveryEnabled ||
    item.subscription.canUseMotoboyNetwork ||
    item.subscription.canRequestDelivery ||
    item.subscription.canTrackDelivery ||
    item.subscription.canConfigureDeliveryArea ||
    item.subscription.canSetDeliveryFees ||
    item.subscription.canUseOwnDelivery,
  );

  return (
    <SectionFrame
      title="Delivery e motoboy"
      description="Mostra apenas dados e atalhos de entrega, sem mistura com outras areas."
    >
      {deliveryModules.length === 0 ? (
        <EmptyPanel
          title="Sem operacao de delivery ativa"
          description="Nenhuma empresa com delivery/motoboy ativo foi encontrada no perfil atual."
          actionLabel="Ver area de empresas"
          onAction={() => setActiveSection("empresas")}
        />
      ) : (
        <div className="space-y-3">
          {deliveryModules.map((item) => {
            const features = [
              item.gastronomy.deliveryEnabled ? "Delivery ativo" : null,
              item.subscription.canUseMotoboyNetwork ? "Rede motoboy" : null,
              item.subscription.canConfigureDeliveryArea ? "Area de entrega" : null,
              item.subscription.canSetDeliveryFees ? "Taxas configuraveis" : null,
              item.subscription.canTrackDelivery ? "Rastreio" : null,
              item.subscription.canUseOwnDelivery ? "Entrega propria" : null,
            ].filter(Boolean) as string[];

            const actions = [
              { label: "Dashboard", url: item.dashboardUrl },
              { label: "Pedidos", url: item.gastronomy.ordersUrl },
              { label: "Entregas", url: item.gastronomy.deliveriesUrl },
              { label: "Area de entrega", url: item.gastronomy.deliveryAreaUrl },
            ].filter((action): action is { label: string; url: string } => Boolean(action.url));

            return (
              <div key={item.businessId} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    Plano {formatPlanLabel(item.subscription.planTier)}
                  </Badge>
                  {item.isPremium ? (
                    <Badge variant="outline" className="text-[10px]">
                      Premium
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {features.length > 0 ? (
                    features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-[10px]">
                        {feature}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Sem recursos extras de delivery
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.label}
                      size="sm"
                      variant={action.label === "Dashboard" ? "default" : "outline"}
                      onClick={() => navigate(action.url)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionFrame>
  );
}
