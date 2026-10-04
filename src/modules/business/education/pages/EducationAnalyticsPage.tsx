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

import { useParams } from 'react-router-dom';
import { BarChart3, Download } from 'lucide-react';
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
  } = useEducationAnalytics({
    businessId: businessId || '',
    profileId: profile?.id,
    nicheKey: profile?.niche_key,
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
  const canExportAnalytics = canExport && nicheAllowsExport;

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

  if (isProfileLoading || nicheBilling.isLoading) {
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

  if (isAnalyticsError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar o Analytics"
        error={
          analyticsError instanceof Error
            ? analyticsError
            : new Error('A leitura das métricas falhou. Nenhum zero artificial foi exibido.')
        }
        onRetry={() => void refetchAnalytics()}
      />
    );
  }

  if (!canAccessAnalytics || !canViewAnalytics.allowed) {
    return (
      <div className="container mx-auto max-w-4xl p-6 text-territory-ink">
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

  return (
    <div className="container mx-auto max-w-6xl p-6 text-territory-ink">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
          <BarChart3 className="h-6 w-6 text-territory-brand" aria-hidden="true" />
          Analytics
        </h1>

        {canExportAnalytics ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data || isAnalyticsLoading}
            className="gap-2 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar Relatório
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
            total: data?.leads.total ?? 0,
            new: data?.leads.new ?? 0,
            enrolled: data?.leads.enrolled ?? 0,
            conversionRate: data?.leads.conversionRate ?? 0,
          }}
          programs={{
            total: data?.programs.total ?? 0,
            active: data?.programs.active ?? 0,
          }}
          events={{
            total: data?.events.total ?? 0,
            upcoming: data?.events.upcoming ?? 0,
          }}
          isLoading={isAnalyticsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EducationAnalyticsConversionCard
          pipeline={{
            new: data?.leads.new ?? 0,
            contacted: data?.leads.contacted ?? 0,
            visitScheduled: data?.leads.visitScheduled ?? 0,
            proposalSent: data?.leads.proposalSent ?? 0,
            enrolled: data?.leads.enrolled ?? 0,
            lost: data?.leads.lost ?? 0,
          }}
          conversionRate={data?.leads.conversionRate ?? 0}
          avgDaysToFirstContact={data?.leads.avgDaysToFirstContact ?? 0}
          isLoading={isAnalyticsLoading}
        />
      </div>
    </div>
  );
}

export default EducationAnalyticsPage;
