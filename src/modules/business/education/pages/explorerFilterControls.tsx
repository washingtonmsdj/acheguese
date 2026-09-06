/* eslint-disable react-refresh/only-export-components */
import { Building2, Check, ChevronDown, Filter as FilterIcon, Grid3x3, GraduationCap, Layers, MapPin, Rows, School, Search, Shield, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
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

export function labelFromOptions(options: readonly { key: string; label: string }[], key: string) {
  return options.find((option) => option.key === key)?.label ?? key;
}

type NicheOption = { nicheKey: string; displayName: string; isBeta?: boolean };
type ArrayFilterKey = 'niches' | 'schoolNetworks' | 'institutionTypes' | 'infrastructure';

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function toggleFilterArray(filters: FilterState, key: ArrayFilterKey, value: string): FilterState {
  switch (key) {
    case 'niches':
      return { ...filters, niches: toggleValue(filters.niches, value) };
    case 'schoolNetworks':
      return { ...filters, schoolNetworks: toggleValue(filters.schoolNetworks, value) };
    case 'institutionTypes':
      return { ...filters, institutionTypes: toggleValue(filters.institutionTypes, value) };
    case 'infrastructure':
      return { ...filters, infrastructure: toggleValue(filters.infrastructure, value) };
  }

  return filters;
}

interface SharedFilterProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  niches: NicheOption[];
  districts: string[];
  nicheIcons: Record<string, React.ElementType>;
}

interface FilterPanelProps extends SharedFilterProps {
  resultsCount: number;
  onClear: () => void;
}

