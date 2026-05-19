import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dispatch, ElementType, SetStateAction } from 'react';
import {
  ArrowUpRight,
  Award,
  Check,
  GraduationCap,
  Info,
  Layers,
  Lightbulb,
  MapPin,
  ScanSearch,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

import { getNicheByKey, getPublicNiches } from '../niches/registry';
import { educationDetailPreviewMap } from '../mocks/publicEducationPage.mock';
import type { EducationProfile } from '../types';
import {
  INFRASTRUCTURE_FILTERS,
  INSTITUTION_TYPE_FILTERS,
  labelFromOptions,
  SCHOOL_NETWORK_FILTERS,
} from './explorerFilterControls';
import type { FilterState } from './explorerFilters';
import { CARD_HIDDEN_STAT_LABELS } from './explorerPresentation.constants';

type EducationNiche = ReturnType<typeof getPublicNiches>[number];
type EducationPreview = (typeof educationDetailPreviewMap)[keyof typeof educationDetailPreviewMap];

type SetFilters = Dispatch<SetStateAction<FilterState>>;
type NicheIconMap = Record<string, ElementType>;

export function ActiveEducationFilterChips({
  filters,
  setFilters,
  clearFilters,
}: {
  filters: FilterState;
  setFilters: SetFilters;
  clearFilters: () => void;
}) {
  const hasFilters =
    filters.niches.length > 0 ||
    filters.schoolNetworks.length > 0 ||
    filters.institutionTypes.length > 0 ||
    filters.infrastructure.length > 0 ||
    filters.modalities.length > 0 ||
    filters.audiences.length > 0 ||
    filters.district ||
    filters.onlyAvailable;

  if (!hasFilters) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.niches.map((n) => (
        <Badge key={n} variant="secondary" className="gap-1">
          {getNicheByKey(n)?.displayName ?? n}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                niches: prev.niches.filter((v) => v !== n),
              }))
            }
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.schoolNetworks.map((network) => (
        <Badge key={network} variant="secondary" className="gap-1">
          {labelFromOptions(SCHOOL_NETWORK_FILTERS, network)}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                schoolNetworks: prev.schoolNetworks.filter((v) => v !== network),
              }))
            }
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.institutionTypes.map((type) => (
        <Badge key={type} variant="secondary" className="gap-1">
          {labelFromOptions(INSTITUTION_TYPE_FILTERS, type)}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                institutionTypes: prev.institutionTypes.filter((v) => v !== type),
              }))
            }
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.infrastructure.map((infra) => (
        <Badge key={infra} variant="secondary" className="gap-1">
          {labelFromOptions(INFRASTRUCTURE_FILTERS, infra)}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                infrastructure: prev.infrastructure.filter((v) => v !== infra),
              }))
            }
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.modalities.map((m) => (
        <Badge key={m} variant="secondary" className="gap-1 capitalize">
          {m}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                modalities: prev.modalities.filter((v) => v !== m),
              }))
            }
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.district && (
        <Badge variant="secondary" className="gap-1 capitalize">
          {filters.district.replace(/-/g, ' ')}
          <button
            onClick={() => setFilters((prev) => ({ ...prev, district: null }))}
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.onlyAvailable && (
        <Badge variant="secondary" className="gap-1">
          Com vagas
          <button
            onClick={() => setFilters((prev) => ({ ...prev, onlyAvailable: false }))}
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <button
        onClick={clearFilters}
        className="ml-1 text-xs text-muted-foreground underline hover:text-foreground"
      >
        Limpar tudo
      </button>
    </div>
  );
}

