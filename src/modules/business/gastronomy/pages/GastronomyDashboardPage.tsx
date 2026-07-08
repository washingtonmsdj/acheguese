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
import { useQuery } from '@tanstack/react-query';
import { useEntitlements } from '@/core/billing/hooks/useEntitlements';
import {
  MenuSummaryCard,
  OperationalStatusCard,
  PlanStatusWidget,
  QuickActionsCard,
  UpgradePromptInline,
} from '../components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { getMenuUsageStats } from '@/modules/business/gastronomy/services';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import {
  UtensilsCrossed,
  QrCode,
  Settings,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export default function GastronomyDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { can, isLoading } = useEntitlements({
    business_id: businessId,
    subscription_scope: 'business',
  });
  const { data: usageStats } = useQuery({
    queryKey: ['gastronomy', 'dashboard-usage', businessId],
    enabled: !!businessId,
    queryFn: async () => getMenuUsageStats(businessId!),
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
        <h1 className="text-3xl font-bold font-display">Dashboard Gastronomia</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu perfil gastronômico e recursos
        </p>
      </div>

      {/* Widget de Status do Plano */}
      <PlanStatusWidget
        businessId={businessId!}
        currentMenuItems={usageStats?.currentMenuItems ?? 0}
        currentImages={usageStats?.currentImages ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <OperationalStatusCard businessId={businessId!} />
        <MenuSummaryCard businessId={businessId!} />
      </div>

      <QuickActionsCard businessId={businessId!} />

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
            {can('canUseAdvancedCatalog') ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Itens disponiveis</span>
                  <span className="font-medium">{usageStats?.currentMenuItems ?? 0}</span>
                </div>
                <Link to={businessManagementRoutes.gastronomyCardapio(businessId!)}>
                  <Button className="w-full">
                    Gerenciar Cardápio
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Cardápio Avançado"
                offerKey="catalog"
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
              <span className="font-medium">Não rastreado</span>
            </div>
            <Link to={businessManagementRoutes.linkPremium(businessId!)}>
              <Button className="w-full" variant="outline">
                Ver QR Code
              </Button>
            </Link>
            {can('canUseCustomQRCode') && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                QR Code personalizado disponível
              </p>
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
              <span className="font-medium">Resumo acima</span>
            </div>
            <Link to={businessManagementRoutes.gastronomyHorarios(businessId!)}>
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
                  <span className="font-medium">Resumo acima</span>
                </div>
                <Link to={businessManagementRoutes.gastronomyAreaEntrega(businessId!)}>
                  <Button className="w-full" variant="outline">
                    Configurar Área
                  </Button>
                </Link>
              </>
            ) : (
              <UpgradePromptInline
                businessId={businessId!}
                feature="Área de Entrega"
                offerKey="delivery"
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
          <Link to={businessManagementRoutes.gastronomySetup(businessId!)}>
            <Button variant="outline">
              Editar Perfil Gastronômico
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}


