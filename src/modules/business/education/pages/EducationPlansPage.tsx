/**
 * EducationPlansPage
 *
 * Pagina de planos e billing da instituicao.
 * Rota: /central/empresas/:businessId/educacao/planos
 */

import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CreditCard,
  Download,
  Globe,
  HardDrive,
  Lock,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { logger } from '@/shared/utils/logger';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { BillingService } from '@/core/billing';
import { useBillingPlans } from '@/core/billing/hooks/useBillingPlans';
import { useEducationSubscription } from '../hooks/useEducationSubscription';
import { EducationUrlService } from '../services/EducationUrlService';

type EducationPlanTemplate = {
  billingCode: string;
  name: string;
  description: string;
  popular?: boolean;
  features: {
    maxPrograms: number;
    maxLeadsPerMonth: number;
    maxEvents: number;
    storageMB: number;
    canUsePremiumPublicPage: boolean;
    canUseShortPremiumLink: boolean;
    canUseAnalytics: boolean;
    canExportData: boolean;
  };
};

const EDUCATION_PLAN_TEMPLATES: EducationPlanTemplate[] = [
  {
    billingCode: 'free',
    name: 'Gratuito',
    description: 'Para começar',
    features: {
      maxPrograms: 5,
      maxLeadsPerMonth: 50,
      maxEvents: 3,
      storageMB: 50,
      canUsePremiumPublicPage: false,
      canUseShortPremiumLink: false,
      canUseAnalytics: false,
      canExportData: false,
    },
  },
  {
    billingCode: 'pro',
    name: 'Básico',
    description: 'Para instituições em crescimento',
    features: {
      maxPrograms: 20,
      maxLeadsPerMonth: 500,
      maxEvents: 10,
      storageMB: 100,
      canUsePremiumPublicPage: true,
      canUseShortPremiumLink: false,
      canUseAnalytics: true,
      canExportData: false,
    },
  },
  {
    billingCode: 'delivery',
    name: 'Premium',
    description: 'Para instituições profissionais',
    popular: true,
    features: {
      maxPrograms: 50,
      maxLeadsPerMonth: 2000,
      maxEvents: 50,
      storageMB: 500,
      canUsePremiumPublicPage: true,
      canUseShortPremiumLink: true,
      canUseAnalytics: true,
      canExportData: true,
    },
  },
  {
    billingCode: 'enterprise',
    name: 'Empresarial',
    description: 'Para redes de instituições',
    features: {
      maxPrograms: 999,
      maxLeadsPerMonth: 9999,
      maxEvents: 999,
      storageMB: 2000,
      canUsePremiumPublicPage: true,
      canUseShortPremiumLink: true,
      canUseAnalytics: true,
      canExportData: true,
    },
  },
];

const FEATURE_LABELS: Record<string, { label: string; icon: typeof Check }> = {
  maxPrograms: { label: 'Programas', icon: BookOpen },
  maxLeadsPerMonth: { label: 'Leads/mês', icon: Users },
  maxEvents: { label: 'Eventos', icon: Calendar },
  storageMB: { label: 'Armazenamento', icon: HardDrive },
  canUsePremiumPublicPage: { label: 'Página Premium', icon: Globe },
  canUseShortPremiumLink: { label: 'Link Curto', icon: Lock },
  canUseAnalytics: { label: 'Analytics', icon: TrendingUp },
  canExportData: { label: 'Exportar Dados', icon: Download },
};

