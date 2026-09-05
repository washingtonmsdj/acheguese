/**
 * EducationAnalyticsPage
 *
 * Pagina de analytics da instituicao.
 * Rota: /central/empresas/:businessId/educacao/analytics
 *
 * Regra:
 * - leitura de analytics usa o profile Education real;
 * - analytics basico exige nicho + entitlement canonico;
 * - exportacao exige allowsExport do nicho + canExportReports do Billing;
 * - CSV e derivado apenas do read model carregado, sem segunda fonte.
 */

import { useParams } from 'react-router-dom';
import { AlertCircle, BarChart3, Download, RefreshCw } from 'lucide-react';
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
        title: 'Exportacao indisponivel',
        description:
          'Os dados ou a permissao de exportacao ainda nao estao disponiveis.',
        variant: 'destructive',
      });
      return;
    }

    downloadCsv(buildEducationAnalyticsCsv(data), businessId);
    toast({
      title: 'Relatorio exportado',
      description: 'O CSV foi gerado com as metricas carregadas desta instituicao.',
    });
  };

  if (isProfileLoading || nicheBilling.isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <EducationAdminReadError
        title="Nao foi possivel carregar o perfil de Educacao"
        error={profileError}
        onRetry={() => refetchProfile()}
      />
    );
  }

  if (isAnalyticsError) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="mb-3 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <h1 className="font-semibold">Nao foi possivel carregar o Analytics</h1>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {analyticsError instanceof Error
              ? analyticsError.message
              : 'A leitura das metricas falhou. Nenhum zero artificial foi exibido.'}
          </p>
          <Button
            variant="outline"
            onClick={() => void refetchAnalytics()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!canAccessAnalytics || !canViewAnalytics.allowed) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="h-6 w-6" />
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
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="h-6 w-6" />
          Analytics
        </h1>

        {canExportAnalytics ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data || isAnalyticsLoading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Relatorio
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
