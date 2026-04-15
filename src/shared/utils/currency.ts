/**
 * SSOT para formatação monetária (BRL) no sistema.
 *
 * Todos os módulos devem consumir formatBrl/formatBrlCompact daqui.
 * Nunca duplicar Intl.NumberFormat em componentes ou módulos.
 */

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const BRL_COMPACT_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  compactDisplay: 'short',
});

export function formatBrl(value: number): string {
  return BRL_FORMATTER.format(value);
}

export function formatBrlCompact(value: number): string {
  if (value >= 1000) {
    return BRL_COMPACT_FORMATTER.format(value);
  }

  return formatBrl(value);
}