function formatFeatureValue(key: string, value: boolean | number) {
  if (typeof value === 'boolean') {
    return value ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-gray-300" />;
  }

  if (key === 'storageMB') {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}GB` : `${value}MB`;
  }

  if (value === 999 || value === 9999) {
    return 'Ilimitado';
  }

  return value.toLocaleString('pt-BR');
}

export function EducationPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, entitlements, planType, isLoading } = useEducationSubscription({
    businessId: businessId!,
    enabled: Boolean(businessId),
  });
  const { data: billingPlans = [], isLoading: billingPlansLoading } = useBillingPlans();

  const planCards = EDUCATION_PLAN_TEMPLATES.map((template) => {
    const billingPlan = billingPlans.find((plan) => plan.code === template.billingCode);
    return {
      ...template,
      name: billingPlan?.name ?? template.name,
      description: billingPlan?.description ?? template.description,
      priceDisplay: billingPlan?.priceDisplay ?? 'Consultar',
      billingPeriod: billingPlan?.billingPeriod ?? 'month',
      popular: billingPlan?.isFeatured ?? template.popular,
    };
  });

  const currentPlanCode = planType === 'free' ? 'free' : planType === 'premium' ? 'delivery' : 'pro';
  const dashboardUrl = businessId ? EducationUrlService.buildAdminDashboardUrl(businessId) : null;
  const plansUrl = businessId ? EducationUrlService.buildAdminPlansUrl(businessId) : null;

  const handleUpgrade = async (planId: string) => {
    if (!plansUrl) {
      toast({
        title: 'Instituição indisponível',
        description: 'Não foi possível identificar a instituição para iniciar o checkout.',
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
        planCode: planId,
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
      <div className="container mx-auto p-6">
        <Skeleton className="mb-6 h-8 w-1/3" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = planCards.find((plan) => plan.billingCode === currentPlanCode) || planCards[0];

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
          onClick={() => (dashboardUrl ? navigate(dashboardUrl) : navigate(-1))}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planos e Assinatura</h1>
            <p className="text-sm text-gray-500">
              Gerencie sua assinatura e recursos do módulo Education
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
              </div>
              <p className="text-2xl font-bold text-blue-600">{currentPlan.name}</p>
              <p className="text-sm text-gray-500">
                {status?.expiresAt
                  ? `Renova em: ${new Date(status.expiresAt).toLocaleDateString('pt-BR')}`
                  : 'Sem data de expiração'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/settings/subscription')}>
                Gerenciar Assinatura
              </Button>
            </div>
          </div>

          {entitlements && (
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-blue-100 pt-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Programas</p>
                <p className="text-lg font-semibold">
                  {entitlements.maxPrograms === 999 ? 'Ilimitado' : entitlements.maxPrograms}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Leads/mês</p>
                <p className="text-lg font-semibold">
                  {entitlements.maxLeadsPerMonth === 9999
                    ? 'Ilimitado'
                    : entitlements.maxLeadsPerMonth}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Eventos</p>
                <p className="text-lg font-semibold">
                  {entitlements.maxEvents === 999 ? 'Ilimitado' : entitlements.maxEvents}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Armazenamento</p>
                <p className="text-lg font-semibold">
                  {entitlements.storageMB >= 1000
                    ? `${(entitlements.storageMB / 1000).toFixed(0)}GB`
                    : `${entitlements.storageMB}MB`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Escolha seu Plano</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {planCards.map((plan, index) => (
          <motion.div
            key={plan.billingCode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`flex h-full flex-col ${
                currentPlanCode === plan.billingCode ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
              } ${plan.popular ? 'border-blue-300' : ''}`}
            >
              {plan.popular && (
                <div className="bg-blue-500 px-2 py-1 text-center text-xs font-medium text-white">
                  Mais Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-gray-500">{plan.description}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                  {plan.priceDisplay !== 'Grátis' && (
                    <span className="text-gray-500">/mês</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-2">
                  {Object.entries(plan.features).map(([key, value]) => {
                    const feature = getRecordValue(FEATURE_LABELS, key);
                    if (!feature) return null;

                    const Icon = feature.icon;

                    return (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="flex-1">{feature.label}</span>
                        <span className="font-medium">{formatFeatureValue(key, value)}</span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  variant={currentPlanCode === plan.billingCode ? 'secondary' : 'default'}
                  className="w-full"
                  disabled={currentPlanCode === plan.billingCode}
                  onClick={() => handleUpgrade(plan.billingCode)}
                >
                  {currentPlanCode === plan.billingCode ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Dúvidas frequentes</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-sm text-gray-600">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                As alterações serão aplicadas no próximo ciclo de faturamento.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">O que acontece se eu exceder os limites?</h3>
              <p className="text-sm text-gray-600">
                Você será notificado quando estiver próximo dos limites. Para continuar
                usando sem restrições, faça upgrade para um plano superior.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default EducationPlansPage;
