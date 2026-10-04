/* eslint-disable react-refresh/only-export-components */
import {
  Building2,
  Check,
  ChevronDown,
  Filter as FilterIcon,
  Grid3x3,
  GraduationCap,
  Layers,
  MapPin,
  Rows,
  School,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/utils/cn';
import { SORTERS, type FilterState, type ViewMode } from './explorerFilters';

export const SCHOOL_NETWORK_FILTERS = [
  { key: 'municipal', label: 'Municipal' },
  { key: 'state', label: 'Estadual' },
  { key: 'federal', label: 'Federal' },
  { key: 'private', label: 'Privada' },
] as const;

export const INSTITUTION_TYPE_FILTERS = [
  { key: 'cmei', label: 'CMEI' },
  { key: 'creche', label: 'Creche' },
  { key: 'escola', label: 'Escola' },
  { key: 'colegio', label: 'Colégio' },
  { key: 'curso', label: 'Curso' },
] as const;

export const INFRASTRUCTURE_FILTERS = [
  { key: 'library', label: 'Biblioteca' },
  { key: 'laboratory', label: 'Laboratório' },
  { key: 'sports_court', label: 'Quadra' },
  { key: 'pool', label: 'Piscina' },
  { key: 'parking', label: 'Estacionamento' },
  { key: 'accessibility', label: 'Acessibilidade' },
  { key: 'internet', label: 'Internet' },
] as const;

export function labelFromOptions(
  options: readonly { key: string; label: string }[],
  key: string,
) {
  return options.find((option) => option.key === key)?.label ?? key;
}

type NicheOption = {
  nicheKey: string;
  displayName: string;
  isBeta?: boolean;
};
type ArrayFilterKey =
  | 'niches'
  | 'schoolNetworks'
  | 'institutionTypes'
  | 'infrastructure';

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function toggleFilterArray(
  filters: FilterState,
  key: ArrayFilterKey,
  value: string,
): FilterState {
  switch (key) {
    case 'niches':
      return { ...filters, niches: toggleValue(filters.niches, value) };
    case 'schoolNetworks':
      return {
        ...filters,
        schoolNetworks: toggleValue(filters.schoolNetworks, value),
      };
    case 'institutionTypes':
      return {
        ...filters,
        institutionTypes: toggleValue(filters.institutionTypes, value),
      };
    case 'infrastructure':
      return {
        ...filters,
        infrastructure: toggleValue(filters.infrastructure, value),
      };
  }

  return filters;
}

interface SharedFilterProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  niches: NicheOption[];
  districts: string[];
  districtLocked?: boolean;
  nicheIcons: Record<string, React.ElementType>;
}

interface FilterPanelProps extends SharedFilterProps {
  resultsCount: number;
  onClear: () => void;
}

const selectableClassName =
  'border-territory-border text-territory-muted hover:border-territory-brand/30 hover:bg-territory-raised hover:text-territory-ink';
const selectedClassName =
  'border-territory-brand bg-territory-brand/10 text-territory-brand';

