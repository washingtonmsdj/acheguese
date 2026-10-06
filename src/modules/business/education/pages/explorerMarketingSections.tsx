import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Dispatch, ElementType, SetStateAction } from 'react';
import {
  ArrowUpRight,
  Check,
  GraduationCap,
  Info,
  Layers,
  Lightbulb,
  MapPin,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { getBusinessCreateRoute } from '@/core/verticals/config';
import { cn } from '@/shared/utils/cn';

import { getNicheByKey, getPublicNiches } from '../niches/registry';
import { EducationUrlService } from '../services/EducationUrlService';
import { getEducationLevelLabel } from '../constants';
import type { EducationPublicProfile } from '@/core/education';
import {
  INFRASTRUCTURE_FILTERS,
  INSTITUTION_TYPE_FILTERS,
  labelFromOptions,
  SCHOOL_NETWORK_FILTERS,
} from './explorerFilterControls';
import type { FilterState } from './explorerFilters';
import { SCHOOL_NETWORK_LABELS } from './explorerPresentation.constants';

type EducationNiche = ReturnType<typeof getPublicNiches>[number];
type SetFilters = Dispatch<SetStateAction<FilterState>>;
type NicheIconMap = Record<string, ElementType>;

const filterBadgeClassName =
  'gap-1 border-territory-border bg-territory-raised text-territory-ink';
const outlineButtonClassName =
  'border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised';

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
    filters.district ||
    filters.onlyAvailable;

  if (!hasFilters) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.niches.map((niche) => (
        <Badge
          key={niche}
          variant="secondary"
          className={filterBadgeClassName}
        >
          {getNicheByKey(niche)?.displayName ?? niche}
          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                niches: previous.niches.filter((value) => value !== niche),
              }))
            }
            className="rounded-full text-territory-muted hover:text-territory-ink"
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {filters.schoolNetworks.map((network) => (
        <Badge
          key={network}
          variant="secondary"
          className={filterBadgeClassName}
        >
          {labelFromOptions(SCHOOL_NETWORK_FILTERS, network)}
          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                schoolNetworks: previous.schoolNetworks.filter(
                  (value) => value !== network,
                ),
              }))
            }
            className="rounded-full text-territory-muted hover:text-territory-ink"
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {filters.institutionTypes.map((type) => (
        <Badge
          key={type}
          variant="secondary"
          className={filterBadgeClassName}
        >
          {labelFromOptions(INSTITUTION_TYPE_FILTERS, type)}
          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                institutionTypes: previous.institutionTypes.filter(
                  (value) => value !== type,
                ),
              }))
            }
            className="rounded-full text-territory-muted hover:text-territory-ink"
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {filters.infrastructure.map((infrastructure) => (
        <Badge
          key={infrastructure}
          variant="secondary"
          className={filterBadgeClassName}
        >
          {labelFromOptions(INFRASTRUCTURE_FILTERS, infrastructure)}
          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                infrastructure: previous.infrastructure.filter(
                  (value) => value !== infrastructure,
                ),
              }))
            }
            className="rounded-full text-territory-muted hover:text-territory-ink"
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {filters.district && (
        <Badge
          variant="secondary"
          className={`${filterBadgeClassName} capitalize`}
        >
          {filters.district.replace(/-/g, ' ')}
          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({ ...previous, district: null }))
            }
            className="rounded-full text-territory-muted hover:text-territory-ink"
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      )}

      {filters.onlyAvailable && (
        <Badge
          variant="secondary"
          className="gap-1 border-territory-success/25 bg-territory-success/10 text-territory-success"
        >
          Com vagas
          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                onlyAvailable: false,
              }))
            }
            className="rounded-full"
            aria-label="Remover filtro"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      )}

      <button
        type="button"
        onClick={clearFilters}
        className="ml-1 text-xs text-territory-muted underline hover:text-territory-ink"
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
  sourceProfiles: EducationPublicProfile[];
  setFilters: SetFilters;
  nicheIcons: NicheIconMap;
  nicheAccent: Record<string, string>;
}) {
  return (
    <div className="mt-12 rounded-3xl border border-territory-border bg-gradient-to-br from-territory-surface to-territory-raised/60 p-6 text-territory-ink md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-territory-ink">
            Categorias educacionais
          </h2>
          <p className="text-sm text-territory-muted">
            Navegue por tipo de instituição e descubra opções especializadas.
          </p>
        </div>
        <Layers className="h-6 w-6 text-territory-brand" aria-hidden="true" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {niches.map((niche) => {
          const Icon = nicheIcons[niche.nicheKey] ?? GraduationCap;
          const gradient =
            nicheAccent[niche.nicheKey] ??
            'from-territory-brand/90 to-territory-brand/70';
          const hasLoadedProfile = sourceProfiles.some(
            (profile) => profile.niche_key === niche.nicheKey,
          );
          return (
            <button
              key={niche.nicheKey}
              type="button"
              onClick={() =>
                setFilters((previous) => ({
                  ...previous,
                  niches: previous.niches.includes(niche.nicheKey)
                    ? previous.niches.filter(
                        (value) => value !== niche.nicheKey,
                      )
                    : [...previous.niches, niche.nicheKey],
                }))
              }
              className="group relative overflow-hidden rounded-2xl border border-territory-border bg-territory-surface p-4 text-left transition-all hover:border-territory-brand/30 hover:bg-territory-raised/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
            >
              <div
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-territory-on-image shadow-sm',
                  gradient,
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="mt-3 text-sm font-semibold text-territory-ink">
                {niche.displayName}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-territory-muted">
                <span>
                  {hasLoadedProfile ? 'Ver opções' : 'Explorar categoria'}
                </span>
                {niche.isBeta && (
                  <Badge
                    variant="outline"
                    className="border-territory-warning/30 bg-territory-warning/10 text-[10px] text-territory-warning"
                  >
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
  featured: EducationPublicProfile[];
  territoryLabel: string;
  clearFilters: () => void;
  nicheIcons: NicheIconMap;
  nicheAccent: Record<string, string>;
  sanitizeSummary: (value?: string | null) => string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="border-t border-territory-border bg-gradient-to-b from-territory-raised/45 via-territory-surface to-territory-surface py-16 text-territory-ink">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge
              className="mb-3 border-territory-sun/40 bg-territory-sun/15 text-territory-ink"
              variant="secondary"
            >
              <Star className="mr-1 h-3 w-3 fill-current" aria-hidden="true" />
              Explore instituições
            </Badge>
            <h2 className="text-3xl font-bold capitalize text-territory-ink">
              Instituições em {territoryLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-territory-muted">
              Uma amostra dos perfis disponíveis neste território com informações institucionais públicas.
            </p>
          </div>
          <Button
            variant="outline"
            className={`hidden rounded-full sm:flex ${outlineButtonClassName}`}
            onClick={clearFilters}
          >
            Ver todas
            <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
          {featured.map((profile, index) => {
            const route = profile.public_route;
            if (!route) return null;

            const FeaturedIcon =
              nicheIcons[profile.niche_key] ?? GraduationCap;
            const featuredGradient =
              nicheAccent[profile.niche_key] ??
              'from-territory-brand/90 to-territory-brand/70';
            const nicheLabel =
              getNicheByKey(profile.niche_key)?.displayName ??
              'Instituição educacional';
            const detailHref = EducationUrlService.buildDetailUrl(route);
            const institutionName =
              profile.business_name ?? nicheLabel;

            return (
              <motion.article
                key={profile.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { delay: index * 0.08, duration: 0.4 }
                }
                className="group relative overflow-hidden rounded-3xl border border-territory-border bg-territory-surface transition-all hover:border-territory-brand/30 hover:shadow-xl motion-safe:hover:-translate-y-1"
              >
                <div
                  className={cn(
                    'relative h-28 bg-gradient-to-br p-5',
                    featuredGradient,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-territory-on-image/20 text-territory-on-image backdrop-blur-sm">
                      <FeaturedIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <Badge className="border-territory-on-image/30 bg-territory-on-image/20 text-territory-on-image backdrop-blur-sm">
                      <Star className="mr-1 h-3 w-3 fill-current" aria-hidden="true" />
                      Na vitrine
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <Badge
                    variant="secondary"
                    className="border-territory-border bg-territory-raised text-[11px] text-territory-ink"
                  >
                    {nicheLabel}
                  </Badge>
                  <h3 className="mt-2 text-lg font-bold text-territory-ink transition-colors group-hover:text-territory-brand">
                    {institutionName}
                  </h3>
                  {sanitizeSummary(profile.summary) && (
                    <p className="mt-1 line-clamp-2 text-sm text-territory-muted">
                      {sanitizeSummary(profile.summary)}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      profile.school_network
                        ? {
                            label: 'Rede',
                            value:
                              SCHOOL_NETWORK_LABELS[profile.school_network] ??
                              'Rede não informada',
                          }
                        : null,
                      profile.enrollment_open
                        ? { label: 'Matrículas', value: 'Abertas' }
                        : null,
                    ]
                      .filter(
                        (stat): stat is { label: string; value: string } =>
                          Boolean(stat),
                      )
                      .map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-territory-raised/70 px-3 py-2 transition-colors group-hover:bg-territory-raised"
                        >
                          <div className="text-base font-bold text-territory-ink">
                            {stat.value}
                          </div>
                          <div className="text-[11px] text-territory-muted">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                  </div>

                  {(profile.education_levels ?? []).length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {(profile.education_levels ?? [])
                        .slice(0, 3)
                        .map((level) => (
                          <div
                            key={level}
                            className="flex items-start gap-2 text-xs capitalize text-territory-muted"
                          >
                            <Check
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-territory-success"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-1">
                              {getEducationLevelLabel(level) ?? 'Etapa educacional'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Button
                      size="sm"
                      asChild
                      className="rounded-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
                    >
                      <Link to={detailHref}>
                        Explorar
                        <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <span className="inline-flex min-w-0 items-center gap-1 text-xs capitalize text-territory-muted">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {route.district.replace(/-/g, ' ')}
                      </span>
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
    <section className="border-t border-territory-border bg-territory-surface py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-territory-info/25 bg-territory-info/10 p-4 text-xs leading-5 text-territory-muted md:flex-row md:items-start md:gap-3">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-territory-info"
            aria-hidden="true"
          />
          <p>
            Os dados iniciais das escolas públicas são organizados a partir de bases
            públicas e consultas institucionais. Podem existir divergências,
            desatualizações ou inconsistências em horários, contatos, etapas ofertadas e
            demais informações. Recomendamos confirmar os dados diretamente com a
            instituição antes de tomar qualquer decisão.
          </p>
        </div>
      </div>
    </section>
  );
}

export function EducationInstitutionCta({
  businessExplorerHref,
}: {
  businessExplorerHref: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-territory-border bg-territory-surface py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-territory-brand/5 via-territory-surface to-territory-brand/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-territory-brand/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-territory-info/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          className="mx-auto max-w-4xl"
        >
          <div className="overflow-hidden rounded-3xl border border-territory-border bg-territory-surface/90 p-8 text-territory-ink shadow-xl backdrop-blur-sm md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <Badge
                  variant="outline"
                  className="mb-4 inline-flex items-center gap-1.5 rounded-full border-territory-brand/30 bg-territory-brand/5 px-3 py-1 text-xs uppercase tracking-wide text-territory-brand"
                >
                  <Lightbulb className="h-3 w-3" aria-hidden="true" />
                  Para instituições
                </Badge>
                <h2 className="text-balance text-3xl font-bold text-territory-ink md:text-4xl">
                  Tem uma instituição de ensino?
                </h2>
                <p className="mt-3 max-w-xl text-balance text-territory-muted md:text-lg">
                  Cadastre-se no Achegue-se e alcance famílias em busca de educação de
                  qualidade. Organize contatos, visitas e sua presença institucional.
                </p>

                <ul className="mt-5 grid gap-2 text-sm text-territory-muted sm:grid-cols-2">
                  {[
                    'Vitrine territorial com SEO',
                    'Captação e pipeline de leads',
                    'Eventos e visitas agendadas',
                    'Analytics de conversão',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-territory-success"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    asChild
                    className="w-full rounded-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90 sm:w-auto"
                  >
                    <Link to={getBusinessCreateRoute('education')}>
                      Cadastrar instituição
                      <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className={`w-full rounded-full sm:w-auto ${outlineButtonClassName}`}
                  >
                    <Link to={businessExplorerHref}>Ver empresas</Link>
                  </Button>
                </div>
              </div>

              <div className="relative hidden h-48 w-48 md:block">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-territory-brand to-territory-brand/65 shadow-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <GraduationCap
                    className="h-20 w-20 text-territory-on-image drop-shadow"
                    aria-hidden="true"
                  />
                </div>
                <div className="absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full border border-territory-border bg-territory-surface px-3 py-1.5 text-xs font-semibold text-territory-ink shadow-md">
                  <Sparkles
                    className="h-3 w-3 text-territory-sun"
                    aria-hidden="true"
                  />
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
