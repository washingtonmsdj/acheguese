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
  resolved?: ResolvedTerritory;
  userLocation?: Location | null;
  className?: string;
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
  let territoryName: string;
  let territoryType: "group" | "location" | "user" | "none";
  let subtitle: string = '';

  if (userLocation) {
    territoryName = userLocation.name;
    territoryType = "user";
    const cityState = getCityStateFromLocation(userLocation);
    const cityStateStr = formatCityState(cityState);
    subtitle = `Seu Bairro${cityStateStr ? ` · ${cityStateStr}` : ''}`;
  } else if (resolved) {
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
    territoryName = "Todas as localidades";
    territoryType = "none";
    subtitle = 'Visualizando todos os resultados';
  }

  if (variant === 'header') {
    return (
      <div className={`border-b border-territory-border bg-gradient-to-br from-territory-brand/5 via-territory-brand/[0.03] to-transparent ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-territory-brand/10">
              <MapPin className="h-4 w-4 text-territory-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold leading-tight text-territory-ink">
                {territoryName}
              </h1>
              <p className="mt-0.5 truncate text-[10px] text-territory-muted">
                {subtitle}
              </p>
            </div>
            {territoryType === "group" && (
              <span className="flex-shrink-0 rounded-full border border-territory-brand/25 bg-territory-brand/10 px-2 py-1 text-[9px] font-medium uppercase text-territory-brand">
                Grupo
              </span>
            )}
            {territoryType === "user" && (
              <span className="flex-shrink-0 rounded-full border border-territory-sun/30 bg-territory-sun/15 px-2 py-1 text-[9px] font-medium uppercase text-territory-ink">
                Seu Bairro
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <MapPin className="h-4 w-4 text-territory-brand" />
      <span className="font-medium text-territory-ink">{territoryName}</span>
      {territoryType === "group" && (
        <span className="rounded bg-territory-brand/10 px-2 py-0.5 text-xs text-territory-brand">
          Grupo Territorial
        </span>
      )}
      {territoryType === "user" && (
        <span className="rounded bg-territory-sun/15 px-2 py-0.5 text-xs text-territory-ink">
          Seu Bairro
        </span>
      )}
    </div>
  );
}
