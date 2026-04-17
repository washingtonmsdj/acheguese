/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VAGAS PUBLIC PAGE — Página pública de listagem de vagas (Nível AAA)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Rota canônica: /vagas/:uf/:cidade
 * 
 * Features:
 * - Hero compacto profissional
 * - Filtros robustos e escaláveis
 * - Ordenação múltipla (relevância, data, salário)
 * - Cards completos com metadados
 * - Chips de filtros ativos
 * - Paginação (infinite scroll)
 * - Estado vazio profissional
 * - SEO territorial
 * - Destaque para vagas premium
 * 
 * @version 3.0.0 - Página Completa AAA
 */

import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemo, useCallback } from 'react';
import {
  Briefcase, Search, MapPin, Sparkles, ArrowRight,
  Users, Star, Shield, Clock, Zap, TrendingUp,
  Filter, X, Building2, DollarSign, Calendar,
  ChevronDown, Loader2
} from 'lucide-react';
import { CanonicalHero } from '@/shared/components/hero/CanonicalHero';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { SEO } from '@/shared/components/seo/SEO';

import {
  useVagasPublic,
  useVagasUrgentes,
  useVagasDestaque,
  useBairrosComVagas,
} from '../hooks/useVagasPublic';
import { VagaCardEnhanced } from '../components/VagaCardEnhanced';
import {
  VagasLoading,
  VagasEmpty,
  VagasError,
} from '../components/VagasStates';
import {
  SORT_OPTIONS,
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  VAGA_CATEGORIAS,
  type VagaSortOption,
  type VagaContrato,
  type VagaModalidade,
  type VagaNivel,
} from '../types/vagas.types';

