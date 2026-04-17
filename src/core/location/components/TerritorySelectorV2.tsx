/**
 * TerritorySelectorV2
 * 
 * Seletor com dois modos para usuários cadastrados:
 * - "Meu Bairro": conteúdo filtrado apenas pelo bairro do morador
 * - "Minha Cidade": conteúdo da cidade inteira com filtros por bairro
 * 
 * Visitantes veem apenas modo cidade com filtros públicos.
 * O bairro ativo NUNCA muda para outro bairro que não o do morador.
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { MapPin, ChevronDown, Search, X, Home, Building2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useSelectorTerritories } from '../hooks/useSelectorTerritories';
import { useUserTerritory } from '../hooks/useUserTerritory';
import { useActiveTerritory } from '../hooks/useActiveTerritory';
import { useFormattedTerritoryLabel } from '../hooks/useFormattedTerritoryLabel';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { extractRouteContext, geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { normalizeTerritoryPath } from '@/core/routing/utils/pathNormalization'; // SSOT
import { getContextMessageFromPath } from '@/config/modules';
import { TerritoryButton, type TerritoryButtonData } from './TerritoryButton';
import { LocationType } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Input } from '@/shared/components/ui/input';

interface TerritorySelectorV2Props {
  compact?: boolean;
}

export function TerritorySelectorV2({
  compact = false,
}: TerritorySelectorV2Props) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { homeDistrict, homeCity, hasHome } = useUserTerritory();
  const { activeLocation, territoryMode, setTerritoryMode } = useActiveTerritory();
  const { data: selectorTerritories = [] } = useSelectorTerritories();
  const formattedLabel = useFormattedTerritoryLabel();
  const urls = useFriendlyModuleUrls();

  // SSOT: Path canônico do território ativo
  const currentPath = useMemo(() => {
    if (urls.base) return urls.base;
    if (activeLocation) return geoPathToPublicUrl(activeLocation.geographic_path);
    return null;
  }, [urls.base, activeLocation]);

  const contextMessage = getContextMessageFromPath(routerLocation.pathname);

  // Detectar contexto da rota (APENAS módulo)
  const routeContext = useMemo(() => {
    return extractRouteContext(routerLocation.pathname);
  }, [routerLocation.pathname]);

  // Label do modo atual para o trigger
  const modeLabel = useMemo(() => {
    if (!hasHome) return 'Cidade';
    if (territoryMode === 'bairro' && homeDistrict) return 'Meu Bairro';
    return 'Minha Cidade';
  }, [hasHome, territoryMode, homeDistrict]);

  const isAtHome = useMemo(() => {
    if (!homeDistrict || !activeLocation) return false;
    return activeLocation.id === homeDistrict.id;
  }, [homeDistrict, activeLocation]);

  const isAtHomeCity = useMemo(() => {
    if (!homeCity || !activeLocation) return false;
    return activeLocation.id === homeCity.id;
  }, [homeCity, activeLocation]);

  // Handler: selecionar modo bairro
  const handleSelectBairro = useCallback(() => {
    if (!homeDistrict) return;
    const normalizedPath = normalizeTerritoryPath(homeDistrict.path);
    setTerritoryMode('bairro');
    
    let finalPath = normalizedPath;
    if (routeContext.module) {
      finalPath = `/${routeContext.module}${normalizedPath}`;
    }
    navigate(finalPath);
    setOpen(false);
    setSearchQuery('');
  }, [homeDistrict, normalizeTerritoryPath, setTerritoryMode, routeContext, navigate]);

  // Handler: selecionar modo cidade
  const handleSelectCidade = useCallback(() => {
    if (!homeCity) return;
    const normalizedPath = normalizeTerritoryPath(homeCity.path);
    setTerritoryMode('cidade');
    
    let finalPath = normalizedPath;
    if (routeContext.module) {
      finalPath = `/${routeContext.module}${normalizedPath}`;
    }
    navigate(finalPath);
    setOpen(false);
    setSearchQuery('');
  }, [homeCity, normalizeTerritoryPath, setTerritoryMode, routeContext, navigate]);

  // Handler: selecionar outro território (visitantes ou explorar)
  const handleSelect = useCallback((path: string) => {
    let finalPath = path;
    if (routeContext.module) {
      finalPath = `/${routeContext.module}${path}`;
    }
    // Visitantes: sem modo. Cadastrados: força modo cidade ao explorar
    if (hasHome) {
      setTerritoryMode('cidade');
    }
    navigate(finalPath);
    setOpen(false);
    setSearchQuery('');
  }, [navigate, routeContext, hasHome, setTerritoryMode]);

  // Territórios disponíveis para explorar (excluindo bairro/cidade do usuário)
  const availableTerritories = useMemo((): TerritoryButtonData[] => {
    const seenIds = new Set<string>();
    if (homeDistrict) seenIds.add(homeDistrict.id);
    if (homeCity) seenIds.add(homeCity.id);

    return selectorTerritories
      .filter(t => !seenIds.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        path: normalizeTerritoryPath(t.path),
        description: t.description,
        icon: t.kind === 'location' && t.type === LocationType.CITY ? 'city' as const : 'district' as const,
      }));
  }, [homeDistrict, homeCity, selectorTerritories, normalizeTerritoryPath]);

  // Busca unificada
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const all: TerritoryButtonData[] = [];

    if (homeDistrict && homeDistrict.name.toLowerCase().includes(q)) {
      all.push({
        id: homeDistrict.id,
        name: homeDistrict.name,
        path: normalizeTerritoryPath(homeDistrict.path),
        badge: 'MEU BAIRRO',
        icon: 'home',
      });
    }
    if (homeCity && homeCity.name.toLowerCase().includes(q)) {
      all.push({
        id: homeCity.id,
        name: homeCity.name,
        path: normalizeTerritoryPath(homeCity.path),
        badge: 'MINHA CIDADE',
        icon: 'city',
      });
    }
    availableTerritories.forEach(t => {
      if (t.name.toLowerCase().includes(q)) all.push(t);
    });

    return all;
  }, [searchQuery, homeDistrict, homeCity, availableTerritories, normalizeTerritoryPath]);

  const handleSearchSelection = useCallback((territory: TerritoryButtonData) => {
    if (homeDistrict && territory.id === homeDistrict.id) {
      handleSelectBairro();
      return;
    }

    if (homeCity && territory.id === homeCity.id) {
      handleSelectCidade();
      return;
    }

    handleSelect(territory.path);
  }, [homeDistrict, homeCity, handleSelectBairro, handleSelectCidade, handleSelect]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 hover:bg-accent/50 transition-colors text-left rounded-md",
            compact
              ? "px-3 py-1.5 border border-border hover:border-primary/40"
              : "w-full px-4 py-3 border-b border-border"
          )}
        >
          <MapPin
            className={cn(
              "h-4 w-4 flex-shrink-0",
              compact ? "text-primary" : isAtHome ? "text-primary" : "text-muted-foreground"
            )}
          />
          
          {compact ? (
            <div className="flex items-center gap-1.5">
              <div className="flex md:hidden items-center gap-1">
                <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {formattedLabel.short}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </div>
              
              <div className="hidden md:flex items-center gap-1.5">
                {contextMessage && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {contextMessage}
                  </span>
                )}
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  {formattedLabel.full}
                </span>
                {hasHome && (
                  <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 bg-accent rounded">
                    {modeLabel}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {formattedLabel.short}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {modeLabel}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">
            {hasHome ? 'Escolha seu modo' : 'Onde você está?'}
          </DialogTitle>
        </DialogHeader>

        {/* Modo toggle para usuários cadastrados */}
        {hasHome && (
          <div className="px-4 pb-3 space-y-2">
            {/* Modo Bairro */}
            {homeDistrict && (
              <button
                onClick={handleSelectBairro}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                  territoryMode === 'bairro' && isAtHome
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full flex-shrink-0",
                  territoryMode === 'bairro' && isAtHome
                    ? "bg-primary/10 text-primary"
                    : "bg-accent text-muted-foreground"
                )}>
                  <Home className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{homeDistrict.name}</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Meu Bairro
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Apenas conteúdo do seu bairro
                  </p>
                </div>
                {territoryMode === 'bairro' && isAtHome && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            )}

            {/* Modo Cidade */}
            {homeCity && (
              <button
                onClick={handleSelectCidade}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                  territoryMode === 'cidade' && isAtHomeCity
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full flex-shrink-0",
                  territoryMode === 'cidade' && isAtHomeCity
                    ? "bg-primary/10 text-primary"
                    : "bg-accent text-muted-foreground"
                )}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{homeCity.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Minha Cidade
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Toda a cidade com filtros por bairro
                  </p>
                </div>
                {territoryMode === 'cidade' && isAtHomeCity && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar cidade ou bairro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          {/* Resultados de Busca */}
          {searchQuery && searchResults && (
            <div className="px-3 pb-4 space-y-2">
              {searchResults.length > 0 ? (
                <>
                  <p className="px-1 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Resultados
                  </p>
                  {searchResults.map(territory => (
                    <TerritoryButton
                      key={territory.id}
                      territory={territory}
                      isActive={currentPath === territory.path}
                      onClick={() => handleSearchSelection(territory)}
                    />
                  ))}
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum resultado para "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Territórios disponíveis (quando não busca) */}
          {!searchQuery && availableTerritories.length > 0 && (
            <div className="px-3 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {hasHome ? 'Explorar outros locais' : 'Territórios disponíveis'}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {availableTerritories.map(territory => (
                <TerritoryButton
                  key={territory.id}
                  territory={territory}
                  isActive={currentPath === territory.path}
                  onClick={() => handleSelect(territory.path)}
                />
              ))}

              <div className="px-2 pt-2">
                <p className="text-[10px] text-muted-foreground text-center">
                  Em breve em mais cidades e bairros do Brasil
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
