/**
 * Coordinate validation utilities for Gastronomy module.
 * SSOT within the module — do not duplicate isFiniteCoordinate elsewhere.
 */

export function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
