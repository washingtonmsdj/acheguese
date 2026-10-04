/**
 * EducationPlansPage
 *
 * Planos e billing da instituição.
 *
 * O catálogo publicado de core/billing é a única autoridade para nome, preço,
 * features e entitlements de plano. Limites operacionais de Education
 * pertencem ao registry do nicho e são mostrados nas telas de operação.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  Globe,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { logger } from '@/shared/utils/logger';
import { BillingService } from '@/core/billing';
import { useBillingPlans } from '@/core/billing/hooks/useBillingPlans';
import { BILLING_PATHS } from '@/core/billing/routes/billingRoutes';
import { useEducationSubscription } from '../hooks/useEducationSubscription';
import { EducationUrlService } from '../services/EducationUrlService';
import { useOptionalBusinessDashboardContext } from '@/modules/business/dashboard/businessDashboardContext';
import { useDashboardAccess } from '@/core/business/hooks/useDashboardAccess';

const ENTITLEMENT_LABELS = [
  {
    key: 'canUsePremiumPublicPage',
    label: 'Página premium',
    icon: Globe,
  },
  {
    key: 'canUseShortPremiumLink',
    label: 'Link curto',
    icon: Lock,
  },
  {
    key: 'canUseBasicAnalytics',
    label: 'Analytics',
    icon: TrendingUp,
  },
  {
    key: 'canExportReports',
    label: 'Exportação',
    icon: Download,
  },
] as const;

const surfaceCardClassName =
  'border-territory-border bg-territory-surface text-territory-ink shadow-sm';

export function EducationPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const dashboardContext = useOptionalBusinessDashboardContext();
  const businessDataId = dashboardContext?.businessDataId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { permissions, loading: loadingAccess } = useDashboardAccess(businessId);
  const canManageBilling = permissions.role === 'owner';
  const { status, entitlements, planType, isLoading } =
    useEducationSubscription({
      businessId: businessId!,
      enabled: Boolean(businessId),
    });
  const { data: billingPlans = [], isLoading: billingPlansLoading } =
    useBillingPlans();

  const currentPlanCode =
    planType === 'free'
      ? 'free'
      : planType === 'premium'
        ? 'delivery'
        : 'pro';

  const currentPlan =
    billingPlans.find((plan) => plan.code === currentPlanCode) ??
    billingPlans[0] ??
    null;
  const dashboardUrl = businessId
    ? EducationUrlService.buildAdminDashboardUrl(businessId)
    : null;
  const plansUrl = businessId
    ? EducationUrlService.buildAdminPlansUrl(businessId)
    : null;

  const handleUpgrade = async (planCode: string) => {
    if (!canManageBilling) {
      toast({
        title: 'Ação restrita ao proprietário',
        description:
          'Gestores podem acompanhar os recursos do plano, mas somente o proprietário pode alterar a assinatura.',
        variant: 'destructive',
      });
      return;
    }

    if (!plansUrl || !businessDataId) {
      toast({
        title: 'Instituição indisponível',
        description:
          'Não foi possível identificar a instituição para iniciar o checkout.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Redirecionando...',
        description: 'Você será redirecionado para a página de checkout.',
      });

      await BillingService.redirectToCheckout({
        planCode,
        businessId: businessDataId,
        subscriptionScope: 'business',
        entityFamily: 'company',
        successUrl: `${window.location.origin}${plansUrl}?upgrade=success`,
        cancelUrl: window.location.href,
      });
    } catch (error) {
      logger.error('[EducationPlansPage] Erro ao iniciar checkout', error);
      toast({
        title: 'Erro ao iniciar checkout',
        description: 'Não foi possível abrir o checkout. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || billingPlansLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Skeleton className="mb-6 h-8 w-1/3" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 text-territory-ink">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
          onClick={() =>
            dashboardUrl ? navigate(dashboardUrl) : navigate(-1)
          }
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand shadow-sm">
            <CreditCard className="h-5 w-5 text-territory-on-image" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-territory-ink">
              Planos e assinatura
            </h1>
            <p className="text-sm text-territory-muted">
              Oferta e permissões vindas do catálogo canônico de Billing
            </p>
          </div>
        </div>
      </motion.div>

      <Card className="mb-8 border-territory-brand/25 bg-territory-brand/5 text-territory-ink shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-territory-ink">
                  Plano atual
                </h2>
                <Badge
                  className={
                    status?.isActive
                      ? 'border-territory-success/25 bg-territory-success/10 text-territory-success hover:bg-territory-success/15'
                      : 'border-territory-border bg-territory-raised text-territory-muted'
                  }
                >
                  {status?.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                {!loadingAccess && !canManageBilling ? (
                  <Badge
                    variant="outline"
                    className="border-territory-border text-territory-muted"
                  >
                    Gestor: assinatura somente leitura
                  </Badge>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-territory-brand">
                {currentPlan?.name ?? 'Plano atual'}
              </p>
              <p className="text-sm text-territory-muted">
                {status?.expiresAt
                  ? `Renova em: ${new Date(status.expiresAt).toLocaleDateString('pt-BR')}`
                  : 'Sem data de expiração'}
              </p>
            </div>

            <Button
              variant="outline"
              className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
              onClick={() => navigate(BILLING_PATHS.subscription)}
              disabled={loadingAccess || !canManageBilling}
            >
              Gerenciar assinatura
            </Button>
          </div>

          {entitlements && (
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-territory-brand/15 pt-6 md:grid-cols-4">
              <Badge
                className={
                  entitlements.canUsePremiumPublicPage
                    ? 'border-territory-success/25 bg-territory-success/10 text-territory-success'
                    : 'border-territory-border bg-territory-surface text-territory-muted'
                }
              >
                Página premium
              </Badge>
              <Badge
                className={
                  entitlements.canUseShortPremiumLink
                    ? 'border-territory-success/25 bg-territory-success/10 text-territory-success'
                    : 'border-territory-border bg-territory-surface text-territory-muted'
                }
              >
                Link curto
              </Badge>
              <Badge
                className={
                  entitlements.canUseAnalytics
                    ? 'border-territory-success/25 bg-territory-success/10 text-territory-success'
                    : 'border-territory-border bg-territory-surface text-territory-muted'
                }
              >
                Analytics
              </Badge>
              <Badge
                className={
                  entitlements.canExportData
                    ? 'border-territory-success/25 bg-territory-success/10 text-territory-success'
                    : 'border-territory-border bg-territory-surface text-territory-muted'
                }
              >
                Exportação
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 rounded-xl border border-territory-info/25 bg-territory-info/10 p-4 text-sm text-territory-ink">
        Limites de programas, leads e eventos pertencem ao nicho Education
        selecionado e são exibidos nas telas operacionais. Eles não são
        redefinidos por esta página de Billing.
      </div>

      <h2 className="mb-4 text-lg font-semibold text-territory-ink">
        Escolha seu plano
      </h2>
      {billingPlans.length === 0 ? (
        <Card className={surfaceCardClassName}>
          <CardContent className="p-6 text-sm text-territory-muted">
            Nenhum plano publicado está disponível no catálogo no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {billingPlans.map((plan, index) => {
            const isCurrent = currentPlanCode === plan.code;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`flex h-full flex-col overflow-hidden border-territory-border bg-territory-surface text-territory-ink shadow-sm ${
                    isCurrent
                      ? 'border-territory-brand ring-2 ring-territory-brand/20'
                      : ''
                  } ${plan.isFeatured ? 'border-territory-sun/60' : ''}`}
                >
                  {plan.isFeatured && (
                    <div className="bg-territory-sun px-2 py-1 text-center text-xs font-semibold text-territory-ink">
                      Mais popular
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-territory-ink">
                      {plan.name}
                    </CardTitle>
                    {plan.description && (
                      <p className="text-sm text-territory-muted">
                        {plan.description}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-territory-ink">
                        {plan.priceDisplay}
                      </span>
                      {plan.priceCents > 0 && (
                        <span className="text-territory-muted">/mês</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="mb-4 flex-1 space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-territory-ink"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-territory-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mb-5 space-y-2 border-t border-territory-border pt-4">
                      {ENTITLEMENT_LABELS.map(({ key, label, icon: Icon }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-2 text-xs text-territory-muted"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                          {plan.entitlements[key] ? (
                            <Check className="h-4 w-4 text-territory-success" />
                          ) : (
                            <span aria-label="Não incluído">—</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant={isCurrent ? 'secondary' : 'default'}
                      className={
                        isCurrent
                          ? 'w-full border-territory-border bg-territory-raised text-territory-muted'
                          : 'w-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90'
                      }
                      disabled={
                        isCurrent || loadingAccess || !canManageBilling
                      }
                      onClick={() => handleUpgrade(plan.code)}
                    >
                      {isCurrent ? 'Plano atual' : 'Escolher plano'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-territory-ink">
          Dúvidas frequentes
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className={surfaceCardClassName}>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium text-territory-ink">
                Posso mudar de plano a qualquer momento?
              </h3>
              <p className="text-sm text-territory-muted">
                O checkout e o ciclo da assinatura são gerenciados pelo Billing
                canônico. As condições efetivas são as publicadas no catálogo.
              </p>
            </CardContent>
          </Card>
          <Card className={surfaceCardClassName}>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium text-territory-ink">
                Onde vejo os limites de operação?
              </h3>
              <p className="text-sm text-territory-muted">
                Programas, leads e eventos usam os limites do nicho Education
                ativo. As telas de cada recurso exibem o limite correspondente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default EducationPlansPage;
