/**
 * ══════════════════════════════════════════════════════════════════════════
 * SUBSCRIPTION MANAGEMENT PAGE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Página para gerenciar assinatura do usuário.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */
import { logger } from '@/shared/utils/logger';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { useBilling } from '@/core/billing/hooks/useBilling';
import { useSubscription } from '@/core/billing/hooks/useSubscription';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const { redirectToPortal, plans } = useBilling();
  const {
    subscription,
    isLoadingSubscription,
    isActive,
    isTrialing,
    isCanceled,
    isPastDue,
    planName,
    statusLabel,
    canUpgrade,
    canDowngrade,
  } = useSubscription();

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    try {
      await redirectToPortal(buildPublicAbsoluteUrl("/settings/subscription"));
    } catch (error) {
      logger.error('Error redirecting to portal:', error);
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isLoadingSubscription) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = plans?.find(p => p.code === subscription?.plan_code);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie seu plano, pagamentos e faturas
        </p>
      </div>

      {/* Status Alerts */}
      {isPastDue && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pagamento Pendente</AlertTitle>
          <AlertDescription>
            Houve um problema com seu último pagamento. Por favor, atualize seu método de pagamento.
          </AlertDescription>
        </Alert>
      )}

      {isCanceled && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Assinatura Cancelada</AlertTitle>
          <AlertDescription>
            Sua assinatura será cancelada no final do período atual em{' '}
            {subscription?.current_period_end && 
              format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </AlertDescription>
        </Alert>
      )}

      {isTrialing && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Período de Teste</AlertTitle>
          <AlertDescription>
            Você está no período de teste até{' '}
            {subscription?.trial_end && 
              format(new Date(subscription.trial_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>
              Informações sobre sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{planName}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan?.price_display}/mês
                </p>
              </div>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {statusLabel}
              </Badge>
            </div>

            {subscription?.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Renova em{' '}
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}

            {/* Features */}
            {currentPlan?.features && (
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Recursos incluídos:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(currentPlan.features as string[]).slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manage Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Pagamento</CardTitle>
            <CardDescription>
              Atualize seu método de pagamento, veja faturas e gerencie sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={handleManageSubscription}
              disabled={isRedirecting || !subscription?.stripe_customer_id}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Abrir Portal de Pagamento
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Você será redirecionado para o portal seguro do Stripe
            </p>
          </CardContent>
        </Card>

        {/* Upgrade/Downgrade Options */}
        {(canUpgrade || canDowngrade) && (
          <Card>
            <CardHeader>
              <CardTitle>Alterar Plano</CardTitle>
              <CardDescription>
                {canUpgrade ? 'Faça upgrade para desbloquear mais recursos' : 'Considere um plano mais adequado'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {canUpgrade && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/planos')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Fazer Upgrade
                </Button>
              )}
              {canDowngrade && subscription?.plan_code !== 'free' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleManageSubscription}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Fazer Downgrade
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Precisa de Ajuda?</CardTitle>
            <CardDescription>
              Entre em contato com nosso suporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <a href="/contato">
                Falar com Suporte
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
