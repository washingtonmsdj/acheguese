/**
 * EducationPlansPage
 *
 * Planos e billing da instituicao.
 *
 * O catalogo publicado de core/billing e a unica autoridade para nome, preco,
 * features e entitlements de plano. Limites operacionais de Education
 * pertencem ao registry do nicho e sao mostrados nas telas de operacao.
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
import { useEducationSubscription } from '../hooks/useEducationSubscription';
import { EducationUrlService } from '../services/EducationUrlService';
import { useOptionalBusinessDashboardContext } from '@/modules/business/dashboard/businessDashboardContext';
import { useDashboardAccess } from '@/core/business/hooks/useDashboardAccess';

const ENTITLEMENT_LABELS = [
  {
    key: 'canUsePremiumPublicPage',
    label: 'Pagina premium',
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
    label: 'Exportacao',
    icon: Download,
  },
] as const;

export function EducationPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const dashboardContext = useOptionalBusinessDashboardContext();
  const businessDataId = dashboardContext?.businessDataId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    permissions,
    loading: loadingAccess,
  } = useDashboardAccess(businessId);
  const canManageBilling = permissions.role === 'owner';
  const { status, entitlements, planType, isLoading } =
    useEducationSubscription({
      businessId: businessId!,
      enabled: Boolean(businessId),
    });
  const {
    data: billingPlans = [],
    isLoading: billingPlansLoading,
  } = useBillingPlans();

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
        title: 'Acao restrita ao Proprietario',
        description:
          'Gestores podem acompanhar os recursos do plano, mas somente o Proprietario pode alterar a assinatura.',
        variant: 'destructive',
      });
      return;
    }

    if (!plansUrl || !businessDataId) {
      toast({
        title: 'Instituicao indisponivel',
        description:
          'Nao foi possivel identificar a instituicao para iniciar o checkout.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Redirecionando...',
        description: 'Voce sera redirecionado para a pagina de checkout.',
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
        description: 'Nao foi possivel abrir o checkout. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || billingPlansLoading) {
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() =>
            dashboardUrl ? navigate(dashboardUrl) : navigate(-1)
          }
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Planos e Assinatura
            </h1>
            <p className="text-sm text-gray-500">
              Oferta e permissoes vindas do catalogo canonico de Billing
            </p>
          </div>
        </div>
      </motion.div>

      <Card className="mb-8 border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold">Plano Atual</h2>
                <Badge variant={status?.isActive ? 'default' : 'secondary'}>
                  {status?.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                {!loadingAccess && !canManageBilling ? (
                  <Badge variant="outline">Gestor: assinatura somente leitura</Badge>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {currentPlan?.name ?? 'Plano atual'}
              </p>
              <p className="text-sm text-gray-500">
                {status?.expiresAt
                  ? `Renova em: ${new Date(status.expiresAt).toLocaleDateString('pt-BR')}`
                  : 'Sem data de expiracao'}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/settings/subscription')}
              disabled={loadingAccess || !canManageBilling}
            >
              Gerenciar Assinatura
            </Button>
          </div>

          {entitlements && (
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-blue-100 pt-6 md:grid-cols-4">
              <Badge variant={entitlements.canUsePremiumPublicPage ? 'default' : 'outline'}>
                Pagina premium
              </Badge>
              <Badge variant={entitlements.canUseShortPremiumLink ? 'default' : 'outline'}>
                Link curto
              </Badge>
              <Badge variant={entitlements.canUseAnalytics ? 'default' : 'outline'}>
                Analytics
              </Badge>
              <Badge variant={entitlements.canExportData ? 'default' : 'outline'}>
                Exportacao
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Limites de programas, leads e eventos pertencem ao nicho Education
        selecionado e sao exibidos nas telas operacionais. Eles nao sao
        redefinidos por esta pagina de Billing.
      </div>

      <h2 className="mb-4 text-lg font-semibold">Escolha seu Plano</h2>
      {billingPlans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            Nenhum plano publicado esta disponivel no catalogo no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {billingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`flex h-full flex-col ${
                  currentPlanCode === plan.code
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : ''
                } ${plan.isFeatured ? 'border-blue-300' : ''}`}
              >
                {plan.isFeatured && (
                  <div className="bg-blue-500 px-2 py-1 text-center text-xs font-medium text-white">
                    Mais Popular
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-gray-500">
                      {plan.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {plan.priceDisplay}
                    </span>
                    {plan.priceCents > 0 && (
                      <span className="text-gray-500">/mes</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-4 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mb-5 space-y-2 border-t pt-4">
                    {ENTITLEMENT_LABELS.map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-2 text-xs text-gray-600"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                        {plan.entitlements[key] ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={
                      currentPlanCode === plan.code
                        ? 'secondary'
                        : 'default'
                    }
                    className="w-full"
                    disabled={
                      currentPlanCode === plan.code ||
                      loadingAccess ||
                      !canManageBilling
                    }
                    onClick={() => handleUpgrade(plan.code)}
                  >
                    {currentPlanCode === plan.code
                      ? 'Plano Atual'
                      : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Duvidas frequentes</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">
                Posso mudar de plano a qualquer momento?
              </h3>
              <p className="text-sm text-gray-600">
                O checkout e o ciclo da assinatura sao gerenciados pelo Billing
                canonico. Condicoes efetivas sao as publicadas no catalogo.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">
                Onde vejo os limites de operacao?
              </h3>
              <p className="text-sm text-gray-600">
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
