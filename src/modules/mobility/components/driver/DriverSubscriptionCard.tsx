import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Crown, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { BillingService } from "@/core/billing/services/BillingService";
import {
  CatalogService,
  type CatalogItem,
} from "@/core/billing/services/CatalogService";
import { TIMEOUTS } from "@/core/mobility/constants";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";

export type DriverSubscriptionService = "motorista" | "motoboy";

interface DriverSubscriptionCardProps {
  service?: DriverSubscriptionService;
}

const serviceConfig: Record<
  DriverSubscriptionService,
  {
    vertical: "mobility_driver" | "mobility_courier";
    actorType: "driver" | "courier";
    returnPath: string;
  }
> = {
  motorista: {
    vertical: "mobility_driver",
    actorType: "driver",
    returnPath: mobilityRoutes.motorista.configuracoes,
  },
  motoboy: {
    vertical: "mobility_courier",
    actorType: "courier",
    returnPath: mobilityRoutes.motoboy.configuracoes,
  },
};

function formatCatalogPrice(item: CatalogItem): string {
  const priceCents = item.pricing_policy?.price_cents;
  if (typeof priceCents !== "number" || !Number.isFinite(priceCents)) {
    return "Valor no checkout";
  }
  return `${formatBrl(priceCents / 100)}/mês`;
}

export function DriverSubscriptionCard({
  service = "motorista",
}: DriverSubscriptionCardProps) {
  const { user } = useAuth();
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const config = serviceConfig[service];

  const plansQuery = useQuery({
    queryKey: ["mobility-worker-plans", service, user?.id ?? null],
    queryFn: async () => {
      if (!user?.id) return [];
      const catalog = await CatalogService.getEligibleCatalog({
        user_id: user.id,
        entity_family: "worker",
        vertical: config.vertical,
        actor_type: config.actorType,
      });

      return catalog.vertical_packages.filter(
        (item) =>
          item.vertical === config.vertical &&
          item.pricing_model === "subscription",
      );
    },
    enabled: Boolean(user?.id),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  const handlePlanChange = async (planCode: string) => {
    setCheckoutPlanCode(planCode);
    try {
      await BillingService.redirectToCheckout({
        planCode,
        subscriptionScope: "worker",
        entityFamily: "worker",
        vertical: config.vertical,
        successUrl: buildPublicAbsoluteUrl(
          `${config.returnPath}?assinatura=sucesso`,
        ),
        cancelUrl: buildPublicAbsoluteUrl(config.returnPath),
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o checkout da assinatura.",
      );
    } finally {
      setCheckoutPlanCode(null);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      await BillingService.redirectToPortal(
        buildPublicAbsoluteUrl(config.returnPath),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o portal de cobrança.",
      );
    } finally {
      setOpeningPortal(false);
    }
  };

  if (plansQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        Carregando planos publicados...
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Não foi possível carregar os planos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              O catálogo de assinaturas está indisponível no momento.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void plansQuery.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const plans = plansQuery.data ?? [];

  return (
    <div className="space-y-3">
      {plans.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {plans.map((plan) => {
            const featured = plan.is_featured;
            const Icon = featured ? Crown : Shield;

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border p-3",
                  featured
                    ? "border-warning/30 bg-warning/5"
                    : "border-border bg-card",
                )}
              >
                {featured ? (
                  <Badge className="absolute -top-2 right-2 bg-warning text-[0.6rem] text-warning-foreground">
                    Destaque
                  </Badge>
                ) : null}

                <div className="mb-2 flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      featured ? "text-warning" : "text-primary",
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {plan.item_name}
                    </h3>
                    <p className="text-xs font-semibold text-primary">
                      {formatCatalogPrice(plan)}
                    </p>
                  </div>
                </div>

                {plan.description ? (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                ) : null}

                <ul className="mb-3 flex-1 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-xs text-muted-foreground">
                      • {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  onClick={() => void handlePlanChange(plan.item_code)}
                  disabled={checkoutPlanCode !== null || openingPortal}
                  className="w-full"
                  variant={featured ? "default" : "outline"}
                >
                  {checkoutPlanCode === plan.item_code ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  Escolher plano
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          Nenhum plano publicado para esta modalidade no momento.
        </div>
      )}

      <div className="rounded-xl border bg-card p-3">
        <p className="text-xs text-muted-foreground">
          Esta tela mostra o catálogo publicado. O plano atual não é inferido no
          cliente enquanto não houver um snapshot de assinatura com escopo worker.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          disabled={openingPortal || checkoutPlanCode !== null}
          onClick={() => void handleManageSubscription()}
        >
          {openingPortal ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Gerenciar cobrança
        </Button>
      </div>
    </div>
  );
}
