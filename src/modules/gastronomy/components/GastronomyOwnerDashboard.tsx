// @ts-nocheck
/**
 * GastronomyOwnerDashboard — Dashboard completo do dono do restaurante
 *
 * Gastronomia é um braço da empresa — reutiliza diretamente os componentes
 * de empresa sem duplicação:
 *   - AnalyticsDashboard → Analytics (visualizações, WhatsApp, conversão)
 *   - CouponManager      → Cupons e promoções
 *   - NeighborhoodMap    → Mapa do bairro com outros restaurantes
 *   - BranchNetworkBlock → Rede de filiais
 *
 * O GastronomyOwnerDashboard é apenas um orquestrador de tabs.
 */

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Eye,
  Gift,
  Heart,
  Map,
  Star,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils/cn';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

// Componentes de empresa reutilizados — implementações reais em @/modules/business
import AnalyticsDashboard from '@/modules/business/components/AnalyticsDashboard';
import CouponManager from '@/modules/business/components/CouponManager';
import { NeighborhoodMap } from '@/modules/business/components/NeighborhoodMap';
import BranchNetworkBlock from '@/modules/business/components/BranchNetworkBlock';
import { useNeighborhoodBounds } from '@/modules/business/hooks/useNeighborhoodBounds';

import { useGastronomyFavoritersCount } from '../hooks/useGastronomyFavoriters';
import type { GastronomyBusiness } from '../types';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface QuickMetrics {
  totalViews: number;
  viewsThisWeek: number;
  totalReviews: number;
  avgRating: number;
  recentViews: { date: string; count: number }[];
}

interface ViewRecord {
  viewed_at: string;
}

interface ReviewRecord {
  rating: number;
}

// ── Query function — fora do componente, sem side effects ─────────────────────

async function fetchQuickMetrics(businessProfileId: string): Promise<QuickMetrics> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const [totalRes, weekRes, reviewsRes, viewsLast7Res] = await Promise.all([
    supabase
      .from('business_views')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessProfileId),
    supabase
      .from('business_views')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessProfileId)
      .gte('viewed_at', weekAgo),
    supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_profile_id', businessProfileId)
      .eq('review_type', 'business')
      .eq('status', 'active'),
    supabase
      .from('business_views')
      .select('viewed_at')
      .eq('business_id', businessProfileId)
      .gte('viewed_at', weekAgo),
  ]);

  if (totalRes.error) logger.error('[GastronomyOwnerDashboard] views error', totalRes.error);
  if (reviewsRes.error) logger.error('[GastronomyOwnerDashboard] reviews error', reviewsRes.error);

  // Gráfico dos últimos 7 dias
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  (viewsLast7Res.data ?? []).forEach((v: ViewRecord) => {
    const day = v.viewed_at?.slice(0, 10);
    if (day && Object.prototype.hasOwnProperty.call(dayMap, day)) {
      dayMap[day]++;
    }
  });

  const reviews: ReviewRecord[] = reviewsRes.data ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return {
    totalViews: totalRes.count ?? 0,
    viewsThisWeek: weekRes.count ?? 0,
    totalReviews: reviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
    recentViews: Object.entries(dayMap).map(([date, count]) => ({ date, count })),
  };
}

// ── Painel de métricas rápidas ────────────────────────────────────────────────