import heroImg from '@/assets/empresas-hero.jpg';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const STATS = [
  { icon: Briefcase, value: '150+', label: 'vagas ativas', color: 'text-primary' },
  { icon: Users, value: '80+', label: 'empresas contratando', color: 'text-accent' },
  { icon: Shield, value: '100%', label: 'gratuito', color: 'text-success' },
  { icon: Clock, value: '24h', label: 'novas vagas/dia', color: 'text-warning' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: Search, title: 'Encontre a vaga ideal', description: 'Busque por cargo, área ou localização. Use filtros para refinar os resultados.' },
  { step: '02', icon: Building2, title: 'Candidate-se', description: 'Entre em contato direto com a empresa via WhatsApp, e-mail ou formulário.' },
  { step: '03', icon: Star, title: 'Conquiste a vaga', description: 'Prepare-se, faça a entrevista e comece sua nova jornada profissional.' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Chip de Filtro Ativo
// ═══════════════════════════════════════════════════════════════════════════════

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 px-2 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-destructive transition-colors">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Filtros Expandidos
// ═══════════════════════════════════════════════════════════════════════════════

function ExpandedFilters({
  filters,
  updateFilter,
  bairros,
}: {
  filters: ReturnType<typeof useVagasPublic>['filters'];
  updateFilter: ReturnType<typeof useVagasPublic>['updateFilter'];
  bairros: { id: string; nome: string; count: number }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4"
    >
      {/* Categoria */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {VAGA_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('categoria', filters.categoria === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.categoria === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contrato */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Tipo de Contrato</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CONTRATO_LABELS) as VagaContrato[]).map((tipo) => (
            <button
              key={tipo}
              onClick={() => updateFilter('contrato', filters.contrato === tipo ? null : tipo)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.contrato === tipo
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {CONTRATO_LABELS[tipo]}
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Modalidade</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODALIDADE_LABELS) as VagaModalidade[]).map((mod) => (
            <button
              key={mod}
              onClick={() => updateFilter('modalidade', filters.modalidade === mod ? null : mod)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.modalidade === mod
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {MODALIDADE_LABELS[mod]}
            </button>
          ))}
        </div>
      </div>

      {/* Nível */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Nível de Experiência</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NIVEL_LABELS) as VagaNivel[]).map((nivel) => (
            <button
              key={nivel}
              onClick={() => updateFilter('nivel', filters.nivel === nivel ? null : nivel)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.nivel === nivel
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {NIVEL_LABELS[nivel]}
            </button>
          ))}
        </div>
      </div>

      {/* Bairro */}
      {bairros.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Bairro</label>
          <div className="flex flex-wrap gap-2">
            {bairros.slice(0, 10).map((bairro) => (
              <button
                key={bairro.id}
                onClick={() => updateFilter('bairroId', filters.bairroId === bairro.id ? null : bairro.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filters.bairroId === bairro.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {bairro.nome}
                <span className="ml-1 text-xs opacity-70">({bairro.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Salário */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Salário</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.hasSalary}
              onChange={(e) => updateFilter('hasSalary', e.target.checked || null)}
              className="rounded border-input"
            />
            <span className="text-sm">Apenas com salário informado</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function VagasPublicPage() {
  const navigate = useNavigate();
  const { state, city } = useParams<{ state: string; city: string }>();
  const { user } = useAuth();
  const appUrls = useAppUrls();

  // Território da URL
  const { status, resolved, error } = useResolveTerritoryFromUrl();
  const locationId = resolved?.kind === 'location' ? resolved.location.id : null;
  const cityName = resolved?.kind === 'location' ? resolved.location.name : 'sua cidade';

  // Hooks de dados
  const {
    vagas,
    total,
    hasMore,
    isLoading,
    isError,
    isFetchingNextPage,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    sort,
    setSort,
    fetchNextPage,
  } = useVagasPublic({
    locationId: locationId || '',
    initialSort: 'relevance',
  });

  const { data: vagasUrgentes = [] } = useVagasUrgentes(locationId || '', 3);
  const { data: vagasDestaque = [] } = useVagasDestaque(locationId || '', 4);
  const { data: bairros = [] } = useBairrosComVagas(locationId || '');

  // SEO (cityName já definido acima)
  const pageTitle = `Vagas de Emprego em ${cityName} | AcheGuese`;
  const pageDescription = `Encontre vagas de emprego em ${cityName}. ${total} oportunidades de trabalho disponíveis. Candidate-se agora!`;

  // Handlers de navegação
  const handleVagaClick = useCallback((slug: string) => {
    navigate(`/vagas/${state}/${city}/${slug}`);
  }, [navigate, state, city]);

  // Labels de filtros ativos
  const activeFilterLabels = useMemo(() => {
    const labels: { key: string; label: string }[] = [];
    
    if (filters.categoria) {
      const cat = VAGA_CATEGORIAS.find(c => c.id === filters.categoria);
      if (cat) labels.push({ key: 'categoria', label: cat.label });
    }
    if (filters.contrato) labels.push({ key: 'contrato', label: CONTRATO_LABELS[filters.contrato] });
    if (filters.modalidade) labels.push({ key: 'modalidade', label: MODALIDADE_LABELS[filters.modalidade] });
    if (filters.nivel) labels.push({ key: 'nivel', label: NIVEL_LABELS[filters.nivel] });
    if (filters.bairroId) {
      const bairro = bairros.find(b => b.id === filters.bairroId);
      if (bairro) labels.push({ key: 'bairroId', label: bairro.nome });
    }
    if (filters.hasSalary) labels.push({ key: 'hasSalary', label: 'Com salário' });
    
    return labels;
  }, [filters, bairros]);

  if (status === 'loading' || status === 'idle') {
    return <VagasLoading />;
  }

  if (status === 'error' || status === 'not_found') {
    return (
      <VagasError
        title="Localização não encontrada"
        message={error || 'Não foi possível carregar as vagas para esta localização.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <SEO title={pageTitle} description={pageDescription} />

      {/* ── PROMO BANNER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Contrate talentos locais!</span>{' '}
            Publique vagas gratuitamente.
          </span>
          <button
            onClick={() => navigate(user ? '/vagas/publicar' : '/login')}
            className="text-primary font-semibold hover:underline ml-1 flex items-center gap-0.5"
          >
            Publicar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <CanonicalHero
        moduleName="Vagas"
        moduleIcon={Briefcase}
        territoryName={cityName}
        territoryFallback="Sua Região"
        title="Vagas de Emprego"
        titleHighlight={`em ${cityName}`}
        subtitle={`${total} oportunidades disponíveis. Encontre o emprego ideal na sua região.`}
        backgroundImage={heroImg}
      />

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-all"
            >
              <div className="flex justify-center mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── VAGAS URGENTES ───────────────────────────────────── */}
      {vagasUrgentes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-bold text-foreground">Vagas Urgentes</h2>
              <Badge variant="secondary">{vagasUrgentes.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vagasUrgentes.map((vaga) => (
                <VagaCardEnhanced
                  key={vaga.id}
                  vaga={vaga}
                  variant="compact"
                  onClick={() => handleVagaClick(vaga.slug)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FILTROS E LISTAGEM ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 w-full flex-1">
        {/* Header com busca e ordenação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isLoading ? 'Carregando vagas...' : `${total} vaga${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`}
            </h2>
            <p className="text-sm text-muted-foreground">{cityName} e região</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cargo, empresa..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value || null)}
                className="pl-9 w-full md:w-64"
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter('search', null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Ordenação */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as VagaSortOption)}
                className="h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Chips de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtros:</span>
            {activeFilterLabels.map(({ key, label }) => (
              <ActiveFilterChip
                key={key}
                label={label}
                onRemove={() => updateFilter(key as keyof typeof filters, null)}
              />
            ))}
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:underline ml-2"
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* Filtros expandidos */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <ExpandedFilters filters={filters} updateFilter={updateFilter} bairros={bairros} />
        </div>

        {/* Grid de vagas */}
        {isLoading ? (
          <VagasLoading />
        ) : isError ? (
          <VagasError onRetry={() => window.location.reload()} />
        ) : vagas.length === 0 ? (
          <VagasEmpty hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
        ) : (
          <>
            {/* Vagas em Destaque (quando não há filtros) */}
            {!hasActiveFilters && vagasDestaque.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-muted-foreground">Destaques</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vagasDestaque.map((vaga) => (
                    <VagaCardEnhanced
                      key={vaga.id}
                      vaga={vaga}
                      variant="featured"
                      onClick={() => handleVagaClick(vaga.slug)}
                    />
                  ))}
                </div>
                <Separator className="my-6" />
              </div>
            )}

            {/* Todas as vagas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vagas.map((vaga) => (
                <VagaCardEnhanced
                  key={vaga.id}
                  vaga={vaga}
                  variant="list"
                  onClick={() => handleVagaClick(vaga.slug)}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      Ver mais vagas
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full border-t border-border">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Como Funciona</h2>
          <p className="text-muted-foreground mt-2">Encontrar emprego na sua região é simples</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 text-center"
            >
              <span className="text-3xl font-black text-primary/10 absolute top-4 right-4">{item.step}</span>
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Está contratando? Publique sua vaga!
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Alcance milhares de candidatos qualificados de {cityName}. Publicação gratuita.
          </p>
          <Button
            onClick={() => navigate(user ? '/vagas/publicar' : '/login')}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
          >
            Publicar Vaga Grátis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