export function FilterPanel({
  filters,
  setFilters,
  niches,
  districts,
  districtLocked = false,
  resultsCount,
  onClear,
  nicheIcons,
}: FilterPanelProps) {
  const toggle = (key: ArrayFilterKey, value: string) => {
    setFilters((previous) => toggleFilterArray(previous, key, value));
  };

  return (
    <div className="flex h-full flex-col gap-5 text-territory-ink">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-territory-ink">Categorias</h3>
          <span className="text-xs text-territory-muted">{niches.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {niches.map((niche) => {
            const Icon = nicheIcons[niche.nicheKey] ?? GraduationCap;
            const active = filters.niches.includes(niche.nicheKey);
            return (
              <button
                key={niche.nicheKey}
                type="button"
                onClick={() => toggle('niches', niche.nicheKey)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition',
                  active ? selectedClassName : selectableClassName,
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{niche.displayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-territory-border" />

      <div>
        <h3 className="text-sm font-semibold text-territory-ink">Rede</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SCHOOL_NETWORK_FILTERS.map((network) => {
            const active = filters.schoolNetworks.includes(network.key);
            return (
              <button
                key={network.key}
                type="button"
                onClick={() => toggle('schoolNetworks', network.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active ? selectedClassName : selectableClassName,
                )}
              >
                {network.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-territory-border" />

      <div>
        <h3 className="text-sm font-semibold text-territory-ink">
          Tipo de unidade
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INSTITUTION_TYPE_FILTERS.map((type) => {
            const active = filters.institutionTypes.includes(type.key);
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => toggle('institutionTypes', type.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active ? selectedClassName : selectableClassName,
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-territory-border" />

      <div>
        <h3 className="text-sm font-semibold text-territory-ink">
          Infraestrutura
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INFRASTRUCTURE_FILTERS.map((infrastructure) => {
            const active = filters.infrastructure.includes(infrastructure.key);
            return (
              <button
                key={infrastructure.key}
                type="button"
                onClick={() => toggle('infrastructure', infrastructure.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  active ? selectedClassName : selectableClassName,
                )}
              >
                {infrastructure.label}
              </button>
            );
          })}
        </div>
      </div>

      {!districtLocked && districts.length > 0 && (
        <>
          <Separator className="bg-territory-border" />
          <div>
            <h3 className="text-sm font-semibold text-territory-ink">Bairro</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {districts.map((district) => {
                const active = filters.district === district;
                return (
                  <button
                    key={district}
                    type="button"
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        district:
                          previous.district === district ? null : district,
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs capitalize transition',
                      active ? selectedClassName : selectableClassName,
                    )}
                  >
                    {district.replace(/-/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Separator className="bg-territory-border" />

      <div className="flex items-center justify-between rounded-xl border border-territory-border bg-territory-raised/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-territory-success" aria-hidden="true" />
          <Label htmlFor="only-available" className="cursor-pointer text-sm">
            Apenas com vagas
          </Label>
        </div>
        <Switch
          id="only-available"
          checked={filters.onlyAvailable}
          onCheckedChange={(value) =>
            setFilters((previous) => ({
              ...previous,
              onlyAvailable: value,
            }))
          }
        />
      </div>

      <div className="mt-auto space-y-2">
        <div className="rounded-xl border border-dashed border-territory-border px-4 py-3 text-xs text-territory-muted">
          <strong className="text-territory-ink">{resultsCount}</strong>{' '}
          resultados com filtros atuais
        </div>
        <Button
          variant="ghost"
          className="w-full text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
          onClick={onClear}
        >
          <X className="mr-2 h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

interface FilterBarProps extends SharedFilterProps {
  view: ViewMode;
  setView: (value: ViewMode) => void;
  resultsCount: number;
  onClear: () => void;
}

function CheckOption({
  active,
  label,
  onClick,
  description,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm text-territory-ink transition',
        active ? 'bg-territory-brand/5' : 'hover:bg-territory-raised',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition',
          active
            ? 'border-territory-brand bg-territory-brand text-territory-on-image'
            : 'border-territory-border bg-territory-surface',
        )}
      >
        {active && <Check className="h-3 w-3" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-xs text-territory-muted">{description}</div>
        )}
      </div>
    </button>
  );
}

function FilterPill({
  active,
  onClear,
  icon: Icon,
  label,
  count,
  children,
}: {
  active?: boolean;
  onClear?: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-all',
            active
              ? 'border-territory-brand/60 bg-territory-brand/10 text-territory-brand shadow-sm'
              : 'border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised',
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0',
              active ? 'text-territory-brand' : 'text-territory-muted',
            )}
            aria-hidden="true"
          />
          <span>{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-brand px-1.5 text-[10px] font-bold text-territory-on-image">
              {count}
            </span>
          )}
          {active && onClear ? (
            <span
              role="button"
              tabIndex={-1}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onClear();
              }}
              className="ml-0.5 rounded-full p-0.5 text-territory-brand/75 hover:bg-territory-brand/10 hover:text-territory-brand"
              aria-label="Limpar filtro"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ) : (
            <ChevronDown
              className="ml-0.5 h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100"
              aria-hidden="true"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-territory-border bg-territory-surface p-4 text-territory-ink"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar({
  filters,
  setFilters,
  niches,
  districts,
  districtLocked = false,
  view,
  setView,
  resultsCount,
  onClear,
  nicheIcons,
}: FilterBarProps) {
  const toggle = (key: ArrayFilterKey, value: string) => {
    setFilters((previous) => toggleFilterArray(previous, key, value));
  };

  const availableActive = filters.onlyAvailable;
  const advancedCount = availableActive ? 1 : 0;
  const totalActive =
    filters.niches.length +
    filters.schoolNetworks.length +
    filters.institutionTypes.length +
    filters.infrastructure.length +
    (!districtLocked && filters.district ? 1 : 0) +
    advancedCount +
    (filters.query ? 1 : 0);

  return (
    <section className="sticky top-0 z-30 border-b border-territory-border bg-territory-surface/90 text-territory-ink backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <div className="relative min-w-[220px] max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
              aria-hidden="true"
            />
            <Input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  query: event.target.value,
                }))
              }
              placeholder="Buscar curso, escola, professor..."
              className="h-10 rounded-xl border-territory-border bg-territory-surface pl-9 pr-9 text-territory-ink"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() =>
                  setFilters((previous) => ({ ...previous, query: '' }))
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {!districtLocked && (
            <FilterPill
              icon={MapPin}
              label="Bairro"
              active={Boolean(filters.district)}
              count={filters.district ? 1 : 0}
              onClear={() =>
                setFilters((previous) => ({ ...previous, district: null }))
              }
            >
              <div className="space-y-1">
                <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-territory-muted">
                  Bairros disponíveis
                </div>
                <CheckOption
                  active={!filters.district}
                  label="Todos os bairros"
                  onClick={() =>
                    setFilters((previous) => ({
                      ...previous,
                      district: null,
                    }))
                  }
                />
                <div className="max-h-64 overflow-y-auto">
                  {districts.map((district) => (
                    <CheckOption
                      key={district}
                      active={filters.district === district}
                      label={district
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, (character) => character.toUpperCase())}
                      onClick={() =>
                        setFilters((previous) => ({
                          ...previous,
                          district:
                            previous.district === district ? null : district,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            </FilterPill>
          )}

          <FilterPill
            icon={Building2}
            label="Rede"
            active={filters.schoolNetworks.length > 0}
            count={filters.schoolNetworks.length}
            onClear={() =>
              setFilters((previous) => ({
                ...previous,
                schoolNetworks: [],
              }))
            }
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-territory-muted">
                Rede administrativa
              </div>
              {SCHOOL_NETWORK_FILTERS.map((network) => (
                <CheckOption
                  key={network.key}
                  active={filters.schoolNetworks.includes(network.key)}
                  label={network.label}
                  description={
                    network.key === 'municipal'
                      ? 'Unidades da prefeitura'
                      : network.key === 'state'
                        ? 'Unidades do estado'
                        : network.key === 'federal'
                          ? 'Unidades federais'
                          : 'Instituições privadas'
                  }
                  onClick={() => toggle('schoolNetworks', network.key)}
                />
              ))}
            </div>
          </FilterPill>

          <FilterPill
            icon={School}
            label="Tipo"
            active={filters.institutionTypes.length > 0}
            count={filters.institutionTypes.length}
            onClear={() =>
              setFilters((previous) => ({
                ...previous,
                institutionTypes: [],
              }))
            }
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-territory-muted">
                Tipo de unidade
              </div>
              {INSTITUTION_TYPE_FILTERS.map((type) => (
                <CheckOption
                  key={type.key}
                  active={filters.institutionTypes.includes(type.key)}
                  label={type.label}
                  description={
                    type.key === 'cmei'
                      ? 'Centro municipal de educação infantil'
                      : type.key === 'creche'
                        ? 'Atendimento de primeira infância'
                        : type.key === 'colegio'
                          ? 'Unidade com séries mais amplas'
                          : type.key === 'curso'
                            ? 'Cursos e formações livres'
                            : 'Escolas regulares'
                  }
                  onClick={() => toggle('institutionTypes', type.key)}
                />
              ))}
            </div>
          </FilterPill>

          <FilterPill
            icon={Building2}
            label="Infra"
            active={filters.infrastructure.length > 0}
            count={filters.infrastructure.length}
            onClear={() =>
              setFilters((previous) => ({
                ...previous,
                infrastructure: [],
              }))
            }
          >
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-territory-muted">
                Estrutura da unidade
              </div>
              {INFRASTRUCTURE_FILTERS.map((infrastructure) => (
                <CheckOption
                  key={infrastructure.key}
                  active={filters.infrastructure.includes(infrastructure.key)}
                  label={infrastructure.label}
                  onClick={() => toggle('infrastructure', infrastructure.key)}
                />
              ))}
            </div>
          </FilterPill>

          <button
            type="button"
            onClick={() =>
              setFilters((previous) => ({
                ...previous,
                onlyAvailable: !previous.onlyAvailable,
              }))
            }
            className={cn(
              'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-all',
              availableActive
                ? 'border-territory-success/60 bg-territory-success/10 text-territory-success shadow-sm'
                : 'border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised',
            )}
            aria-pressed={availableActive}
          >
            <Shield
              className={cn(
                'h-4 w-4',
                availableActive
                  ? 'text-territory-success'
                  : 'text-territory-muted',
              )}
              aria-hidden="true"
            />
            <span>Com vagas</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-territory-border bg-territory-surface px-3.5 text-sm font-medium text-territory-ink transition hover:border-territory-brand/40 hover:bg-territory-raised"
                >
                  <FilterIcon
                    className="h-4 w-4 text-territory-muted"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">
                    {SORTERS.find((sorter) => sorter.key === filters.sort)?.label}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-56 border-territory-border bg-territory-surface p-1 text-territory-ink"
              >
                {SORTERS.map((sorter) => (
                  <button
                    key={sorter.key}
                    type="button"
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        sort: sorter.key,
                      }))
                    }
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition',
                      filters.sort === sorter.key
                        ? 'bg-territory-brand/10 font-medium text-territory-brand'
                        : 'hover:bg-territory-raised',
                    )}
                  >
                    {sorter.label}
                    {filters.sort === sorter.key && (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="flex items-center rounded-xl border border-territory-border bg-territory-surface p-1">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition',
                  view === 'grid'
                    ? 'bg-territory-brand text-territory-on-image shadow-sm'
                    : 'text-territory-muted hover:bg-territory-raised',
                )}
                aria-label="Grade"
              >
                <Grid3x3 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'rounded-lg p-1.5 transition',
                  view === 'list'
                    ? 'bg-territory-brand text-territory-on-image shadow-sm'
                    : 'text-territory-muted hover:bg-territory-raised',
                )}
                aria-label="Lista"
              >
                <Rows className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {totalActive > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="hidden h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-territory-muted transition hover:bg-territory-raised hover:text-territory-ink md:inline-flex"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="relative -mx-4 border-t border-territory-border/60 px-4 py-3">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-12 bg-gradient-to-l from-territory-surface to-transparent md:block"
            aria-hidden="true"
          />
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={() =>
                  setFilters((previous) => ({ ...previous, niches: [] }))
                }
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filters.niches.length === 0
                    ? 'border-territory-brand bg-territory-brand text-territory-on-image'
                    : 'border-territory-border bg-territory-surface text-territory-muted hover:border-territory-brand/40 hover:text-territory-ink',
                )}
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                Todas
                <span
                  className={cn(
                    'ml-1 rounded-full px-1.5 py-0.5 text-[10px]',
                    filters.niches.length === 0
                      ? 'bg-territory-on-image/20 text-territory-on-image'
                      : 'bg-territory-raised text-territory-muted',
                  )}
                >
                  {resultsCount}
                </span>
              </button>

              {niches.map((niche) => {
                const NicheIcon = nicheIcons[niche.nicheKey] ?? GraduationCap;
                const active = filters.niches.includes(niche.nicheKey);
                return (
                  <button
                    key={niche.nicheKey}
                    type="button"
                    onClick={() => toggle('niches', niche.nicheKey)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      active
                        ? 'border-territory-brand bg-territory-brand text-territory-on-image shadow-sm'
                        : 'border-territory-border bg-territory-surface text-territory-muted hover:border-territory-brand/40 hover:text-territory-ink',
                    )}
                  >
                    <NicheIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {niche.displayName}
                    {niche.isBeta && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                          active
                            ? 'bg-territory-on-image/20 text-territory-on-image'
                            : 'bg-territory-warning/10 text-territory-warning',
                        )}
                      >
                        Beta
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}
