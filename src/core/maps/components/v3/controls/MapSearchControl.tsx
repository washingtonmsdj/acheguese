/**
 * MapSearchControl - Controle de busca unificado para mapas
 *
 * - geocoding: busca endereços via camada territorial centralizada
 * - entity-filter: filtro client-side de entidades no mapa
 */

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
      id: result.providerPlaceId ?? `${result.coordinates.latitude},${result.coordinates.longitude}`,
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
    console.error('Erro ao buscar geocoding:', error);
    return [];
  }
}

interface MapSearchControlProps extends SearchControlConfig {
  onResultSelect?: (lat: number, lng: number) => void;
  onSearch?: (query: string) => void;
  entities?: any[];
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
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    const q = query.toLowerCase();
    return entities.filter(
      (e: any) =>
        e.title?.toLowerCase().includes(q) ||
        e.name?.toLowerCase().includes(q) ||
        (e.metadata?.category as string | undefined)?.toLowerCase().includes(q),
    );
  }, [type, entities, query, entityFilter]);

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-2', className)}>
      <div className="relative w-64 md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="pl-10 pr-10 bg-white border-gray-200 shadow-lg text-gray-900 placeholder:text-gray-400"
          aria-label={placeholder}
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-10"
          role="listbox"
          aria-label="Resultados da busca"
        >
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
              role="option"
            >
              <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                {r.sublabel && <p className="text-xs text-gray-500 truncate">{r.sublabel}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {type === 'entity-filter' && query.trim() && (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-lg">
          <span className="font-semibold text-gray-900">{filteredEntities.length}</span>
          <span className="text-gray-600 ml-1">
            {filteredEntities.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      )}
    </div>
  );
}
