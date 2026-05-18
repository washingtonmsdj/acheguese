/**
 * EducationAnalyticsPage
 * 
 * Pagina de analytics da instituicao.
 * Rota: /central/empresas/:businessId/education/analytics
 * 
 * Regra: capability final = nicho permite AND plano permite
 * - analytics_basic: disponível se o nicho + plano permitirem
 * - analytics_advanced/export: requer capability + plano pago
 */

import { useParams } from 'react-router-dom';
import { BarChart3, Lock } from 'lucide-react';
import { useEducationAnalytics } from '../hooks';
import { EducationAnalyticsOverviewCard, EducationAnalyticsConversionCard } from '../components';
import { Button } from '@/shared/components/ui/button';
import { useEducationNicheBilling } from '../niches/hooks/useEducationNicheBilling';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import { useEducationProfile } from '../hooks/useEducationProfile';
import type { UpgradeReason } from '../niches/components/EducationUpgradeBanner';

function toUpgradeReason(reason: string): UpgradeReason {
  if (reason === 'plan_denied' || reason === 'niche_denied') return reason;
  return 'feature_unavailable';
}

export function EducationAnalyticsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  
  const { data: profile } = useEducationProfile(businessId);
  
  const { data, isLoading, canAccessAnalytics } = useEducationAnalytics({
    businessId: businessId!,
    enabled: Boolean(businessId),
  });
  
  // Verificação de nicho + billing
  const nicheBilling = useEducationNicheBilling({
    nicheKey: profile?.niche_key,
    businessId: businessId || '',
  });
  
  // Verifica se analytics básico está liberado (nicho + plano)
  const canViewAnalytics = nicheBilling.can('analytics_basic');
  // Verifica se analytics avançado/exportação está liberado
  const canAdvancedAnalytics = nicheBilling.can('analytics_advanced');

  // Se não tiver analytics básico, mostra bloqueio
  if (!canAccessAnalytics || !canViewAnalytics.allowed) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Analytics
        </h1>
        
        <EducationUpgradeBanner
          nicheKey={profile?.niche_key}
          businessId={businessId || ''}
          reason={!canViewAnalytics.allowed ? toUpgradeReason(canViewAnalytics.reason) : 'plan_denied'}
          feature="analytics_basic"
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Analytics
        </h1>
        {/* Botão de exportação só aparece se analytics_advanced estiver liberado */}
        {canAdvancedAnalytics.allowed ? (
          <Button variant="outline" size="sm">
            Exportar Relatório
          </Button>
        ) : (
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason={toUpgradeReason(canAdvancedAnalytics.reason)}
            feature="analytics_advanced"
            variant="inline"
          />
        )}
      </div>

      {/* Overview Cards - sempre visíveis com analytics básico */}
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
          isLoading={isLoading}
        />
      </div>

      {/* Conversion Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          avgDaysToConversion={data?.leads.avgDaysToConversion ?? 0}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default EducationAnalyticsPage;
