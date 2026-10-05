/**
 * MapSearchControl - Controle de busca unificado para mapas
 *
 * - geocoding: busca endereços via camada territorial centralizada
 * - entity-filter: filtro client-side de entidades no mapa
 */
import { logger } from '@/shared/utils/logger';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';
import { locationGeocodingService } from '@/core/location/services/LocationGeocodingService';
import type { SearchControlConfig } from './types';

interface GeoResult {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
}

async function searchGeocoding(query: string): Promise<GeoResult[]> {
  try {
    const results = await locationGeocodingService.geocode({
      query,
      country: 'BR',
      limit: 5,
    });

    return results.map((result) => ({
      id:
        result.providerPlaceId ??
        `${result.coordinates.latitude},${result.coordinates.longitude}`,
      label:
        result.providerAddress.street ||
        result.systemAddress.neighborhood ||
        result.systemAddress.city ||
        'Local encontrado',
      sublabel: result.displayAddress,
      lat: result.coordinates.latitude,
      lng: result.coordinates.longitude,
    }));
  } catch (error) {
    logger.error('Erro ao buscar geocoding:', error);
    return [];
  }
}

interface MapSearchControlProps extends SearchControlConfig {
  onResultSelect?: (lat: number, lng: number) => void;
  onSearch?: (query: string) => void;
  entities?: Array<{
    title?: string;
    name?: string;
    metadata?: { category?: string };
  }>;
  className?: string;
}

export function MapSearchControl({
  type,
  placeholder = 'Buscar...',
  onSearch,
  onResultSelect,
  entityFilter,
  entities = [],
  debounceMs = 300,
  className,
}: MapSearchControlProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setResults([]);
        setOpen(false);
        onSearch?.('');
        return;
      }

      if (type === 'entity-filter') {
        debounceRef.current = setTimeout(() => onSearch?.(value), debounceMs);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const found = await searchGeocoding(value);
          setResults(found);
          setOpen(found.length > 0);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [type, debounceMs, onSearch],
  );

  const handleSelect = useCallback(
    (result: GeoResult) => {
      setQuery(result.label);
      setOpen(false);
      setResults([]);
      onResultSelect?.(result.lat, result.lng);
    },
    [onResultSelect],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onSearch?.('');
  }, [onSearch]);

  const filteredEntities = useMemo(() => {
    if (type !== 'entity-filter' || !query.trim()) return entities;
    if (entityFilter) return entityFilter(entities, query);
    const normalizedQuery = query.toLowerCase();
    return entities.filter(
      (entity) =>
        entity.title?.toLowerCase().includes(normalizedQuery) ||
        entity.name?.toLowerCase().includes(normalizedQuery) ||
        (entity.metadata?.category as string | undefined)
          ?.toLowerCase()
          .includes(normalizedQuery),
    );
  }, [type, entities, query, entityFilter]);

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-2', className)}>
      <div className="relative w-64 md:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="border-territory-border bg-territory-surface pl-10 pr-10 text-territory-ink shadow-lg placeholder:text-territory-muted"
          aria-label={placeholder}
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-territory-muted" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-territory-muted transition-colors hover:text-territory-ink"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-territory-border bg-territory-surface shadow-xl"
          role="listbox"
          aria-label="Resultados da busca"
        >
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-territory-brand/10"
              role="option"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-territory-ink">
                  {result.label}
                </p>
                {result.sublabel && (
                  <p className="truncate text-xs text-territory-muted">
                    {result.sublabel}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {type === 'entity-filter' && query.trim() && (
        <div className="rounded-lg border border-territory-border bg-territory-surface px-3 py-2 text-sm shadow-lg">
          <span className="font-semibold text-territory-ink">
            {filteredEntities.length}
          </span>
          <span className="ml-1 text-territory-muted">
            {filteredEntities.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      )}
    </div>
  );
}
