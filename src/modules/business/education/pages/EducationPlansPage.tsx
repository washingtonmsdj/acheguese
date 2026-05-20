/**
 * EducationPlansPage
 *
 * Pagina de planos e billing da instituicao.
 * Rota: /central/empresas/:businessId/education/planos
 */

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ArrowLeft,
  Check,
  X,
  Users,
  BookOpen,
  Calendar,
  HardDrive,
  Globe,
  Lock,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { logger } from '@/shared/utils/logger';
import { BillingService } from '@/core/billing';
import { useEducationSubscription } from '../hooks/useEducationSubscription';

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para começar',
    price: 0,
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
    id: 'basic',
    name: 'Básico',
    description: 'Para instituições em crescimento',
    price: 49,
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
    id: 'premium',
    name: 'Premium',
    description: 'Para instituições profissionais',
    price: 99,
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
    id: 'enterprise',
    name: 'Empresarial',
    description: 'Para redes de instituições',
    price: 299,
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

export function EducationPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, entitlements, planType, isLoading, permissions } = useEducationSubscription({
    businessId: businessId!,
    enabled: Boolean(businessId),
  });

  const handleUpgrade = async (planId: string) => {
    try {
      toast({
        title: 'Redirecionando...',
        description: 'Voce sera redirecionado para a pagina de checkout.',
      });

      await BillingService.redirectToCheckout({
        planCode: planId,
        successUrl: `${window.location.origin}/central/empresas/${businessId}/educacao/planos?upgrade=success`,
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

  const formatFeatureValue = (key: string, value: boolean | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <X className="w-5 h-5 text-gray-300" />
      );
    }
    if (key === 'storageMB') {
      return value >= 1000 ? `${(value / 1000).toFixed(0)}GB` : `${value}MB`;
    }
    if (value === 999 || value === 9999) {
      return 'Ilimitado';
    }
    return value.toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.id === planType) || PLANS[0];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(`/central/empresas/${businessId}/educacao`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planos e Assinatura</h1>
            <p className="text-sm text-gray-500">
              Gerencie sua assinatura e recursos do módulo Education
            </p>
          </div>
        </div>
      </motion.div>

      {/* Current Plan Card */}
      <Card className="mb-8 border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Plano Atual</h2>
                <Badge variant={status?.isActive ? 'default' : 'secondary'}>
                  {status?.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {currentPlan.name}
              </p>
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

          {/* Usage Stats */}
          {entitlements && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-100">
              <div>
                <p className="text-sm text-gray-500">Programas</p>
                <p className="text-lg font-semibold">
                  {entitlements.maxPrograms === 999 ? 'Ilimitado' : entitlements.maxPrograms}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Leads/mês</p>
                <p className="text-lg font-semibold">
                  {entitlements.maxLeadsPerMonth === 9999 ? 'Ilimitado' : entitlements.maxLeadsPerMonth}
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

      {/* Plans Grid */}
      <h2 className="text-lg font-semibold mb-4">Escolha seu Plano</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`h-full flex flex-col ${
                planType === plan.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : ''
              } ${plan.popular ? 'border-blue-300' : ''}`}
            >
              {plan.popular && (
                <div className="bg-blue-500 text-white text-xs font-medium py-1 px-2 text-center">
                  Mais Popular
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-gray-500">{plan.description}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R$ {plan.price}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-6 flex-1">
                  {Object.entries(plan.features).map(([key, value]) => {
                    const feature = FEATURE_LABELS[key];
                    if (!feature) return null;
                    const Icon = feature.icon;
                    return (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="flex-1">{feature.label}</span>
                        <span className="font-medium">
                          {formatFeatureValue(key, value)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  variant={planType === plan.id ? 'secondary' : 'default'}
                  className="w-full"
                  disabled={planType === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {planType === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Dúvidas Frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-sm text-gray-600">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                As alterações serão aplicadas no próximo ciclo de faturamento.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">O que acontece se eu exceder os limites?</h3>
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