function QuickMetricsPanel({
  businessProfileId,
  businessDataId,
}: {
  businessProfileId: string;
  businessDataId: string;
}) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['gastronomy', 'owner-dashboard', 'metrics', businessProfileId],
    queryFn: () => fetchQuickMetrics(businessProfileId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: favoritersCount = 0 } = useGastronomyFavoritersCount({
    businessDataId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn('h-20 rounded-xl', i === 1 && 'col-span-2')} />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const maxViewDay = Math.max(...metrics.recentViews.map((d) => d.count), 1);

  const stats = [
    {
      icon: Eye,
      label: 'Visualizações totais',
      value: metrics.totalViews,
      color: 'bg-primary/10 text-primary',
      span: true,
    },
    {
      icon: TrendingUp,
      label: 'Esta semana',
      value: metrics.viewsThisWeek,
      color: 'bg-emerald-500/10 text-emerald-600',
      span: false,
    },
    {
      icon: Star,
      label: 'Avaliações',
      value: `${metrics.avgRating} ⭐ (${metrics.totalReviews})`,
      color: 'bg-amber-500/10 text-amber-600',
      span: false,
    },
    {
      icon: Heart,
      label: 'Favoritos',
      value: favoritersCount,
      color: 'bg-red-500/10 text-red-500',
      span: false,
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <Card key={s.label} className={cn('border', s.span && 'col-span-2')}>
            <CardContent className="flex items-center gap-3 p-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                  s.color,
                )}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{s.value}</p>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mini gráfico de barras — últimos 7 dias */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              Visualizações · últimos 7 dias
            </p>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {metrics.recentViews.map((d) => {
              const pct = Math.max((d.count / maxViewDay) * 100, 4);
              const dayLabel = new Date(`${d.date}T12:00:00`)
                .toLocaleDateString('pt-BR', { weekday: 'short' })
                .slice(0, 3);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Mapa do bairro ────────────────────────────────────────────────────────────

function GastronomyNeighborhoodMap({ business }: { business: GastronomyBusiness }) {
  const latitude = business.address?.latitude;
  const longitude = business.address?.longitude;
  const locationName = business.location?.name;
  const geoPath = business.location?.geographic_path ?? '';

  // geographic_path: "ba/salvador/pituba" → state="ba", city="salvador"
  const [state, , ] = geoPath.split('/');
  const cityFromFullName = business.location?.full_name?.split(', ')[1] ?? '';

  const { namedBounds, center, isLoading } = useNeighborhoodBounds({
    neighborhood: locationName,
    city: cityFromFullName,
    state,
    enabled: !!locationName && !!cityFromFullName && !!state,
  });

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const mapCenter: [number, number] = hasCoords ? [latitude, longitude] : center;

  const markers = hasCoords
    ? [
        {
          id: business.business_data_id,
          name: business.name,
          category: 'restaurante',
          rating: business.rating,
          isOpen: true,
          coords: { lat: latitude, lng: longitude },
        },
      ]
    : [];

  if (!hasCoords && !locationName) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
        Coordenadas não disponíveis para exibir o mapa
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Localização do restaurante no bairro
      </p>
      <div className="h-72 rounded-xl overflow-hidden border">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <NeighborhoodMap
            businesses={markers}
            center={mapCenter}
            namedBounds={namedBounds}
            showControls={false}
          />
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface GastronomyOwnerDashboardProps {
  /** profile_id do business — chave para views, reviews e analytics */
  businessProfileId: string;
  /** id da tabela business_data — chave para favoritos e cupons */
  businessDataId: string;
  /** Objeto completo do negócio — para mapa e rede de filiais */
  business: GastronomyBusiness;
}

export function GastronomyOwnerDashboard({
  businessProfileId,
  businessDataId,
  business,
}: GastronomyOwnerDashboardProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="visao-geral">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="visao-geral" className="gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="cupons" className="gap-1.5">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Cupons</span>
          </TabsTrigger>
          <TabsTrigger value="mapa" className="gap-1.5">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Mapa</span>
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral: métricas rápidas + rede de filiais */}
        <TabsContent value="visao-geral" className="mt-6 space-y-6">
          <QuickMetricsPanel
            businessProfileId={businessProfileId}
            businessDataId={businessDataId}
          />
          <BranchNetworkBlock
            parentBusinessId={business.parent_business_id ?? null}
            currentBranchId={businessDataId}
            brandHubId={
              business.business_role === 'brand_hub' ? businessDataId : undefined
            }
            businessRole={business.business_role ?? 'standalone'}
            brandName={business.name}
          />
        </TabsContent>

        {/* Analytics — mesmo componente do DashboardEmpresaPageV2 */}
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard businessId={businessProfileId} />
        </TabsContent>

        {/* Cupons — mesmo componente do DashboardEmpresaPageV2 */}
        <TabsContent value="cupons" className="mt-6">
          <CouponManager
            businessId={businessProfileId}
            planType="profissional"
          />
        </TabsContent>

        {/* Mapa do bairro */}
        <TabsContent value="mapa" className="mt-6">
          <GastronomyNeighborhoodMap business={business} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
