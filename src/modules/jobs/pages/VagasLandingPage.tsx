// @ts-nocheck
/**
 * 🏆 VAGAS LANDING PAGE - SSOT
 * 
 * ✅ Usa hooks especializados para lógica
 * ✅ Componentes extraídos e reutilizáveis
 * ✅ Código limpo e profissional
 * ✅ Preparado para integração com JobService (MOCK_JOBS temporário)
 * ✅ Usa SSOT de location (territorial routing)
 * ✅ Recebe resolved + activeMemberIds (padrão modular)
 */

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, Plus, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAppUrls } from "@/core/routing/hooks";
import { useTerritoryLabels } from "@/core/location";
import { useJobFilters } from "../hooks/useJobFilters";
import { useNeighborhoodsWithJobs } from "../hooks/useNeighborhoodsWithJobs";
import { geoPathToPublicUrl } from "@/core/routing/utils/territoryUrls";
import { HeroSection } from "../components/HeroSection";
import { FiltersPanel } from "../components/FiltersPanel";
import { JobCard } from "../components/JobCard";
import { EmptyState } from "../components/EmptyState";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useMemo } from "react";

// ── Animações ────────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const stagger = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// ── Constantes ────────────────────────────────────────────────────────
const NEIGHBORHOODS_DISPLAY_LIMIT = 20;

// ── Props ─────────────────────────────────────────────────────────────

interface VagasLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ═════════════════════════════════════════════════════════════════════
export default function VagasLandingPage({ resolved, activeMemberIds }: VagasLandingPageProps) {
  const navigate = useNavigate();
  
  // ✅ SSOT: Usar appUrls com resolved para URLs territoriais
  const appUrls = useAppUrls(resolved);
  const territoryLabels = useTerritoryLabels(resolved);
  
  // ✅ SSOT: Nome da cidade do território resolvido
  const cityName = useMemo(() => {
    return territoryLabels.name || "sua cidade";
  }, [territoryLabels]);

  // Verificar se estamos em uma cidade (não em um bairro específico)
  const isCity = resolved?.kind === 'location' && resolved.location.type === 'city';
  const cityId = isCity && resolved?.kind === 'location' ? resolved.location.id : null;

  // ✅ SSOT: Buscar apenas bairros com vagas ativas (escalável)
  const { data: neighborhoodsWithJobs = [], isLoading: isLoadingNeighborhoods } = useNeighborhoodsWithJobs(cityId);

  // ✅ SSOT: useJobFilters com filtro territorial
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedContract,
    setSelectedContract,
    selectedModality,
    setSelectedModality,
    showFilters,
    setShowFilters,
    expandedJob,
    setExpandedJob,
    filteredJobs,
    hasActiveFilters,
    hasTerritory: hasTerritoryFromHook,
    isLoading,
    clearFilters,
  } = useJobFilters({
    routeResolved: resolved,
    activeMemberIds,
  });

  // Indicador de território ativo (usa o do hook que considera resolved)
  const hasTerritory = hasTerritoryFromHook;
  const territoryName = useMemo(() => {
    if (!resolved) return null;
    if (resolved.kind === 'location') return resolved.location.name;
    if (resolved.kind === 'group') return resolved.group.name;
    return null;
  }, [resolved]);

  return (
    <>
      {/* Hero */}
      <HeroSection
        cityName={cityName}
        search={search}
        onSearchChange={setSearch}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
        onPublishClick={() => navigate(appUrls.jobs + "/publicar")}
      />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <FiltersPanel
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedContract={selectedContract}
            onContractChange={setSelectedContract}
            selectedModality={selectedModality}
            onModalityChange={setSelectedModality}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        )}
      </AnimatePresence>

      {/* FILTRO DE BAIRROS */}
      {isCity && neighborhoodsWithJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 w-full">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground font-heading mb-2">Filtrar por Bairro</h2>
            <p className="text-sm text-muted-foreground">
              {neighborhoodsWithJobs.length} {neighborhoodsWithJobs.length === 1 ? 'bairro com vagas' : 'bairros com vagas'}
            </p>
          </div>
          <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-8">
            {isLoadingNeighborhoods ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 w-32 bg-card/50 rounded-xl animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {neighborhoodsWithJobs.slice(0, NEIGHBORHOODS_DISPLAY_LIMIT).map((neighborhood) => (
                  <button
                    key={neighborhood.location_id}
                    onClick={() => {
                      // ✅ SSOT: Navega para a URL do bairro (filtro no backend)
                      if (resolved?.kind === 'location') {
                        // geographic_path da cidade atual: /br/ba/salvador ou /br/ba/salvador/brotas
                        // Pegar apenas state e city (remover distrito se houver)
                        const pathParts = resolved.location.geographic_path.split('/').filter(Boolean);
                        const cityPath = '/' + pathParts.slice(0, 3).join('/'); // /br/ba/salvador
                        const publicCityPath = geoPathToPublicUrl(cityPath); // /ba/salvador
                        
                        navigate(`/vagas${publicCityPath}/${neighborhood.location_slug}`);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all flex-shrink-0 whitespace-nowrap bg-card border-border hover:border-primary/30 hover:bg-card/80 text-foreground hover:text-primary group"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">{neighborhood.location_name}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {neighborhood.count}
                    </span>
                  </button>
                ))}
                {neighborhoodsWithJobs.length > NEIGHBORHOODS_DISPLAY_LIMIT && (
                  <div className="flex items-center px-4 text-xs text-muted-foreground whitespace-nowrap">
                    +{neighborhoodsWithJobs.length - NEIGHBORHOODS_DISPLAY_LIMIT} bairros
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Job Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {hasActiveFilters ? `${filteredJobs.length} vaga(s) encontrada(s)` : "Vagas recentes"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cityName} e região metropolitana
            </p>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState onClearFilters={clearFilters} />
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                {...stagger}
                transition={{ delay: Math.min(i, 8) * 0.05 }}
                layout
              >
                <JobCard
                  job={job}
                  isExpanded={expandedJob === job.id}
                  onToggleExpand={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-br from-primary/8 via-card to-accent/8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <motion.div {...fadeUp}>
            <Briefcase className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-3">
              Sua empresa está contratando?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
              Publique vagas gratuitamente e alcance milhares de profissionais em {cityName}.
              Sem taxas, sem intermediários.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate(appUrls.jobs + "/publicar")}
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-base gap-2"
              >
                <Plus className="h-5 w-5" />
                Publicar vaga grátis
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(appUrls.home)}
                className="h-12 px-8 rounded-xl border-border gap-2"
              >
                Explorar {cityName}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Vagas {cityName}</span>
              <span>·</span>
              <span>Parte do portal da cidade</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate(appUrls.home)} className="hover:text-primary transition-colors">
                Portal da Cidade
              </button>
              <button onClick={() => navigate("/termos")} className="hover:text-primary transition-colors">
                Termos
              </button>
              <button onClick={() => navigate("/privacidade")} className="hover:text-primary transition-colors">
                Privacidade
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
