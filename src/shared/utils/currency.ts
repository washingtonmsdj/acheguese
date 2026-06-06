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

const BRL_NO_CENTS_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatBrl(value: number): string {
  return BRL_FORMATTER.format(value);
}

export function formatBrlNoCents(value: number): string {
  return BRL_NO_CENTS_FORMATTER.format(value);
}

export function formatBrlFromCents(valueInCents: number): string {
  return formatBrl(valueInCents / 100);
}

export function formatBrlFromCentsNoCents(valueInCents: number): string {
  return formatBrlNoCents(valueInCents / 100);
}

export function formatBrlCompact(value: number): string {
  if (value >= 1000) {
    return BRL_COMPACT_FORMATTER.format(value);
  }

  return formatBrl(value);
}
