/**
 * TerritoryIndicator
 *
 * Componente que exibe o território ativo de onde vêm os dados.
 *
 * Para páginas públicas (Empresas, Serviços, etc.):
 * - Mostra o território navegado (resolved da rota)
 * - Se não houver rota territorial, mostra "Todas as localidades"
 *
 * Para Comunidade:
 * - Mostra o bairro do perfil do usuário (onde ele mora)
 * - Passar userLocation para exibir o bairro do usuário
 */

import { MapPin } from "lucide-react";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { Location } from "../types";
import { getCityStateFromResolved, getCityStateFromLocation, formatCityState } from "../utils/territoryHelpers";

interface TerritoryIndicatorProps {
  /** Território resolvido pela rota (para páginas públicas) */
  resolved?: ResolvedTerritory;
  /** Localização do usuário (para Comunidade) */
  userLocation?: Location | null;
  /** Classe CSS adicional */
  className?: string;
  /** Variante do componente: 'compact' (inline) ou 'header' (destaque) */
  variant?: 'compact' | 'header';
}

function getTerritorySubtitle(resolved: ResolvedTerritory): string {
  if (!resolved) return '';
  
  const cityState = getCityStateFromResolved(resolved);
  const cityStateStr = formatCityState(cityState);
  
  if (resolved.kind === 'group') {
    const names = resolved.group.members.map((m) => m.name);
    if (names.length === 0) return `Agrupamento territorial${cityStateStr ? ` · ${cityStateStr}` : ''}`;
    if (names.length <= 3) return `${names.join(', ')}${cityStateStr ? ` · ${cityStateStr}` : ''}`;
    return `${names.slice(0, 3).join(', ')} e mais ${names.length - 3} bairros${cityStateStr ? ` · ${cityStateStr}` : ''}`;
  }
  
  return `Bairro${cityStateStr ? ` · ${cityStateStr}` : ''}`;
}

export function TerritoryIndicator({ 
  resolved, 
  userLocation,
  className = "",
  variant = 'compact'
}: TerritoryIndicatorProps) {
  // Determina qual território mostrar
  let territoryName: string;
  let territoryType: "group" | "location" | "user" | "none";
  let subtitle: string = '';

  if (userLocation) {
    // Prioridade 1: Localização do usuário (Comunidade)
    territoryName = userLocation.name;
    territoryType = "user";
    const cityState = getCityStateFromLocation(userLocation);
    const cityStateStr = formatCityState(cityState);
    subtitle = `Seu Bairro${cityStateStr ? ` · ${cityStateStr}` : ''}`;
  } else if (resolved) {
    // Prioridade 2: Território da rota (páginas públicas)
    if (resolved.kind === "group") {
      territoryName = resolved.group.name;
      territoryType = "group";
      subtitle = getTerritorySubtitle(resolved);
    } else {
      territoryName = resolved.location.name;
      territoryType = "location";
      subtitle = getTerritorySubtitle(resolved);
    }
  } else {
    // Sem território específico
    territoryName = "Todas as localidades";
    territoryType = "none";
    subtitle = 'Visualizando todos os resultados';
  }

  // Variante header (destaque no topo da página)
  if (variant === 'header') {
    return (
      <div className={`border-b border-border bg-gradient-to-br from-teal-500/5 via-teal-500/3 to-transparent ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-500/12 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-foreground leading-tight truncate">
                {territoryName}
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            </div>
            {territoryType === "group" && (
              <span className="text-[9px] bg-teal-500/15 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-full border border-teal-500/25 font-medium uppercase flex-shrink-0">
                Grupo
              </span>
            )}
            {territoryType === "user" && (
              <span className="text-[9px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-500/25 font-medium uppercase flex-shrink-0">
                Seu Bairro
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variante compact (inline, original)
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <MapPin className="h-4 w-4 text-primary" />
      <span className="font-medium text-foreground">{territoryName}</span>
      {territoryType === "group" && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
          Grupo Territorial
        </span>
      )}
      {territoryType === "user" && (
        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
          Seu Bairro
        </span>
      )}
    </div>
  );
}
