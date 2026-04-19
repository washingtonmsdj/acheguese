/**
 * GASTRONOMY BILLING PAGE — Página de gerenciamento de assinatura
 *
 * Permite ao restaurante:
 * - Ver plano atual
 * - Fazer upgrade/downgrade
 * - Cancelar assinatura
 * - Reativar assinatura
 * - Ver histórico de faturas
 * - Gerenciar métodos de pagamento
 */
import { useState } from 'react';
import { logger } from '@/shared/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';
import { useBusinessSubscription, BillingService } from '@/core/billing';
import { PlanTier, PLANS } from '@/core/billing';
import { toast } from 'sonner';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  ArrowUpCircle,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function GastronomyBillingPage() {
  const businessId = ''; // Aguardando integração com BusinessContext
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isManagingPortal, setIsManagingPortal] = useState(false);
  
  const {
    subscription,
    planTier: currentPlan,
    isLoading,
    isActive,
    isCanceled,
    isPastDue,
    isTrialing,
    willCancelAtPeriodEnd,
    isFree,
    isPro,
    isDelivery,
  } = useBusinessSubscription(businessId);
  
  // Capability flags
  const canUpgrade = isActive && !isDelivery;
  const canCancel = isActive && !willCancelAtPeriodEnd && !isFree;
  const canReactivate = isActive && willCancelAtPeriodEnd;

  const handleUpgrade = async (planCode: string) => {
    setIsUpgrading(true);
    try {
      await BillingService.redirectToCheckout({
        planCode,
        successUrl: `${window.location.origin}/gastronomia/billing?upgrade=success`,
        cancelUrl: window.location.href,
      });
    } catch (error) {
      logger.error('[GastronomyBillingPage] Erro ao iniciar upgrade', error);
      toast.error('Erro ao iniciar upgrade. Tente novamente.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingPortal(true);
    try {
      await BillingService.redirectToPortal(window.location.href);
    } catch (error) {
      logger.error('[GastronomyBillingPage] Erro ao abrir portal', error);
      toast.error('Erro ao abrir portal de assinatura. Tente novamente.');
    } finally {
      setIsManagingPortal(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie seu plano e pagamentos
        </p>
      </div>
      
      {/* Status Alert */}
      {willCancelAtPeriodEnd && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sua assinatura será cancelada em{' '}
            {subscription?.current_period_end && 
              format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </AlertDescription>
        </Alert>
      )}
      
      {isPastDue && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Pagamento em atraso. Atualize seu método de pagamento para continuar usando os recursos.
          </AlertDescription>
        </Alert>
      )}
      
      {isTrialing && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Você está em período de teste até{' '}
            {subscription?.trial_end && 
              format(new Date(subscription.trial_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>
                {isActive ? 'Assinatura ativa' : 'Assinatura inativa'}
              </CardDescription>
            </div>
            <StatusBadge 
              isActive={isActive}
              isCanceled={isCanceled}
              isPastDue={isPastDue}
              isTrialing={isTrialing}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">
                {PLANS[currentPlan].name}
              </h3>
              <p className="text-3xl font-bold text-primary">
                {PLANS[currentPlan].price}
                {currentPlan !== PlanTier.FREE && (
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                )}
              </p>
            </div>
          </div>
          
          <Separator />
          
          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-semibold">Recursos incluídos:</h4>
            <ul className="space-y-2">
              {PLANS[currentPlan].features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {subscription?.current_period_end && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                {willCancelAtPeriodEnd ? (
                  <>Acesso até {format(new Date(subscription.current_period_end), "dd/MM/yyyy")}</>
                ) : (
                  <>Próxima cobrança em {format(new Date(subscription.current_period_end), "dd/MM/yyyy")}</>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Available Plans */}
      {canUpgrade && (
        <Card>
          <CardHeader>
            <CardTitle>Planos Disponíveis</CardTitle>
            <CardDescription>
              Faça upgrade para desbloquear mais recursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pro Plan */}
              {isFree && (
                <PlanCard
                  plan={PLANS[PlanTier.PRO]}
                  onUpgrade={() => handleUpgrade('gastronomy_pro')}
                  isUpgrading={isUpgrading}
                  isCurrent={false}
                />
              )}
              
              {/* Delivery Plan */}
              {!isDelivery && (
                <PlanCard
                  plan={PLANS[PlanTier.DELIVERY]}
                  onUpgrade={() => handleUpgrade('gastronomy_delivery')}
                  isUpgrading={isUpgrading}
                  isCurrent={false}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>
            Gerencie sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canReactivate && (
            <Button
              onClick={handleManageSubscription}
              disabled={isManagingPortal}
              className="w-full"
              variant="default"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isManagingPortal ? 'Abrindo portal...' : 'Reativar Assinatura'}
            </Button>
          )}
          
          {canCancel && (
            <Button
              onClick={handleManageSubscription}
              disabled={isManagingPortal}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isManagingPortal ? 'Abrindo portal...' : 'Cancelar Assinatura'}
            </Button>
          )}
          
          {!isFree && (
            <p className="text-xs text-muted-foreground text-center">
              Ao cancelar, você continuará tendo acesso até o fim do período atual
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════

interface StatusBadgeProps {
  isActive: boolean;
  isCanceled: boolean;
  isPastDue: boolean;
  isTrialing: boolean;
}

function StatusBadge({ isActive, isCanceled, isPastDue, isTrialing }: StatusBadgeProps) {
  if (isTrialing) {
    return (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        Período de Teste
      </Badge>
    );
  }
  
  if (isPastDue) {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Pagamento Atrasado
      </Badge>
    );
  }
  
  if (isCanceled) {
    return (
      <Badge variant="secondary">
        <XCircle className="mr-1 h-3 w-3" />
        Cancelada
      </Badge>
    );
  }
  
  if (isActive) {
    return (
      <Badge variant="default">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Ativa
      </Badge>
    );
  }
  
  return null;
}

interface PlanCardProps {
  plan: typeof PLANS[PlanTier];
  onUpgrade: () => void;
  isUpgrading: boolean;
  isCurrent: boolean;
}

function PlanCard({ plan, onUpgrade, isUpgrading, isCurrent }: PlanCardProps) {
  return (
    <Card className={isCurrent ? 'border-primary' : ''}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="text-2xl font-bold">
          {plan.price}
          {plan.tier !== PlanTier.FREE && (
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.slice(0, 4).map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        {!isCurrent && (
          <Button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="w-full"
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            {isUpgrading ? 'Processando...' : 'Fazer Upgrade'}
          </Button>
        )}
        
        {isCurrent && (
          <Badge variant="default" className="w-full justify-center">
            Plano Atual
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

