/**
 * BusinessModulesSection - Seção de módulos empresariais
 * 
 * Exibe empresas do usuário com seus módulos e funcionalidades
 * 
 * FASE 6 - P2: Badges visuais já resolvidos no backend
 * - business.subscription.canUse* vem de ProfileService
 * - ProfileService usa EntitlementResolver para popular subscription
 * - Componente apenas exibe, não calcula elegibilidade
 * - Aceitável para P2 (baixo risco - apenas visual)
 */

import { Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { SectionFrame } from './SectionFrame';
import { EmptyPanel } from './EmptyPanel';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

import type { ProfileBusinessModuleItem } from '@/core/profiles/services/types';

interface BusinessModulesSectionProps {
  businessModules: ProfileBusinessModuleItem[];
  showOnboarding: boolean;
  onCreateBusiness: () => void;
  onNavigate: (url: string) => void;
  onCopy: (url: string, label: string) => void;
}

function formatPlanLabel(value?: string | null): string {
  switch (value) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'delivery':
      return 'Delivery';
    case 'basic':
      return 'Basico';
    case 'premium':
      return 'Premium';
    case 'enterprise':
      return 'Enterprise';
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : 'Basico';
  }
}

export function BusinessModulesSection({
  businessModules,
  showOnboarding,
  onCreateBusiness,
  onNavigate,
  onCopy,
}: BusinessModulesSectionProps) {
  const businessSummary = {
    premium: businessModules.filter((item) => item.isPremium).length,
    gastronomy: businessModules.filter((item) => item.gastronomy.active).length,
    delivery: businessModules.filter((item) => item.gastronomy.deliveryEnabled).length,
    qrReady: businessModules.filter((item) => item.qrCode.hasActive).length,
  };

  return (
    <SectionFrame
      title="Negocios, modulos e dashboards"
      description="Operacao empresarial consolidada com dashboard, analytics, visitantes, imagens, produtos e delivery."
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
            description="A plataforma ja tem dashboard empresarial, vertical gastronomica, QR e billing. Falta apenas uma empresa sua entrar nesse fluxo."
            actionLabel="Criar empresa"
            onAction={onCreateBusiness}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            Este perfil nao possui empresas administradas no momento.
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresas</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{businessModules.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Operacao empresarial total</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Gastronomia</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{businessSummary.gastronomy}</p>
              <p className="mt-1 text-xs text-muted-foreground">Verticais gastronomicos ativos</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{businessSummary.delivery}</p>
              <p className="mt-1 text-xs text-muted-foreground">Operacoes com delivery ligado</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">QR / premium</p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {businessSummary.qrReady}/{businessSummary.premium}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">QR pronto / negocios premium</p>
            </div>
          </div>

          <div className="space-y-4">
            {businessModules.map((business) => (
              <BusinessModuleCard
                key={business.businessId}
                business={business}
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

function BusinessModuleCard({
  business,
  onNavigate,
  onCopy,
}: {
  business: ProfileBusinessModuleItem;
  onNavigate: (url: string) => void;
  onCopy: (url: string, label: string) => void;
}) {
  const featureBadges = [
    business.subscription.canUseShortPremiumLink && business.shareUrl ? 'Link premium' : null,
    business.qrCode.hasActive ? 'QR pronto' : null,
    business.gastronomy.active ? 'Gastronomia ativa' : null,
    business.gastronomy.deliveryEnabled ? 'Delivery ativo' : null,
    business.subscription.canUseMotoboyNetwork ? 'Rede motoboy' : null,
  ].filter(Boolean) as string[];

  const gastronomyOwnerActions = [
    business.gastronomy.dashboardUrl
      ? { label: 'Painel gastro', url: business.gastronomy.dashboardUrl }
      : null,
    business.gastronomy.analyticsUrl
      ? { label: 'Analytics', url: business.gastronomy.analyticsUrl }
      : null,
    business.gastronomy.menuUrl
      ? { label: 'Produtos / cardapio', url: business.gastronomy.menuUrl }
      : null,
    business.gastronomy.ordersUrl
      ? { label: 'Pedidos', url: business.gastronomy.ordersUrl }
      : null,
    business.gastronomy.deliveriesUrl
      ? { label: 'Entregas', url: business.gastronomy.deliveriesUrl }
      : null,
    !business.gastronomy.active && business.gastronomy.setupUrl
      ? { label: 'Ativar gastronomia', url: business.gastronomy.setupUrl }
      : null,
  ].filter((item): item is { label: string; url: string } => Boolean(item?.url));

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{business.name}</h3>
            {business.verified && (
              <Badge variant="outline" className="h-5 border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-700">
                Verificada
              </Badge>
            )}
            {business.isPremium && (
              <Badge className="h-5 bg-amber-500 px-2 text-[10px] text-white">
                Premium
              </Badge>
            )}
            <Badge variant="secondary" className="h-5 text-[10px]">
              Plano {formatPlanLabel(business.subscription.planTier)}
            </Badge>
            <Badge variant="outline" className="h-5 text-[10px]">
              {business.subscription.status}
            </Badge>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {business.neighborhood || "Bairro nao informado"}
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
                Sem modulos extras configurados
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button size="sm" className="gap-1.5" onClick={() => onNavigate(business.dashboardUrl)}>
            Gerenciar empresa
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onNavigate(businessManagementRoutes.planos(business.businessId))}
          >
            Planos
          </Button>
          {business.gastronomy.dashboardUrl && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onNavigate(business.gastronomy.dashboardUrl!)}
            >
              Gastronomia
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onNavigate(businessManagementRoutes.linkPremium(business.businessId))}
          >
            Link premium
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onNavigate(business.editUrl)}>
            Editar / imagens
          </Button>
          {business.publicUrl && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onNavigate(business.publicUrl!)}>
              Ver pagina publica
            </Button>
          )}
          {business.shareUrl && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onNavigate(business.shareUrl!)}
            >
              Ver mini-site
            </Button>
          )}
          {business.shareUrl && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onCopy(business.shareUrl!, 'link da empresa')}>
              Compartilhar
            </Button>
          )}
        </div>
      </div>

      {gastronomyOwnerActions.length > 0 ? (
        <div className="mt-4 border-t border-border/70 pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Gestao operacional
          </p>
          <div className="flex flex-wrap gap-2">
            {gastronomyOwnerActions.map((action) => (
              <Button
                key={`${business.businessId}-${action.label}`}
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => onNavigate(action.url)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
