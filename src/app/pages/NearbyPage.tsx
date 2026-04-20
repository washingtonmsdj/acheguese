/**
 * NearbyPage — Hub central "Perto de Mim"
 *
 * Página principal de descoberta do usuário, reunindo empresas, gastronomia,
 * serviços, classificados e pontos turísticos de forma organizada e contextual.
 *
 * REFATORADO: Usa useResolvedUserLocation (SSOT) com fallback territorial.
 * GPS não é obrigatório — a página funciona sempre.
 *
 * @module pages
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CanonicalHero } from '@/shared/components/hero/CanonicalHero';
import { useNearbyEntities } from '@/features/nearby/hooks/useNearbyEntities';
import type { NearbyEntity } from '@/features/nearby/hooks/useNearbyEntities';
import {
  NearbyCard,
  NearbySection,
  NearbyMiniMap,
  NearbyClassifiedsSection,
  NearbyFilters,
  QUICK_CATEGORIES,
} from '@/features/nearby/components';
import type { QuickCategoryKey } from '@/features/nearby/components';
import { Button } from '@/shared/components/ui/button';
import {
  useLocationContext,
  useTerritoryLabels,
  TerritoryIndicator,
  useResolvedUserLocation,
} from '@/core/location';
import { TerritorySelectorV2 } from '@/core/location/components/TerritorySelectorV2';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import {
  MapPin, Navigation, Loader2, Store, Calendar, AlertTriangle,
  Landmark, Compass, ChevronRight, TrendingUp, Sparkles,
  UtensilsCrossed, Briefcase, Map, Info,
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const ALL_ENTITY_TYPES = ['business', 'event', 'alert', 'tourist_point'] as const;

const CATEGORY_TO_TYPES: Record<QuickCategoryKey, typeof ALL_ENTITY_TYPES[number][]> = {
  all: [...ALL_ENTITY_TYPES],
  food: ['business'],
  shopping: ['business'],
  services: ['business'],
  health: ['business'],
  education: ['business'],
  leisure: ['event', 'tourist_point'],
  fitness: ['business'],
  tourism: ['tourist_point'],
  events: ['event'],
  alerts: ['alert'],
};

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ============================================================================
// HELPERS
// ============================================================================

function groupByType(entities: NearbyEntity[]) {
  const groups: Record<string, NearbyEntity[]> = {};
  for (const e of entities) {
    (groups[e.type] ??= []).push(e);
  }
  return groups;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NearbyPage() {
  const navigate = useNavigate();
  const moduleUrls = useFriendlyModuleUrls();

  // ── SSOT: Contexto territorial ativo ───────────────────────────────
  const { activeLocation, activeTerritory } = useLocationContext();
  
  const resolved: ResolvedTerritory | null = activeTerritory?.location
    ? { kind: 'location', location: activeTerritory.location }
    : null;
  
  const territoryLabels = useTerritoryLabels(resolved);

  // ── SSOT: Posição do usuário com fallback territorial ──────────────
  const {
    coords: userLocation,
    status: locationStatus,
    isGps,
    isGoodForProximity,
    sourceMessage,
    resolve: resolveLocation,
    isLoading: locationLoading,
  } = useResolvedUserLocation({ autoResolve: true, tryGps: true });

  // ── State ──────────────────────────────────────────────────────────
  const [radiusKm, setRadiusKm] = useState(5);
  const [activeCategory, setActiveCategory] = useState<QuickCategoryKey>('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // ── Derived entity types from category ─────────────────────────────
  const entityTypes = useMemo(
    () => CATEGORY_TO_TYPES[activeCategory] || [...ALL_ENTITY_TYPES],
    [activeCategory],
  );

  // ── Data (SSOT) ────────────────────────────────────────────────────
  const { entities, isLoading: entitiesLoading, isError } = useNearbyEntities({
    radiusKm,
    entityTypes: entityTypes as any,
    center: userLocation,
    locationId: activeLocation?.id,
    limit: 100,
  });

  const isLoading = entitiesLoading;

  // ── Grouped entities ───────────────────────────────────────────────
  const grouped = useMemo(() => groupByType(entities), [entities]);
  const businesses = grouped.business || [];
  const events = grouped.event || [];
  const alerts = grouped.alert || [];
  const touristPoints = grouped.tourist_point || [];

  // ── Visible for "all results" list ──────────────────────────────────
  const displayedEntities = entities.slice(0, visibleCount);
  const canLoadMore = visibleCount < entities.length;

  // ── Handlers ───────────────────────────────────────────────────────
  const handleCategoryChange = useCallback((key: QuickCategoryKey) => {
    setActiveCategory(key);
    setVisibleCount(12);
  }, []);

  const handleRadiusChange = useCallback((r: number) => {
    setRadiusKm(r);
    setVisibleCount(12);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((v) => v + 12);
  }, []);

  const handleShowClassifiedInMap = useCallback((ad: any) => {
    const mapSection = document.querySelector('[aria-label="Mapa"]');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedItemId(ad.id);
      setTimeout(() => setHighlightedItemId(null), 3000);
    }
  }, []);

  // ── Contexto de distância (GPS vs territorial) ─────────────────────
  const distanceContext = isGps ? 'proximity' : 'territorial';
  const proximityLabel = isGps ? 'perto de você' : territoryLabels.inTerritory;

  return (
    <>
      <Helmet>
        <title>{`${territoryLabels.nearbyLabel} — ${entities.length} resultados em ${radiusKm}km`}</title>
        <meta
          name="description"
          content={`Descubra empresas, eventos, serviços e pontos turísticos ${proximityLabel} em um raio de ${radiusKm}km.`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ================================================================
            HERO (CanonicalHero SSOT)
        ================================================================ */}
        <CanonicalHero
          moduleName={territoryLabels.nearbyLabel}
          moduleIcon={Compass}
          title="Descubra o que está"
          titleHighlight={proximityLabel}
          subtitle={`Empresas, gastronomia, serviços, eventos e pontos turísticos — tudo organizado ${
            isGps ? 'por proximidade' : `${territoryLabels.inTerritory}`
          }.`}
          stats={[
            { value: `${radiusKm}km`, label: 'raio' },
            { value: String(entities.length), label: entities.length === 1 ? 'resultado' : 'resultados' },
            { value: String(businesses.length), label: 'empresas' },
          ]}
        />

        {/* ================================================================
            TERRITORY SELECTOR & LOCATION SOURCE INDICATOR
        ================================================================ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <TerritorySelectorV2 compact={false} />
          </div>
          <div className="flex items-center gap-3">
            {activeLocation && (
              <TerritoryIndicator resolved={resolved} />
            )}
          </div>
        </div>

        {/* ── Location source banner ──────────────────────────────── */}
        {locationStatus !== 'idle' && locationStatus !== 'resolving' && (
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-2 ${
            isGps ? 'bg-green-500/5' : 'bg-amber-500/5'
          }`}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                {isGps ? (
                  <Navigation className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Info className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span className={isGps ? 'text-green-700' : 'text-amber-700'}>
                  {sourceMessage}
                </span>
              </div>
              {!isGps && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => resolveLocation()}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Usar GPS
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            FILTERS (sticky)
        ================================================================ */}
        <div className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <NearbyFilters
              radiusKm={radiusKm}
              onRadiusChange={handleRadiusChange}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              resultCount={entities.length}
            />
          </div>
        </div>

        {/* ================================================================
            LOADING
        ================================================================ */}
        {isLoading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {locationLoading ? 'Obtendo sua localização...' : 'Buscando locais próximos...'}
            </p>
          </div>
        )}

        {/* ================================================================
            ERROR
        ================================================================ */}
        {isError && !isLoading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
            <div className="p-4 rounded-full bg-destructive/10 inline-block mb-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              Erro ao buscar locais
            </h3>
            <p className="text-muted-foreground mb-6">
              Não foi possível buscar entidades próximas. Tente novamente.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* ================================================================
            CONTENT SECTIONS
        ================================================================ */}
        {!isLoading && !isError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 divide-y divide-border/30">

            {/* ── Mini Mapa ───────────────────────────────────────── */}
            <NearbySection
              title={territoryLabels.mapLabel}
              subtitle={isGps ? `Seus arredores em ${radiusKm}km` : `Mapa ${territoryLabels.inTerritory}`}
              icon={Map}
              iconColorClass="bg-accent/10 text-accent-foreground"
            >
              <NearbyMiniMap
                userLocation={userLocation}
                entities={entities}
                radiusKm={radiusKm}
              />
            </NearbySection>

            {/* ── Empresas ────────────────────────────────────────── */}
            <NearbySection
              title={`Empresas ${proximityLabel}`}
              subtitle="Lojas, restaurantes e mais"
              icon={Store}
              iconColorClass="bg-blue-500/10 text-blue-500"
              count={businesses.length}
              isEmpty={businesses.length === 0}
              isLoading={isLoading}
              onSeeAll={businesses.length > 6 ? () => navigate(moduleUrls.business) : undefined}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.slice(0, 6).map((e) => (
                  <NearbyCard key={e.id} entity={e} onNavigate={navigate} />
                ))}
              </div>
            </NearbySection>

            {/* ── Gastronomia ─────────────────────────────────────── */}
            <NearbySection
              title={`Gastronomia ${proximityLabel}`}
              subtitle={isGps ? "O que comer por perto" : `Onde comer ${territoryLabels.inTerritory}`}
              icon={UtensilsCrossed}
              iconColorClass="bg-orange-500/10 text-orange-500"
              count={businesses.filter((b) => b.metadata?.category === 'food' || b.metadata?.gastronomy_profile).length}
              isEmpty={businesses.filter((b) => b.metadata?.category === 'food' || b.metadata?.gastronomy_profile).length === 0}
              onSeeAll={() => navigate(moduleUrls.gastronomy)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses
                  .filter((b) => b.metadata?.category === 'food' || b.metadata?.gastronomy_profile)
                  .slice(0, 6)
                  .map((e) => (
                    <NearbyCard key={e.id} entity={e} onNavigate={navigate} />
                  ))}
              </div>
            </NearbySection>

            {/* ── Serviços / Profissionais ─────────────────────────── */}
            <NearbySection
              title={`Serviços ${proximityLabel}`}
              subtitle={isGps ? "Encontre quem resolve por perto" : `Profissionais ${territoryLabels.inTerritory}`}
              icon={Briefcase}
              iconColorClass="bg-indigo-500/10 text-indigo-500"
              count={businesses.filter((b) => b.metadata?.category === 'services').length}
              isEmpty={businesses.filter((b) => b.metadata?.category === 'services').length === 0}
              onSeeAll={() => navigate(moduleUrls.services)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses
                  .filter((b) => b.metadata?.category === 'services')
                  .slice(0, 6)
                  .map((e) => (
                    <NearbyCard key={e.id} entity={e} onNavigate={navigate} />
                  ))}
              </div>
            </NearbySection>

            {/* ── Classificados ────────────────────────────────────── */}
            <NearbyClassifiedsSection
              userLocation={userLocation}
              radiusKm={radiusKm}
              limit={6}
              resolved={resolved}
              onShowInMap={handleShowClassifiedInMap}
            />

            {/* ── Eventos ─────────────────────────────────────────── */}
            <NearbySection
              title={`Eventos ${proximityLabel}`}
              subtitle={isGps ? "O que está acontecendo por perto" : `Eventos ${territoryLabels.inTerritory}`}
              icon={Calendar}
              iconColorClass="bg-green-500/10 text-green-500"
              count={events.length}
              isEmpty={events.length === 0}
              isLoading={isLoading}
              onSeeAll={events.length > 6 ? () => navigate(moduleUrls.events) : undefined}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 6).map((e) => (
                  <NearbyCard key={e.id} entity={e} onNavigate={navigate} />
                ))}
              </div>
            </NearbySection>

            {/* ── Pontos Turísticos ────────────────────────────────── */}
            <NearbySection
              title={`Pontos turísticos ${proximityLabel}`}
              subtitle={isGps ? "Explore os arredores" : `Lugares para conhecer ${territoryLabels.inTerritory}`}
              icon={Landmark}
              iconColorClass="bg-purple-500/10 text-purple-500"
              count={touristPoints.length}
              isEmpty={touristPoints.length === 0}
              isLoading={isLoading}
              onSeeAll={touristPoints.length > 6 ? () => navigate(moduleUrls.touristPoints) : undefined}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {touristPoints.slice(0, 6).map((e) => (
                  <NearbyCard key={e.id} entity={e} onNavigate={navigate} />
                ))}
              </div>
            </NearbySection>

            {/* ── Alertas ─────────────────────────────────────────── */}
            <NearbySection
              title={`Alertas ${proximityLabel}`}
              subtitle={isGps ? "Fique informado sobre o que acontece por perto" : `Alertas ${territoryLabels.inTerritory}`}
              icon={AlertTriangle}
              iconColorClass="bg-red-500/10 text-red-500"
              count={alerts.length}
              isEmpty={alerts.length === 0}
              isLoading={isLoading}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.slice(0, 6).map((e) => (
                  <NearbyCard key={e.id} entity={e} onNavigate={navigate} />
                ))}
              </div>
            </NearbySection>

            {/* ── Todos os Resultados ──────────────────────────────── */}
            {entities.length > 0 && (
              <NearbySection
                title="Todos os resultados"
                subtitle={`${entities.length} locais encontrados ${isGps ? `em ${radiusKm}km` : territoryLabels.inTerritory}`}
                icon={TrendingUp}
                count={entities.length}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedEntities.map((e) => (
                    <motion.div key={`${e.type}-${e.id}`} variants={itemVariants}>
                      <NearbyCard entity={e} onNavigate={navigate} />
                    </motion.div>
                  ))}
                </div>
                {canLoadMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      size="lg"
                      className="rounded-full px-8 gap-2"
                    >
                      Carregar mais <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </NearbySection>
            )}

            {/* ── Empty state global ──────────────────────────────── */}
            {entities.length === 0 && (
              <div className="py-16 text-center">
                <div className="p-4 rounded-full bg-muted/50 inline-block mb-4">
                  <MapPin className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  Nenhum local encontrado
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {isGps
                    ? `Não há locais em um raio de ${radiusKm}km. Tente aumentar o raio.`
                    : `Não encontramos resultados ${territoryLabels.inTerritory}. Tente outro território ou ative o GPS.`
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => { setRadiusKm(20); setActiveCategory('all'); }}
                    variant="outline"
                    className="rounded-full"
                  >
                    Ampliar busca para 20km
                  </Button>
                  {!isGps && (
                    <Button
                      onClick={() => resolveLocation()}
                      variant="default"
                      className="rounded-full gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Ativar GPS
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
