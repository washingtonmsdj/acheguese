/**
 * EducationAnalyticsPage
 *
 * Página de analytics da instituição.
 * Rota: /central/empresas/:businessId/educacao/analytics
 *
 * Regra:
 * - leitura de analytics usa o profile Education real;
 * - analytics básico exige nicho + entitlement canônico;
 * - exportação exige allowsExport do nicho + canExportReports do Billing;
 * - CSV é derivado apenas do read model carregado, sem segunda fonte.
 */

import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Download } from 'lucide-react';
import { useEducationAnalytics } from '../hooks';
import {
  EducationAnalyticsOverviewCard,
  EducationAnalyticsConversionCard,
} from '../components';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationNicheBilling } from '../niches/hooks/useEducationNicheBilling';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { buildEducationAnalyticsCsv } from '@/core/education/services/educationAnalyticsExport';
import { EducationAdminReadError } from '../components/EducationAdminReadError';
import { EducationProfileRequiredState } from '../components/EducationProfileRequiredState';
import { EducationUrlService } from '../services/EducationUrlService';
import type { UpgradeReason } from '../niches/components/EducationUpgradeBanner';

function toUpgradeReason(reason: string): UpgradeReason {
  if (reason === 'plan_denied' || reason === 'niche_denied') return reason;
  return 'feature_unavailable';
}

