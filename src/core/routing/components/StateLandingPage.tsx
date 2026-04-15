/**
 * StateLandingPage — Landing pública para nível estadual
 *
 * Lista cidades ativas dentro do estado.
 * Serve como fallback elegante e base futura de escala.
 * Quando há apenas 1 cidade ativa, ainda mostra a landing (não redireciona).
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Building2, ChevronRight, Loader2, Map,
  Users, Store, ArrowRight,
} from 'lucide-react';
import { TERRITORY_CONFIG } from '@/config/territory';
import { getStateData, getActiveCitiesByState } from '@/modules/landing/services/LandingService';

interface CityItem {
  id: string;
  name: string;
  slug: string;
  geographic_path: string;
  metadata: Record<string, unknown>;
  district_count: number;
}

export function StateLandingPage() {
  const { state } = useParams<{ state: string }>();
  const navigate = useNavigate();
  const country = TERRITORY_CONFIG.defaultCountry;

  const [stateData, setStateData] = useState<{ name: string; full_name: string } | null>(null);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!state) return;

    async function load() {
      setIsLoading(true);

      try {
        const stateRow = await getStateData(country, state);

        if (!stateRow) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        if (stateRow.metadata?.is_navigable === false || stateRow.status !== 'active') {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setNotFound(false);
        setStateData({ name: stateRow.name, full_name: stateRow.full_name });

        const activeCities = await getActiveCitiesByState(stateRow.id);
        const mappedCities: CityItem[] = activeCities.map((cityItem) => ({
          id: cityItem.id,
          name: cityItem.name,
          slug: cityItem.slug,
          geographic_path: cityItem.geographic_path,
          metadata: cityItem.metadata || {},
          district_count: cityItem.district_count || 0,
        }));

        setCities(mappedCities);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [state, country]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Map className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Estado não encontrado</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Este estado não está disponível no momento.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const stateCode = state?.toUpperCase() || '';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <section className="relative px-4 pt-8 pb-6 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-start gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {stateData?.full_name || stateData?.name || stateCode}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {cities.length === 0
                  ? 'Nenhuma cidade disponível no momento'
                  : cities.length === 1
                    ? '1 cidade disponível'
                    : `${cities.length} cidades disponíveis`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cidades */}
      <section className="px-4 py-6 max-w-3xl mx-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Cidades ativas
        </h2>

        {cities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma cidade disponível neste estado</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Em breve novas cidades serão adicionadas</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {cities.map(city => {
              const cityPath = `/${state}/${city.slug}`;
              return (
                <button
                  key={city.id}
                  onClick={() => navigate(cityPath)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-accent transition-all text-left w-full group"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground">{city.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {city.district_count > 0
                        ? `${city.district_count} bairros`
                        : 'Cidade inteira'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Nota de expansão */}
      <div className="px-4 max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground text-center">
          Em breve em mais cidades de {stateData?.name || stateCode}
        </p>
      </div>
    </div>
  );
}
