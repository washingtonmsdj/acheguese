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
import { useNearbyEntities } from '@/core/nearby/hooks/useNearbyEntities';
import type { NearbyEntity } from '@/core/nearby/hooks/useNearbyEntities';
import {
  NearbyCard,
  NearbySection,
  NearbyMiniMap,
  NearbyClassifiedsSection,
  NearbyFilters,
  QUICK_CATEGORIES,
} from '@/core/nearby/components';
import type { QuickCategoryKey } from '@/core/nearby/components';
import { Button } from '@/shared/components/ui/button';
import { TerritoryIndicator } from '@/core/location/components/TerritoryIndicator';
import { useLocationContext } from '@/core/location/hooks/useLocationContext';
import { useResolvedUserLocation } from '@/core/location/hooks/useResolvedUserLocation';
import { useTerritoryLabels } from '@/core/location/hooks/useTerritoryLabels';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import {
  MapPin, Navigation, Loader2, Store, AlertTriangle,
  Landmark, Compass, ChevronRight, TrendingUp,
  UtensilsCrossed, Briefcase, Map, Info,
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type NearbyEntityType = 'business' | 'tourist_point';

const ALL_ENTITY_TYPES: NearbyEntityType[] = [
  'business',
  'tourist_point',
];

const CATEGORY_TO_TYPES: Record<QuickCategoryKey, NearbyEntityType[]> = {
  all: [...ALL_ENTITY_TYPES],
  food: ['business'],
  shopping: ['business'],
  services: ['business'],
  health: ['business'],
  leisure: ['tourist_point'],
  fitness: ['business'],
  tourism: ['tourist_point'],
};

function resolveEntityTypesByCategory(category: QuickCategoryKey): NearbyEntityType[] {
  switch (category) {
    case 'all':
      return CATEGORY_TO_TYPES.all;
    case 'food':
      return CATEGORY_TO_TYPES.food;
    case 'shopping':
      return CATEGORY_TO_TYPES.shopping;
    case 'services':
      return CATEGORY_TO_TYPES.services;
    case 'health':
      return CATEGORY_TO_TYPES.health;
    case 'leisure':
      return CATEGORY_TO_TYPES.leisure;
    case 'fitness':
      return CATEGORY_TO_TYPES.fitness;
    case 'tourism':
      return CATEGORY_TO_TYPES.tourism;
    default:
      return [...ALL_ENTITY_TYPES];
  }
}

// ============================================================================
// ANIMATIONS
// ============================================================================

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
    isGoodForProximity,
    sourceMessage,
    resolve: resolveLocation,
    isLoading: locationLoading,
  } = useResolvedUserLocation({ autoResolve: true, tryGps: true });

  // ── State ──────────────────────────────────────────────────────────
  const [radiusKm, setRadiusKm] = useState(5);
  const [activeCategory, setActiveCategory] = useState<QuickCategoryKey>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  // ── Derived entity types from category ─────────────────────────────
  const entityTypes = useMemo(() => resolveEntityTypesByCategory(activeCategory), [activeCategory]);

  // ── Data (SSOT) ────────────────────────────────────────────────────
  const { entities, isLoading: entitiesLoading, isError } = useNearbyEntities({
    radiusKm,
    entityTypes,
    center: userLocation,
    locationId: activeLocation?.id,
    limit: 100,
  });

  const isLoading = entitiesLoading;

  // ── Grouped entities ───────────────────────────────────────────────
  const grouped = useMemo(() => groupByType(entities), [entities]);
  const businesses = grouped.business || [];
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

  // ── Contexto de distância: só dados adequados podem representar proximidade pessoal.
  const hasPreciseProximity = isGoodForProximity;
  const proximityLabel = hasPreciseProximity
    ? 'perto de você'
    : territoryLabels.inTerritory;

  return (
    <>
      <Helmet>
        <title>
          {hasPreciseProximity
            ? `${territoryLabels.nearbyLabel} — ${entities.length} resultados em ${radiusKm}km`
            : `${territoryLabels.nearbyLabel} — ${entities.length} resultados ${territoryLabels.inTerritory}`}
        </title>
        <meta
          name="description"
          content={
            hasPreciseProximity
              ? `Descubra empresas, gastronomia, serviços, classificados e pontos turísticos perto de você em um raio de ${radiusKm}km.`
              : `Descubra empresas, gastronomia, serviços, classificados e pontos turísticos ${territoryLabels.inTerritory}. O recorte usa o centro do território como referência; ative o GPS para ver distâncias pessoais.`
          }
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
          subtitle={`Empresas, gastronomia, serviços, classificados e pontos turísticos, tudo organizado ${
            hasPreciseProximity
              ? 'por proximidade'
              : `${territoryLabels.inTerritory}, sem atribuir distância pessoal`
          }.`}
          stats={[
            hasPreciseProximity
              ? { value: `${radiusKm}km`, label: 'raio' }
              : { value: 'Território', label: 'referência' },
            { value: String(entities.length), label: entities.length === 1 ? 'resultado' : 'resultados' },
            { value: String(businesses.length), label: 'empresas' },
          ]}
        />

        {/* ================================================================
            LOCATION SOURCE INDICATOR
        ================================================================ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/30">
          <div className="text-sm text-muted-foreground">{sourceMessage}</div>
          <div className="flex items-center gap-3">
            {activeLocation && (
              <TerritoryIndicator resolved={resolved} />
            )}
          </div>
        </div>

        {/* ── Location source banner ──────────────────────────────── */}
        {locationStatus !== 'idle' && locationStatus !== 'resolving' && (
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-2 ${
            hasPreciseProximity ? 'bg-green-500/5' : 'bg-amber-500/5'
          }`}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                {hasPreciseProximity ? (
                  <Navigation className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Info className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span className={hasPreciseProximity ? 'text-green-700' : 'text-amber-700'}>
                  {sourceMessage}
                </span>
              </div>
              {!hasPreciseProximity && (
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
              showProximity={hasPreciseProximity}
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
              {locationLoading
                ? 'Obtendo sua localização...'
                : hasPreciseProximity
                  ? 'Buscando locais próximos...'
                  : 'Buscando locais no território...'}
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
              Não foi possível buscar os locais deste recorte. Tente novamente.
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
              subtitle={
                hasPreciseProximity
                  ? `Seus arredores em ${radiusKm}km`
                  : `Mapa ${territoryLabels.inTerritory} — referência territorial`
              }
              icon={Map}
              iconColorClass="bg-accent/10 text-accent-foreground"
            >
              <NearbyMiniMap
                userLocation={userLocation}
                entities={entities}
                radiusKm={radiusKm}
                showProximity={hasPreciseProximity}
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
                  <NearbyCard
                    key={e.id}
                    entity={e}
                    onNavigate={navigate}
                    showProximity={hasPreciseProximity}
                  />
                ))}
              </div>
            </NearbySection>

            {/* ── Gastronomia ─────────────────────────────────────── */}
            <NearbySection
              title={`Gastronomia ${proximityLabel}`}
              subtitle={hasPreciseProximity ? "O que comer por perto" : `Onde comer ${territoryLabels.inTerritory}`}
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
                    <NearbyCard
                    key={e.id}
                    entity={e}
                    onNavigate={navigate}
                    showProximity={hasPreciseProximity}
                  />
                  ))}
              </div>
            </NearbySection>

            {/* ── Serviços / Profissionais ─────────────────────────── */}
            <NearbySection
              title={`Serviços ${proximityLabel}`}
              subtitle={hasPreciseProximity ? "Encontre quem resolve por perto" : `Profissionais ${territoryLabels.inTerritory}`}
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
                    <NearbyCard
                    key={e.id}
                    entity={e}
                    onNavigate={navigate}
                    showProximity={hasPreciseProximity}
                  />
                  ))}
              </div>
            </NearbySection>

            {/* ── Classificados ────────────────────────────────────── */}
            <NearbyClassifiedsSection
              limit={6}
              resolved={resolved}
            />

            {/* ── Pontos Turísticos ────────────────────────────────── */}
            <NearbySection
              title={`Pontos turísticos ${proximityLabel}`}
              subtitle={hasPreciseProximity ? "Explore os arredores" : `Lugares para conhecer ${territoryLabels.inTerritory}`}
              icon={Landmark}
              iconColorClass="bg-purple-500/10 text-purple-500"
              count={touristPoints.length}
              isEmpty={touristPoints.length === 0}
              isLoading={isLoading}
              onSeeAll={touristPoints.length > 6 ? () => navigate(moduleUrls.touristPoints) : undefined}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {touristPoints.slice(0, 6).map((e) => (
                  <NearbyCard
                    key={e.id}
                    entity={e}
                    onNavigate={navigate}
                    showProximity={hasPreciseProximity}
                  />
                ))}
              </div>
            </NearbySection>

            {/* ── Todos os Resultados ──────────────────────────────── */}
            {entities.length > 0 && (
              <NearbySection
                title="Todos os resultados"
                subtitle={`${entities.length} locais encontrados ${hasPreciseProximity ? `em ${radiusKm}km` : territoryLabels.inTerritory}`}
                icon={TrendingUp}
                count={entities.length}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedEntities.map((e) => (
                    <motion.div key={`${e.type}-${e.id}`} variants={itemVariants}>
                      <NearbyCard
                        entity={e}
                        onNavigate={navigate}
                        showProximity={hasPreciseProximity}
                      />
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
                  {hasPreciseProximity
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
                    {hasPreciseProximity
                      ? 'Ampliar raio para 20km'
                      : 'Ampliar recorte territorial para 20km'}
                  </Button>
                  {!hasPreciseProximity && (
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
