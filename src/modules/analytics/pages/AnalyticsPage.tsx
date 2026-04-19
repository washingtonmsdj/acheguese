/**
 * Página de Analytics
 * 
 * Exibe dashboards do Power BI para visualização de métricas e dados.
 * Inclui controle de acesso e suporte para múltiplos dashboards.
 */
import { logger } from '@/shared/utils/logger';
import React from 'react';
import { PowerBIEmbed } from '@/shared/components/powerbi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useAnalyticsAccess } from '../hooks/useAnalyticsAccess';
import { POWERBI_DASHBOARDS } from '../config/dashboards.config';

export function AnalyticsPage() {
  const { hasAccess, getAvailableDashboards } = useAnalyticsAccess();
  const availableDashboards = getAvailableDashboards();

  // Log de acesso
  React.useEffect(() => {
    logger.info('Analytics page accessed', {
      component: 'AnalyticsPage',
      hasAccess,
      dashboardCount: availableDashboards.length,
    });
  }, [hasAccess, availableDashboards.length]);

  // Sem acesso
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar os dashboards de analytics.
            Entre em contato com um administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Sem dashboards disponíveis
  if (availableDashboards.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertTitle>Nenhum Dashboard Disponível</AlertTitle>
          <AlertDescription>
            Não há dashboards configurados para o seu perfil no momento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Dashboard único
  if (availableDashboards.length === 1) {
    const dashboard = availableDashboards[0];
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            {dashboard.description}
          </p>
        </div>

        <PowerBIEmbed
          reportUrl={dashboard.url}
          title={dashboard.title}
          height="800px"
          onLoad={() => {
            logger.info('Dashboard loaded', {
              component: 'AnalyticsPage',
              dashboardId: dashboard.id,
            });
          }}
          onError={(error) => {
            logger.error('Dashboard load error', error, {
              component: 'AnalyticsPage',
              dashboardId: dashboard.id,
            });
          }}
        />
      </div>
    );
  }

  // Múltiplos dashboards
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize dados e métricas em tempo real
        </p>
      </div>

      <Tabs defaultValue={availableDashboards[0].id} className="w-full">
        <TabsList>
          {availableDashboards.map((dashboard) => (
            <TabsTrigger key={dashboard.id} value={dashboard.id}>
              {dashboard.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableDashboards.map((dashboard) => (
          <TabsContent key={dashboard.id} value={dashboard.id} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {dashboard.description}
            </div>
            <PowerBIEmbed
              reportUrl={dashboard.url}
              title={dashboard.title}
              height="800px"
              onLoad={() => {
                logger.info('Dashboard loaded', {
                  component: 'AnalyticsPage',
                  dashboardId: dashboard.id,
                });
              }}
              onError={(error) => {
                logger.error('Dashboard load error', error, {
                  component: 'AnalyticsPage',
                  dashboardId: dashboard.id,
                });
              }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default AnalyticsPage;
