/**
 * GastronomyDashboardPage — Dashboard principal do módulo gastronômico
 *
 * Mostra:
 * - Status do plano
 * - Recursos disponíveis
 * - Atalhos para gestão
 * - Guards de permissão
 *
 * SSOT: Usa useBusinessSubscription do core/billing
 */

import { useParams, Link } from 'react-router-dom';
import { useEntitlements } from '@/core/billing/hooks/useEntitlements';
import { PlanStatusWidget, UpgradePrompt, UpgradePromptInline } from '../components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  UtensilsCrossed,
  QrCode,
  TrendingUp,
  Package,
  Truck,
  BarChart3,
  Settings,
  Clock,
  MapPin,
} from 'lucide-react';

export default function GastronomyDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { can, isLoading, entitlements } = useEntitlements({
    business_id: businessId,
    subscription_scope: 'business',
  });

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Gastronomia</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu perfil gastronômico e recursos
        </p>
      </div>

      {/* Widget de Status do Plano */}
      <PlanStatusWidget
        businessId={businessId!}
        currentMenuItems={0} // TODO: Buscar do banco
        currentImages={0} // TODO: Buscar do banco
        currentPromotions={0} // TODO: Buscar do banco
      />

      {/* Grid de Recursos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cardápio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              Cardápio
            </CardTitle>
            <CardDescription>
              Gerencie itens, categorias e preços
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can('canUseAdvancedMenu') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Itens cadastrados</span>
                  <span className="font-medium">0</span>
                </div>
                <Link to={`/dashboard/business/${businessId}/gastronomy/menu`}>
                  <Button className="w-full">
                    Gerenciar Cardápio
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Cardápio Avançado"
                requiredPlan="pro"
              />
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              Gere e personalize seu QR Code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scans totais</span>
              <span className="font-medium">0</span>
            </div>
            <Link to={`/dashboard/business/${businessId}/gastronomy/qr`}>
              <Button className="w-full" variant="outline">
                Ver QR Code
              </Button>
            </Link>
            {can('canUseCustomQRCode') && (
              <p className="text-xs text-muted-foreground">
                ✨ QR Code personalizado disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Promoções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Promoções
            </CardTitle>
            <CardDescription>
              Crie ofertas e descontos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can('canUsePromotions') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Promoções ativas</span>
                  <span className="font-medium">0</span>
                </div>
                <Link to={`/dashboard/business/${businessId}/gastronomy/promotions`}>
                  <Button className="w-full">
                    Gerenciar Promoções
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Promoções"
                requiredPlan="pro"
              />
            )}
          </CardContent>
        </Card>

        {/* Pedidos Internos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pedidos Internos
            </CardTitle>
            <CardDescription>
              Receba e gerencie pedidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can('canReceiveInternalOrders') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pedidos hoje</span>
                  <span className="font-medium">0</span>
                </div>
                <Link to={`/dashboard/business/${businessId}/gastronomy/orders`}>
                  <Button className="w-full">
                    Ver Pedidos
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Pedidos Internos"
                requiredPlan="delivery"
              />
            )}
          </CardContent>
        </Card>

        {/* Rede de Motoboys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Rede de Motoboys
            </CardTitle>
            <CardDescription>
              Solicite entregas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can('canUseMotoboyNetwork') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entregas hoje</span>
                  <span className="font-medium">0</span>
                </div>
                <Link to={`/dashboard/business/${businessId}/gastronomy/delivery`}>
                  <Button className="w-full">
                    Solicitar Entrega
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Rede de Motoboys"
                requiredPlan="delivery"
              />
            )}
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              Métricas e relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can('canUseBasicAnalytics') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Visualizações</span>
                  <span className="font-medium">0</span>
                </div>
                <Link to={`/dashboard/business/${businessId}/gastronomy/analytics`}>
                  <Button className="w-full" variant="outline">
                    Ver Analytics
                  </Button>
                </Link>
                {can('canUseAdvancedAnalytics') && (
                  <p className="text-xs text-muted-foreground">
                    ✨ Analytics avançado disponível
                  </p>
                )}
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Analytics"
                requiredPlan="pro"
              />
            )}
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>
              Configure horários e exceções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-600">Aberto</span>
            </div>
            <Link to={`/dashboard/business/${businessId}/gastronomy/hours`}>
              <Button className="w-full" variant="outline">
                Configurar Horários
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Área de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Área de Entrega
            </CardTitle>
            <CardDescription>
              Configure bairros e taxas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {can('canConfigureDeliveryArea') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bairros atendidos</span>
                  <span className="font-medium">0</span>
                </div>
                <Link to={`/dashboard/business/${businessId}/gastronomy/delivery-area`}>
                  <Button className="w-full" variant="outline">
                    Configurar Área
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Área de Entrega"
                requiredPlan="delivery"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações
          </CardTitle>
          <CardDescription>
            Gerencie informações do perfil gastronômico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={`/dashboard/business/${businessId}/gastronomy/setup`}>
            <Button variant="outline">
              Editar Perfil Gastronômico
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
