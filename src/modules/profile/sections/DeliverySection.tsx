/**
 * DeliverySection - Secao de delivery do perfil
 * SSOT: usa entitlements canonicos por empresa com cache React Query.
 */

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { SectionFrame, EmptyPanel } from "@/modules/profile/components/hub";
import { useEntitlements } from "@/core/billing/hooks/useEntitlements";

import type { DeliverySectionProps } from "./types";
import type { ProfileBusinessModuleItem } from "@/core/profiles/services/types";

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

function hasDeliveryCapability(item: ProfileBusinessModuleItem): boolean {
  return (
    item.gastronomy.deliveryEnabled ||
    item.subscription.canUseMotoboyNetwork ||
    item.subscription.canRequestDelivery ||
    item.subscription.canTrackDelivery ||
    item.subscription.canConfigureDeliveryArea ||
    item.subscription.canSetDeliveryFees ||
    item.subscription.canUseOwnDelivery
  );
}

interface DeliveryBusinessCardProps {
  readonly item: ProfileBusinessModuleItem;
  readonly navigate: DeliverySectionProps["navigate"];
}

function DeliveryBusinessCard({ item, navigate }: DeliveryBusinessCardProps) {
  const { entitlements, isLoading } = useEntitlements({
    business_id: item.businessId,
    subscription_scope: "business",
    enabled: Boolean(item.businessId),
  });

  const canUseMotoboyNetwork =
    entitlements?.canUseMotoboyNetwork ?? item.subscription.canUseMotoboyNetwork;
  const canConfigureDeliveryArea =
    entitlements?.canConfigureDeliveryArea ??
    item.subscription.canConfigureDeliveryArea;
  const canSetDeliveryFees =
    entitlements?.canSetDeliveryFees ?? item.subscription.canSetDeliveryFees;
  const canTrackDelivery =
    entitlements?.canTrackDelivery ?? item.subscription.canTrackDelivery;
  const canUseOwnDelivery =
    entitlements?.canUseOwnDelivery ?? item.subscription.canUseOwnDelivery;

  const features = [
    item.gastronomy.deliveryEnabled ? "Delivery ativo" : null,
    canUseMotoboyNetwork ? "Rede motoboy" : null,
    canConfigureDeliveryArea ? "Area de entrega" : null,
    canSetDeliveryFees ? "Taxas configuraveis" : null,
    canTrackDelivery ? "Rastreio" : null,
    canUseOwnDelivery ? "Entrega propria" : null,
  ].filter(Boolean) as string[];

  const actions = [
    { label: "Dashboard", url: item.dashboardUrl },
    { label: "Pedidos", url: item.gastronomy.ordersUrl },
    { label: "Entregas", url: item.gastronomy.deliveriesUrl },
    { label: "Area de entrega", url: item.gastronomy.deliveryAreaUrl },
  ].filter((action): action is { label: string; url: string } => Boolean(action.url));

  const effectivePlanTier = entitlements?.planTier ?? item.subscription.planTier;

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
        <Badge variant="secondary" className="text-[10px]">
          Plano {formatPlanLabel(effectivePlanTier)}
        </Badge>
        {item.isPremium ? (
          <Badge variant="outline" className="text-[10px]">
            Premium
          </Badge>
        ) : null}
        {isLoading ? (
          <Badge variant="outline" className="text-[10px]">
            Atualizando recursos...
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
}

export function DeliverySection({
  businessModules,
  setActiveSection,
  navigate,
}: DeliverySectionProps) {
  const deliveryModules = businessModules.filter(hasDeliveryCapability);

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
          {deliveryModules.map((item) => (
            <DeliveryBusinessCard key={item.businessId} item={item} navigate={navigate} />
          ))}
        </div>
      )}
    </SectionFrame>
  );
}
