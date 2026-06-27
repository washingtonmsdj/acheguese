/**
 * PlanosSection - Secao de planos e assinaturas
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: logica clara e organizada
 *
 * FASE 6 - P2: Badges visuais ja resolvidos no backend
 * - businessModules.subscription.canUse* vem de ProfileService
 * - ProfileService usa EntitlementResolver para popular subscription
 * - Componente apenas exibe, nao calcula elegibilidade
 * - Aceitavel para P2 (baixo risco - apenas visual)
 */

import { Badge } from "@/shared/components/ui/badge";
import { SectionFrame } from "@/modules/profile/components/hub";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

import type { PlanosSectionProps } from "./types";

function formatPlanLabel(value?: string | null): string {
  switch (value) {
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "delivery":
      return "Delivery";
    case "basic":
      return "Básico";
    case "premium":
      return "Premium";
    case "enterprise":
      return "Enterprise";
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : "Básico";
  }
}

export function PlanosSection({
  identity,
  context,
  businessModules,
}: PlanosSectionProps) {
  const showMobility = isLaunchSurfaceEnabled("mobility");

  return (
    <div className="space-y-6">
      <SectionFrame
        title="Plano da identidade ativa"
        description="Resumo da assinatura atual do perfil logado."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatPlanLabel(identity?.plan?.type || context?.plan?.type)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Premium: {identity?.plan?.isPremium || context?.plan?.isPremium ? "sim" : "não"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reputação</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {identity?.reputation?.score ?? context?.reputation?.score ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nível {identity?.reputation?.level ?? context?.reputation?.level ?? 1}
            </p>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        title="Planos e assinaturas por empresa"
        description="Visão consolidada de plano, status e recursos por empresa."
      >
        {businessModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa vinculada para exibir planos empresariais.
          </p>
        ) : (
          <div className="space-y-3">
            {businessModules.map((item) => (
              <div
                key={item.businessId}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    Plano {formatPlanLabel(item.subscription.planTier)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {item.subscription.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.subscription.canUsePremiumPublicPage ? (
                    <Badge variant="outline" className="text-[10px]">
                      Página premium
                    </Badge>
                  ) : null}
                  {item.subscription.canUseOrdersPanel ? (
                    <Badge variant="outline" className="text-[10px]">
                      Painel de pedidos
                    </Badge>
                  ) : null}
                  {showMobility && item.subscription.canUseMotoboyNetwork ? (
                    <Badge variant="outline" className="text-[10px]">
                      Rede motoboy
                    </Badge>
                  ) : null}
                  {showMobility && item.subscription.canTrackDelivery ? (
                    <Badge variant="outline" className="text-[10px]">
                      Rastreio de entrega
                    </Badge>
                  ) : null}
                  {item.subscription.canSetDeliveryFees ? (
                    <Badge variant="outline" className="text-[10px]">
                      Configurar taxas
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionFrame>
    </div>
  );
}
