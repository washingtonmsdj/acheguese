/**
 * SSOT de visibilidade territorial para navegação pública.
 *
 * Regras:
 * - `is_selector_active`: controla apenas aparição no seletor
 * - `is_landing_enabled`: controla landings/listagens agregadas
 * - `is_navigable`: controla acesso por URL pública
 */

export interface TerritoryVisibilityMetadata {
  is_selector_active?: boolean;
  is_landing_enabled?: boolean;
  is_navigable?: boolean;
  [key: string]: unknown;
}

export function isTerritorySelectorActive(
  metadata?: TerritoryVisibilityMetadata | null,
): boolean {
  return metadata?.is_selector_active === true;
}

export function isTerritoryPubliclyNavigable(
  metadata?: TerritoryVisibilityMetadata | null,
): boolean {
  return metadata?.is_navigable !== false;
}

export function isTerritoryLandingEnabled(
  metadata?: TerritoryVisibilityMetadata | null,
): boolean {
  return metadata?.is_landing_enabled !== false;
}

export function isTerritoryVisibleInLanding(
  metadata?: TerritoryVisibilityMetadata | null,
): boolean {
  return (
    isTerritoryLandingEnabled(metadata) &&
    isTerritoryPubliclyNavigable(metadata)
  );
}