export function FilterPanel({
  filters,
  setFilters,
  niches,
  districts,
  resultsCount,
  onClear,
  nicheIcons,
}: FilterPanelProps) {
  const toggle = (
    key: ArrayFilterKey,
    value: string,
  ) => {
    setFilters((prev) => toggleFilterArray(prev, key, value));
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Categorias</h3>
          <span className="text-xs text-muted-foreground">{niches.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {niches.map((n) => {
            const Icon = nicheIcons[n.nicheKey] ?? GraduationCap;
            const active = filters.niches.includes(n.nicheKey);
            return (
              <button key={n.nicheKey} type="button" onClick={() => toggle('niches', n.nicheKey)} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition', active ? 'border-primary bg-primary/5 text-primary' : 'border-border/70 hover:border-primary/30')}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{n.displayName}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-foreground">Rede</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SCHOOL_NETWORK_FILTERS.map((network) => {
            const active = filters.schoolNetworks.includes(network.key);
            return <button key={network.key} type="button" onClick={() => toggle('schoolNetworks', network.key)} className={cn('rounded-full border px-3 py-1 text-xs transition', active ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 hover:border-primary/30')}>{network.label}</button>;
          })}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-foreground">Tipo de unidade</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INSTITUTION_TYPE_FILTERS.map((type) => {
            const active = filters.institutionTypes.includes(type.key);
            return <button key={type.key} type="button" onClick={() => toggle('institutionTypes', type.key)} className={cn('rounded-full border px-3 py-1 text-xs transition', active ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 hover:border-primary/30')}>{type.label}</button>;
          })}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-foreground">Infraestrutura</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INFRASTRUCTURE_FILTERS.map((infra) => {
            const active = filters.infrastructure.includes(infra.key);
            return <button key={infra.key} type="button" onClick={() => toggle('infrastructure', infra.key)} className={cn('rounded-full border px-3 py-1 text-xs transition', active ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 hover:border-primary/30')}>{infra.label}</button>;
          })}
        </div>
      </div>
      {districts.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Bairro</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {districts.map((d) => {
                const active = filters.district === d;
                return (
                  <button key={d} type="button" onClick={() => setFilters((prev) => ({ ...prev, district: prev.district === d ? null : d }))} className={cn('rounded-full border px-3 py-1 text-xs capitalize transition', active ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 hover:border-primary/30')}>
                    {d.replace(/-/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <Separator />
      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <Label htmlFor="only-available" className="cursor-pointer text-sm">Apenas com vagas</Label>
        </div>
        <Switch id="only-available" checked={filters.onlyAvailable} onCheckedChange={(v) => setFilters((prev) => ({ ...prev, onlyAvailable: v }))} />
      </div>
      <div className="mt-auto space-y-2">
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-3 text-xs text-muted-foreground">
          <strong className="text-foreground">{resultsCount}</strong> resultados com filtros atuais
        </div>
        <Button variant="ghost" className="w-full" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

interface FilterBarProps extends SharedFilterProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  resultsCount: number;
  onClear: () => void;
}

function CheckOption({ active, label, onClick, description }: { active: boolean; label: string; onClick: () => void; description?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition', active ? 'bg-primary/5 text-foreground' : 'hover:bg-muted')}>
      <div className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')}>{active && <Check className="h-3 w-3" />}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </button>
  );
}

function FilterPill({ active, onClear, icon: Icon, label, count, children }: { active?: boolean; onClear?: () => void; icon: React.ElementType; label: string; count?: number; children?: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn('group inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-all', active ? 'border-primary/60 bg-primary/10 text-primary shadow-sm shadow-primary/10' : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40')}>
          <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
          <span>{label}</span>
          {typeof count === 'number' && count > 0 && <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{count}</span>}
          {active && onClear ? <span role="button" tabIndex={-1} onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClear(); }} className="ml-0.5 rounded-full p-0.5 text-primary/70 hover:bg-primary/10 hover:text-primary" aria-label="Limpar filtro"><X className="h-3.5 w-3.5" /></span> : <ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4">{children}</PopoverContent>
    </Popover>
  );
}

export function FilterBar({ filters, setFilters, niches, districts, view, setView, resultsCount, onClear, nicheIcons }: FilterBarProps) {
  const toggle = (key: ArrayFilterKey, value: string) => {
    setFilters((prev) => toggleFilterArray(prev, key, value));
  };

  const availableActive = filters.onlyAvailable;
  const advancedCount = availableActive ? 1 : 0;
  const totalActive = filters.niches.length + filters.schoolNetworks.length + filters.institutionTypes.length + filters.infrastructure.length + (filters.district ? 1 : 0) + advancedCount + (filters.query ? 1 : 0);

  return (
    <section className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={filters.query} onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))} placeholder="Buscar curso, escola, professor..." className="h-10 rounded-xl pl-9 pr-9" />
            {filters.query && <button type="button" onClick={() => setFilters((prev) => ({ ...prev, query: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Limpar busca"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <FilterPill icon={MapPin} label="Bairro" active={Boolean(filters.district)} count={filters.district ? 1 : 0} onClear={() => setFilters((prev) => ({ ...prev, district: null }))}>
            <div className="space-y-1">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bairros disponíveis</div>
              <CheckOption active={!filters.district} label="Todos os bairros" onClick={() => setFilters((prev) => ({ ...prev, district: null }))} />
              <div className="max-h-64 overflow-y-auto">{districts.map((d) => <CheckOption key={d} active={filters.district === d} label={d.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} onClick={() => setFilters((prev) => ({ ...prev, district: prev.district === d ? null : d }))} />)}</div>
            </div>
          </FilterPill>
          <FilterPill icon={Building2} label="Rede" active={filters.schoolNetworks.length > 0} count={filters.schoolNetworks.length} onClear={() => setFilters((prev) => ({ ...prev, schoolNetworks: [] }))}>
            <div className="space-y-1"><div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rede administrativa</div>{SCHOOL_NETWORK_FILTERS.map((network) => <CheckOption key={network.key} active={filters.schoolNetworks.includes(network.key)} label={network.label} description={network.key === 'municipal' ? 'Unidades da prefeitura' : network.key === 'state' ? 'Unidades do estado' : network.key === 'federal' ? 'Unidades federais' : 'Instituições privadas'} onClick={() => toggle('schoolNetworks', network.key)} />)}</div>
          </FilterPill>
          <FilterPill icon={School} label="Tipo" active={filters.institutionTypes.length > 0} count={filters.institutionTypes.length} onClear={() => setFilters((prev) => ({ ...prev, institutionTypes: [] }))}>
            <div className="space-y-1"><div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de unidade</div>{INSTITUTION_TYPE_FILTERS.map((type) => <CheckOption key={type.key} active={filters.institutionTypes.includes(type.key)} label={type.label} description={type.key === 'cmei' ? 'Centro municipal de educação infantil' : type.key === 'creche' ? 'Atendimento de primeira infância' : type.key === 'colegio' ? 'Unidade com séries mais amplas' : type.key === 'curso' ? 'Cursos e formações livres' : 'Escolas regulares'} onClick={() => toggle('institutionTypes', type.key)} />)}</div>
          </FilterPill>
          <FilterPill icon={Building2} label="Infra" active={filters.infrastructure.length > 0} count={filters.infrastructure.length} onClear={() => setFilters((prev) => ({ ...prev, infrastructure: [] }))}>
            <div className="space-y-1"><div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estrutura da unidade</div>{INFRASTRUCTURE_FILTERS.map((infra) => <CheckOption key={infra.key} active={filters.infrastructure.includes(infra.key)} label={infra.label} onClick={() => toggle('infrastructure', infra.key)} />)}</div>
          </FilterPill>
          <button type="button" onClick={() => setFilters((prev) => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))} className={cn('inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-all', availableActive ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 shadow-sm' : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40')} aria-pressed={availableActive}><Shield className={cn('h-4 w-4', availableActive ? 'text-emerald-500' : 'text-muted-foreground')} /><span>Com vagas</span></button>
          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted/40"><FilterIcon className="h-4 w-4 text-muted-foreground" /><span className="hidden sm:inline">{SORTERS.find((s) => s.key === filters.sort)?.label}</span><ChevronDown className="h-3.5 w-3.5 opacity-60" /></button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">{SORTERS.map((s) => <button key={s.key} type="button" onClick={() => setFilters((prev) => ({ ...prev, sort: s.key }))} className={cn('flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition', filters.sort === s.key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted')}>{s.label}{filters.sort === s.key && <Check className="h-4 w-4" />}</button>)}</PopoverContent>
            </Popover>
            <div className="flex items-center rounded-xl border border-border bg-card p-1">
              <button type="button" onClick={() => setView('grid')} className={cn('rounded-lg p-1.5 transition', view === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted')} aria-label="Grade"><Grid3x3 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setView('list')} className={cn('rounded-lg p-1.5 transition', view === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted')} aria-label="Lista"><Rows className="h-4 w-4" /></button>
            </div>
            {totalActive > 0 && <button type="button" onClick={onClear} className="hidden h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline-flex"><X className="h-3.5 w-3.5" />Limpar</button>}
          </div>
        </div>
        <div className="relative -mx-4 border-t border-border/60 px-4 py-3">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-12 bg-gradient-to-l from-background to-transparent md:block" />
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1.5 pb-1">
              <button type="button" onClick={() => setFilters((prev) => ({ ...prev, niches: [] }))} className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition', filters.niches.length === 0 ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground')}><Layers className="h-3.5 w-3.5" />Todas<span className={cn('ml-1 rounded-full px-1.5 py-0.5 text-[10px]', filters.niches.length === 0 ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground')}>{resultsCount}</span></button>
              {niches.map((n) => {
                const NicheIco = nicheIcons[n.nicheKey] ?? GraduationCap;
                const active = filters.niches.includes(n.nicheKey);
                return <button key={n.nicheKey} type="button" onClick={() => toggle('niches', n.nicheKey)} className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition', active ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground')}><NicheIco className="h-3.5 w-3.5" />{n.displayName}{n.isBeta && <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-100 text-amber-700')}>Beta</span>}</button>;
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}