export function EducationNicheShowcase({
  niches,
  sourceProfiles,
  setFilters,
  nicheIcons,
  nicheAccent,
}: {
  niches: EducationNiche[];
  sourceProfiles: EducationProfile[];
  setFilters: SetFilters;
  nicheIcons: NicheIconMap;
  nicheAccent: Record<string, string>;
}) {
  return (
    <div className="mt-12 rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Categorias educacionais</h2>
          <p className="text-sm text-muted-foreground">
            Navegue por tipo de instituicao e descubra opcoes especializadas.
          </p>
        </div>
        <Layers className="h-6 w-6 text-primary" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {niches.map((n) => {
          const Icon = nicheIcons[n.nicheKey] ?? GraduationCap;
          const gradient = nicheAccent[n.nicheKey] ?? 'from-primary to-primary/70';
          const count = sourceProfiles.filter((p) => p.niche_key === n.nicheKey).length;
          return (
            <button
              key={n.nicheKey}
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  niches: prev.niches.includes(n.nicheKey)
                    ? prev.niches.filter((v) => v !== n.nicheKey)
                    : [...prev.niches, n.nicheKey],
                }))
              }
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                  gradient,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-semibold">{n.displayName}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {count} {count === 1 ? 'opcao' : 'opcoes'}
                </span>
                {n.isBeta && (
                  <Badge variant="outline" className="text-[10px]">
                    Beta
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FeaturedEducationSection({
  featured,
  territoryLabel,
  clearFilters,
  nicheIcons,
  nicheAccent,
  sanitizeSummary,
}: {
  featured: EducationPreview[];
  territoryLabel: string;
  clearFilters: () => void;
  nicheIcons: NicheIconMap;
  nicheAccent: Record<string, string>;
  sanitizeSummary: (value?: string | null) => string;
}) {
  return (
    <section className="border-t border-border bg-gradient-to-b from-muted/30 via-background to-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="mb-3" variant="secondary">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Instituicoes em Destaque
            </Badge>
            <h2 className="text-3xl font-bold capitalize text-foreground">
              Instituicoes em destaque em {territoryLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Curadoria com base em dados territoriais e informacoes institucionais publicas.
            </p>
          </div>
          <Button
            variant="outline"
            className="hidden rounded-full sm:flex"
            onClick={clearFilters}
          >
            Ver todas
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
          {featured.map((preview, index) => {
            const FeaturedIcon = nicheIcons[preview.profile.niche_key] ?? GraduationCap;
            const featuredGradient =
              nicheAccent[preview.profile.niche_key] ?? 'from-primary to-primary/70';
            const nicheLabel =
              getNicheByKey(preview.profile.niche_key)?.displayName ??
              preview.profile.niche_key;
            const detailHref = `/educacao/${preview.state}/${preview.city}/${preview.district}/${preview.slug}`;

            return (
              <motion.article
                key={preview.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
              >
                <div className={cn('relative h-28 bg-gradient-to-br p-5', featuredGradient)}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      <FeaturedIcon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Destaque
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <Badge variant="secondary" className="text-[11px]">
                    {nicheLabel}
                  </Badge>
                  <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    {preview.institutionName}
                  </h3>
                  {sanitizeSummary(preview.profile.summary) && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {sanitizeSummary(preview.profile.summary)}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {preview.stats
                      .filter((stat) => !CARD_HIDDEN_STAT_LABELS.has(stat.label.toLowerCase()))
                      .slice(0, 4)
                      .map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-muted/60 px-3 py-2 transition-colors group-hover:bg-muted"
                        >
                          <div className="text-base font-bold text-foreground">{stat.value}</div>
                          <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {preview.highlights.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="line-clamp-1">{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <Link to={detailHref}>
                      <Button
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        Explorar
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                    <span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {preview.district.replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function EducationDataDisclaimer() {
  return (
    <section className="border-t border-border bg-background py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground md:flex-row md:items-start md:gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Os dados iniciais das escolas publicas sao organizados a partir de bases
            publicas e consultas institucionais. Podem existir divergencias,
            desatualizacoes ou inconsistencias em horarios, contatos, etapas ofertadas e
            demais informacoes. Recomendamos confirmar os dados diretamente com a
            instituicao antes de tomar qualquer decisao.
          </p>
        </div>
      </div>
    </section>
  );
}

export function EducationInstitutionCta() {
  return (
    <section className="relative overflow-hidden border-t border-border py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <Badge
                  variant="outline"
                  className="mb-4 inline-flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wide text-primary"
                >
                  <Lightbulb className="h-3 w-3" />
                  Para instituicoes
                </Badge>
                <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
                  Tem uma instituicao de ensino?
                </h2>
                <p className="mt-3 max-w-xl text-balance text-muted-foreground md:text-lg">
                  Cadastre-se no Achegue-se e alcance familias em busca de educacao de
                  qualidade. Capture leads, gerencie visitas e aumente suas matriculas.
                </p>

                <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {[
                    'Vitrine territorial com SEO',
                    'Captacao e pipeline de leads',
                    'Eventos e visitas agendadas',
                    'Analytics de conversao',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link to="/empresas/cadastrar">
                    <Button size="lg" className="w-full rounded-full sm:w-auto">
                      Cadastrar instituicao
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/empresas">
                    <Button size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
                      Ver empresas
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative hidden h-48 w-48 md:block">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <GraduationCap className="h-20 w-20 text-white drop-shadow" />
                </div>
                <div className="absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-md">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Premium
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function EducationCompareBar({
  comparing,
  sourceProfiles,
  toggleCompare,
  clearCompare,
}: {
  comparing: string[];
  sourceProfiles: EducationProfile[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
}) {
  return (
    <AnimatePresence>
      {comparing.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md md:inset-x-auto md:right-6 md:bottom-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <ScanSearch className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Comparando {comparing.length}/4</span>
            </div>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {comparing.map((id) => {
                const profile = sourceProfiles.find((p) => p.id === id);
                return profile ? (
                  <Badge key={id} variant="outline" className="gap-1">
                    {profile.institution_type}
                    <button onClick={() => toggleCompare(id)} aria-label="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={clearCompare} className="rounded-full">
                Limpar
              </Button>
              <Button size="sm" disabled={comparing.length < 2} className="rounded-full">
                <Award className="mr-1 h-4 w-4" />
                Comparar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
