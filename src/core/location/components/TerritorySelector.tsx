import { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapPin, Building2, ChevronDown, Search, X, Users } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useLocations } from '../hooks/useLocations';
import { useTerritorialGroups } from '../hooks/useTerritorialGroups';
import { extractRouteContext } from '@/core/routing/utils/territoryUrls';

interface TerritorySelectorProps {
  currentTerritoryName: string | null;
  currentPath: string;
}

export function TerritorySelector({ currentTerritoryName, currentPath }: TerritorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ district?: string; groupSlug?: string }>();

  const { data: allLocations = [] } = useLocations();
  const cities = useMemo(
    () => allLocations.filter(loc => loc.type === 'city' && loc.status === 'active'),
    [allLocations]
  );

  const { data: allGroups = [] } = useTerritorialGroups();

  // ✅ SSOT: Detectar contexto completo da rota (módulo + sufixo)
  const routeContext = useMemo(() => {
    return extractRouteContext(location.pathname);
  }, [location.pathname]);

  const territoryType = useMemo(() => {
    if (params.groupSlug) return 'grupo';
    if (params.district) return 'bairro';
    if (currentTerritoryName) return 'cidade';
    return null;
  }, [params.groupSlug, params.district, currentTerritoryName]);

  const TerritoryIcon = useMemo(() => {
    if (territoryType === 'grupo') return Users;
    if (territoryType === 'bairro') return MapPin;
    return Building2;
  }, [territoryType]);

  // Converte geographic_path interno (/br/ba/salvador/pituba) → URL pública (/ba/salvador/pituba)
  const toPublicUrl = (geoPath: string) => {
    const parts = geoPath.split('/').filter(Boolean);
    return '/' + parts.slice(1).join('/'); // remove country
  };

  const getGroupUrl = (group: typeof allGroups[0]) => {
    const anchorCity = allLocations.find(loc => loc.id === group.anchor_city_id);
    if (!anchorCity) return '#';
    const pathParts = anchorCity.geographic_path.split('/').filter(Boolean);
    if (pathParts.length < 3) return '#';
    const [, state, city] = pathParts; // ignora country
    return `/${state}/${city}/${group.slug}`;
  };

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.toLowerCase();
    return cities.filter(city => city.name.toLowerCase().includes(q));
  }, [cities, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allGroups;
    const q = searchQuery.toLowerCase();
    return allGroups.filter(group => 
      group.name.toLowerCase().includes(q) ||
      group.members.some(m => m.name.toLowerCase().includes(q))
    );
  }, [allGroups, searchQuery]);

  const getDistrictsForCity = (cityId: string) => {
    return allLocations.filter(
      loc => loc.type === 'district' && loc.parent_id === cityId && loc.status === 'active'
    );
  };

  const handleSelect = (path: string) => {
    // ✅ SSOT: Preservar contexto completo da rota (módulo + sufixo) ao mudar de local
    let finalPath = path;
    
    if (routeContext.module) {
      // Se estamos em um módulo com sufixo, preservar ambos
      finalPath = `/${routeContext.module}${path}${routeContext.suffix}`;
    }
    
    navigate(finalPath);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start gap-3 px-4 py-4 hover:bg-secondary/50 transition-colors text-left"
      >
        <TerritoryIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {currentTerritoryName ?? "Explorar territórios"}
            </p>
            {territoryType && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded uppercase">
                {territoryType}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentTerritoryName ? "Clique para mudar de local" : "Selecione um local"}
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg z-50 max-h-[70vh] flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar cidade ou bairro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto">
              {filteredGroups.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grupos Territoriais</p>
                  {filteredGroups.map(group => {
                    const groupUrl = getGroupUrl(group);
                    const anchorCity = allLocations.find(loc => loc.id === group.anchor_city_id);
                    return (
                      <button key={group.id} onClick={() => handleSelect(groupUrl)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left", currentPath.includes(group.slug) && "bg-primary/10")}>
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground">{anchorCity?.name ?? 'Salvador'} • {group.members.length} bairros</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {filteredCities.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cidades</p>
                  {filteredCities.map(city => {
                    const districts = getDistrictsForCity(city.id);
                    const showDistricts = !searchQuery && districts.length > 0 && districts.length <= 10;
                    return (
                      <div key={city.id}>
                        <button onClick={() => handleSelect(toPublicUrl(city.geographic_path))} className={cn("w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left", currentPath === toPublicUrl(city.geographic_path) && "bg-primary/10")}>
                          <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{city.name}</p>
                            <p className="text-xs text-muted-foreground">Toda a cidade • {districts.length} bairros</p>
                          </div>
                        </button>
                        {showDistricts && (
                          <div className="bg-muted/30">
                            {districts.slice(0, 10).map(district => (
                              <button key={district.id} onClick={() => handleSelect(toPublicUrl(district.geographic_path))} className={cn("w-full flex items-center gap-3 pl-11 pr-4 py-2 hover:bg-secondary transition-colors text-left", currentPath === toPublicUrl(district.geographic_path) && "bg-primary/10")}>
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <p className="text-sm text-foreground">{district.name}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {filteredCities.length === 0 && filteredGroups.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
