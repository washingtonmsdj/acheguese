/**
 * CountryLandingPage - Landing pública para nível país
 *
 * Lista estados ativos. Quando há apenas 1 estado ativo,
 * mostra a landing normalmente (não redireciona).
 * Base futura de escala nacional.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, ChevronRight, Loader2, Globe } from 'lucide-react';
import { TERRITORY_CONFIG } from '@/config/territory';
import { getCountryData, getActiveStates } from '@/core/landing/services/LandingService';

interface StateItem {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  metadata: Record<string, unknown>;
  city_count: number;
}

export function CountryLandingPage() {
  const navigate = useNavigate();
  const country = TERRITORY_CONFIG.defaultCountry;

  const [countryData, setCountryData] = useState<{ name: string } | null>(null);
  const [states, setStates] = useState<StateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      try {
        const [countryRow, activeStates] = await Promise.all([
          getCountryData(country),
          getActiveStates(country),
        ]);

        setCountryData(countryRow ? { name: countryRow.name } : null);
        setStates(
          activeStates.map((state) => ({
            id: state.id,
            name: state.name,
            full_name: state.full_name || state.name,
            slug: state.slug,
            metadata: state.metadata || {},
            city_count: state.city_count || 0,
          })),
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [country]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <section className="relative px-4 pt-8 pb-6 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-start gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {countryData?.name || 'Brasil'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {states.length === 0
                  ? 'Nenhum estado disponível no momento'
                  : states.length === 1
                    ? '1 estado disponível'
                    : `${states.length} estados disponíveis`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estados */}
      <section className="px-4 py-6 max-w-3xl mx-auto">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Map className="h-4 w-4 text-primary" />
          Estados ativos
        </h2>

        {states.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum estado disponível no momento</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Em breve novas regiões serão adicionadas</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {states.map(st => {
              const statePath = `/${st.slug}`;
              return (
                <button
                  key={st.id}
                  onClick={() => navigate(statePath)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-accent transition-all text-left w-full group"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Map className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground">{st.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {st.city_count > 0
                        ? `${st.city_count} ${st.city_count === 1 ? 'cidade' : 'cidades'}`
                        : 'Em breve'}
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
          Estamos expandindo para todo o Brasil. Em breve novos estados e cidades.
        </p>
      </div>
    </div>
  );
}
