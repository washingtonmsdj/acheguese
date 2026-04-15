/**
 * EntityLocationDisplay - Utilitário SSOT para exibição de localização
 * 
 * Resolve o que mostrar publicamente para cada tipo de entidade.
 * Nunca usar texto de localização hardcoded em componentes.
 * 
 * @module core/location/utils
 */

import {
  type LocationEntityType,
  type EntityDisplayRules,
  ENTITY_DISPLAY_RULES,
  getPublicLocationLabel,
} from '../types/entityLocation';

export interface LocationDisplayContext {
  entityType: LocationEntityType;
  neighborhood?: string;
  city?: string;
  street?: string;
  number?: string;
  coverageAreas?: string[];
  isVerified?: boolean;
}

export interface LocationDisplayResult {
  /** Label público para exibir */
  label: string;
  /** Pode mostrar no mapa com pin exato? */
  showPin: boolean;
  /** Tipo de representação no mapa */
  mapType: EntityDisplayRules['mapRepresentation'];
  /** Se pode usar em busca por proximidade */
  supportsProximity: boolean;
  /** Badge descritivo (ex: "Atende na região", "Local físico") */
  badge: string | null;
}

/**
 * Resolve exibição pública de localização para uma entidade.
 * 
 * Exemplo:
 * ```ts
 * const display = resolveLocationDisplay({
 *   entityType: 'mobile_service',
 *   city: 'Salvador',
 *   coverageAreas: ['Nordeste de Amaralina', 'Santa Cruz'],
 * });
 * // display.label → "Atende em: Nordeste de Amaralina, Santa Cruz"
 * // display.showPin → false
 * // display.mapType → 'area'
 * ```
 */
export function resolveLocationDisplay(ctx: LocationDisplayContext): LocationDisplayResult {
  const rules = ENTITY_DISPLAY_RULES[ctx.entityType];

  const label = getPublicLocationLabel(ctx.entityType, {
    neighborhood: ctx.neighborhood,
    city: ctx.city,
    coverageAreas: ctx.coverageAreas,
    fullAddress: rules.showStreetAddress && ctx.street
      ? `${ctx.street}${ctx.number ? `, ${ctx.number}` : ''} — ${ctx.neighborhood || ctx.city || ''}`
      : undefined,
  });

  const badge = (() => {
    switch (ctx.entityType) {
      case 'physical_business': return 'Local físico';
      case 'mobile_service': return 'Atende na região';
      case 'verified_resident': return ctx.isVerified ? 'Morador verificado' : null;
      default: return null;
    }
  })();

  return {
    label,
    showPin: rules.showExactPin,
    mapType: rules.mapRepresentation,
    supportsProximity: rules.supportsProximity,
    badge,
  };
}

/**
 * Resolve label de distância contextual
 * 
 * - Para GPS real: mostra distância exata
 * - Para fallback territorial: mostra contexto territorial
 */
export function resolveDistanceLabel(
  distanceMeters: number | null,
  isGpsSource: boolean,
  territoryName?: string,
): string {
  if (distanceMeters != null && isGpsSource) {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)}m de você`;
    }
    return `${(distanceMeters / 1000).toFixed(1)}km de você`;
  }

  if (territoryName) {
    return `em ${territoryName}`;
  }

  return '';
}