function downloadCsv(content: string, businessId: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  try {
    anchor.href = url;
    anchor.download = `educacao-analytics-${businessId}-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

export function EducationAnalyticsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { toast } = useToast();
  const dashboardUrl = businessId
    ? EducationUrlService.buildAdminDashboardUrl(businessId)
    : null;
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useEducationProfile(businessId);

  const {
    data,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics,
    canAccessAnalytics,
    canExport,
    isEntitlementLoading,
    isEntitlementError,
    entitlementError,
    refetchEntitlement,
  } = useEducationAnalytics({
    businessId: businessId || '',
    profileId: profile?.id,
    nicheKey: profile?.niche_key,
    enrollmentOpen: profile?.enrollment_open ?? null,
    enabled: Boolean(businessId && profile?.id),
  });

  const nicheBilling = useEducationNicheBilling({
    nicheKey: profile?.niche_key,
    businessId: businessId || '',
    enabled: Boolean(businessId && profile?.id),
  });

  const canViewAnalytics = nicheBilling.can('analytics_basic');
  const nicheAllowsExport =
    nicheBilling.niche.config?.entitlements.allowsExport ?? false;
  const canExportAnalytics = canExport && nicheAllowsExport && canViewAnalytics.allowed;

  const handleExport = () => {
    if (!businessId || !data || !canExportAnalytics) {
      toast({
        title: 'Exportação indisponível',
        description:
          'Os dados ou a permissão de exportação ainda não estão disponíveis.',
        variant: 'destructive',
      });
      return;
    }

    downloadCsv(buildEducationAnalyticsCsv(data), businessId);
    toast({
      title: 'Relatório exportado',
      description: 'O CSV foi gerado com as métricas carregadas desta instituição.',
    });
  };

  if (isProfileLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6 text-territory-ink">
        <Skeleton className="mb-6 h-8 w-48 bg-territory-raised" />
        <Skeleton className="h-64 w-full rounded-xl bg-territory-raised" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar o perfil de Educação"
        error={profileError}
        onRetry={() => void refetchProfile()}
      />
    );
  }

  if (!profile || !profile.niche_key) {
    return (
      <EducationProfileRequiredState
        businessId={businessId}
        title="Configure o perfil de Educação para acessar Analytics"
        description="O painel depende de um perfil educacional com nicho configurado. Conclua a configuração da instituição antes de consultar métricas."
      />
    );
  }

  if (isEntitlementLoading || nicheBilling.isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6 text-territory-ink" role="status" aria-label="Verificando acesso ao Analytics">
        <Skeleton className="mb-6 h-8 w-48 bg-territory-raised" />
        <Skeleton className="h-64 w-full rounded-xl bg-territory-raised" />
      </div>
    );
  }

  if (isEntitlementError || nicheBilling.subscription.isError) {
    return (
      <EducationAdminReadError
        title="Não foi possível verificar o acesso ao Analytics"
        error={entitlementError ?? nicheBilling.subscription.error}
        onRetry={() => void refetchEntitlement()}
      />
    );
  }

  if (nicheBilling.hasErrors) {
    return (
      <EducationAdminReadError
        title="Configuração educacional indisponível"
        error={new Error('Não foi possível resolver as capacidades do nicho educacional.')}
        onRetry={() => void refetchEntitlement()}
      />
    );
  }

  if (!canAccessAnalytics || !canViewAnalytics.allowed) {
    return (
      <div className="container mx-auto max-w-4xl p-4 text-territory-ink sm:p-6">
        {dashboardUrl && (
          <Link
            to={dashboardUrl}
            className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-territory-muted hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para Educação
          </Link>
        )}
        <h1 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold">
          <BarChart3 className="h-6 w-6 text-territory-brand" aria-hidden="true" />
          Analytics
        </h1>

        <EducationUpgradeBanner
          nicheKey={profile?.niche_key}
          businessId={businessId || ''}
          reason={
            !canViewAnalytics.allowed
              ? toUpgradeReason(canViewAnalytics.reason)
              : 'plan_denied'
          }
          feature="analytics_basic"
          variant="card"
        />
      </div>
    );
  }

  if (isAnalyticsError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar o Analytics"
        error={analyticsError}
        onRetry={() => void refetchAnalytics()}
      />
    );
  }

  if (isAnalyticsLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6 text-territory-ink" role="status" aria-label="Carregando métricas de Educação">
        <Skeleton className="mb-6 h-8 w-48 bg-territory-raised" />
        <Skeleton className="h-64 w-full rounded-xl bg-territory-raised" />
      </div>
    );
  }

  // Uma consulta permitida deve devolver métricas reais. Ausência de dados
  // não pode produzir cartões zerados nem ser apresentada como ausência de leads.
  if (!data) {
    return (
      <EducationAdminReadError
        title="Métricas de Educação indisponíveis"
        error={new Error('Consulta concluída sem dados de Analytics.')}
        onRetry={() => void refetchAnalytics()}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 text-territory-ink sm:p-6">
      {dashboardUrl && (
        <Link
          to={dashboardUrl}
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-territory-muted hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para Educação
        </Link>
      )}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
          <BarChart3 className="h-6 w-6 text-territory-brand" aria-hidden="true" />
          Analytics
          </h1>
          <p className="mt-1 text-sm text-territory-muted">
            Métricas calculadas a partir dos registros disponíveis da instituição.
          </p>
        </div>

        {canExportAnalytics ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isAnalyticsLoading}
            className="gap-2 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar CSV
          </Button>
        ) : (
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason={nicheAllowsExport ? 'plan_denied' : 'niche_denied'}
            feature="analytics_advanced"
            variant="inline"
          />
        )}
      </div>

      <div className="mb-6">
        <EducationAnalyticsOverviewCard
          leads={{
            total: data.leads.total,
            new: data.leads.new,
            enrolled: data.leads.enrolled,
            conversionRate: data.leads.conversionRate,
          }}
          programs={{
            total: data.programs.total,
            active: data.programs.active,
          }}
          events={{
            total: data.events.total,
            upcoming: data.events.upcoming,
          }}
          isLoading={isAnalyticsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EducationAnalyticsConversionCard
          pipeline={{
            new: data.leads.new,
            contacted: data.leads.contacted,
            visitScheduled: data.leads.visitScheduled,
            proposalSent: data.leads.proposalSent,
            enrolled: data.leads.enrolled,
            lost: data.leads.lost,
          }}
          conversionRate={data.leads.conversionRate}
          avgDaysToFirstContact={data.leads.avgDaysToFirstContact}
          isLoading={isAnalyticsLoading}
        />
      </div>
    </div>
  );
}

export default EducationAnalyticsPage;
