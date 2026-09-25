/**
 * BusinessModulesSection - gestão das empresas vinculadas ao perfil.
 *
 * O runtime ativo do MVP expõe somente Business. Recursos pós-MVP podem
 * permanecer no snapshot/contratos preservados, mas não entram nesta UI
 * enquanto seus módulos estiverem pausados.
 */

import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { SectionFrame } from "./SectionFrame";
import { EmptyPanel } from "./EmptyPanel";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

import type { ProfileBusinessModuleSnapshot } from "@/core/profiles/services/ProfileBusinessTypes";

interface BusinessModulesSectionProps {
  businessModules: readonly ProfileBusinessModuleSnapshot[];
  billingEnabled: boolean;
  showOnboarding: boolean;
  onCreateBusiness: () => void;
  onNavigate: (url: string) => void;
  onCopy: (url: string, label: string) => void;
}

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

export function BusinessModulesSection({
  businessModules,
  billingEnabled,
  showOnboarding,
  onCreateBusiness,
  onNavigate,
  onCopy,
}: BusinessModulesSectionProps) {
  const verifiedCount = businessModules.filter((item) => item.verified).length;
  const premiumCount = businessModules.filter((item) => item.isPremium).length;
  const qrReadyCount = businessModules.filter((item) => item.qrCode.hasActive).length;

  return (
    <SectionFrame
      title="Empresas e gestão"
      description="Gestão das empresas vinculadas, páginas públicas e recursos já habilitados."
      action={
        <Button className="gap-2" onClick={onCreateBusiness}>
          <Sparkles className="h-4 w-4" />
          Nova empresa
        </Button>
      }
    >
      {businessModules.length === 0 ? (
        showOnboarding ? (
          <EmptyPanel
            title="Nenhuma empresa ativa vinculada"
            description="Crie ou vincule uma empresa para começar a usar a gestão empresarial do Achegue-se."
            actionLabel="Criar empresa"
            onAction={onCreateBusiness}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            Este perfil não possui empresas administradas no momento.
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Empresas" value={businessModules.length} description="Vinculadas ao perfil" />
            <SummaryCard label="Verificadas" value={verifiedCount} description="Com verificação ativa" />
            <SummaryCard label="Premium" value={premiumCount} description="Recursos já habilitados" />
            <SummaryCard label="QR pronto" value={qrReadyCount} description="Empresas com QR ativo" />
          </div>

          <div className="space-y-4">
            {businessModules.map((business) => (
              <BusinessModuleCard
                key={business.businessId}
                business={business}
                billingEnabled={billingEnabled}
                onNavigate={onNavigate}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}
    </SectionFrame>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function BusinessModuleCard({
  business,
  billingEnabled,
  onNavigate,
  onCopy,
}: {
  business: ProfileBusinessModuleSnapshot;
  billingEnabled: boolean;
  onNavigate: (url: string) => void;
  onCopy: (url: string, label: string) => void;
}) {
  const hasPremiumLink =
    business.subscription.canUseShortPremiumLink && Boolean(business.shareUrl);

  const featureBadges = [
    hasPremiumLink ? "Link premium" : null,
    business.qrCode.hasActive ? "QR pronto" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{business.name}</h3>
            {business.verified ? (
              <Badge
                variant="outline"
                className="h-5 border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-700"
              >
                Verificada
              </Badge>
            ) : null}
            {business.isPremium ? (
              <Badge className="h-5 bg-amber-500 px-2 text-[10px] text-white">
                Premium
              </Badge>
            ) : null}
            {billingEnabled ? (
              <>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  Plano {formatPlanLabel(business.subscription.planTier)}
                </Badge>
                <Badge variant="outline" className="h-5 text-[10px]">
                  {business.subscription.status}
                </Badge>
              </>
            ) : null}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {business.neighborhood || "Bairro não informado"}
            {business.city ? `, ${business.city}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {featureBadges.length > 0 ? (
              featureBadges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-[10px]">
                  {badge}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Gestão empresarial ativa
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button size="sm" className="gap-1.5" onClick={() => onNavigate(business.dashboardUrl)}>
            Gerenciar empresa
          </Button>
          {billingEnabled ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onNavigate(businessManagementRoutes.planos(business.businessId))}
            >
              Planos
            </Button>
          ) : null}
          {billingEnabled || hasPremiumLink ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onNavigate(businessManagementRoutes.linkPremium(business.businessId))}
            >
              Link premium
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onNavigate(business.editUrl)}
          >
            Editar / imagens
          </Button>
          {business.publicUrl ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onNavigate(business.publicUrl)}
            >
              Ver página pública
            </Button>
          ) : null}
          {business.shareUrl ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onNavigate(business.shareUrl)}
            >
              Ver mini-site
            </Button>
          ) : null}
          {business.shareUrl ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onCopy(business.shareUrl!, "link da empresa")}
            >
              Compartilhar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
