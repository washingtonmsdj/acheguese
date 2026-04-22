/**
 * Re-exports de formatação monetária do SSOT shared.
 *
 * O contrato canonico esta em @/shared/utils/currency.
 * Este arquivo mantem a API publica estavel do modulo.
 */

export { formatBrl, formatBrlCompact } from '@/shared/utils/currency';

/**
 * Normaliza valor monetário para 2 casas decimais
 * Usado em cálculos internos de carrinho e preços
 */
export function money(value: number): number {
  return Number(value.toFixed(2));
}
