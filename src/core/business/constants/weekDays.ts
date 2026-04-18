/**
 * SSOT: Dias da Semana
 * 
 * Definições centralizadas de dias da semana para horários de funcionamento.
 * 
 * REGRA SSOT:
 * - Todas as definições de dias da semana devem usar estas constantes
 * - Nunca duplicar em componentes ou páginas
 * - Sempre importar deste módulo
 */

// ============================================================================
// DIAS DA SEMANA
// ============================================================================

export const WEEK_DAYS = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;

export type WeekDay = typeof WEEK_DAYS[number];

// ============================================================================
// LABELS DOS DIAS
// ============================================================================

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
} as const;

// ============================================================================
// LABELS CURTOS (3 letras)
// ============================================================================

export const WEEK_DAY_SHORT_LABELS: Record<WeekDay, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
  domingo: "Dom",
} as const;

// ============================================================================
// DIAS ÚTEIS (Segunda a Sexta)
// ============================================================================

export const WEEKDAYS: readonly WeekDay[] = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
] as const;

// ============================================================================
// FINAL DE SEMANA
// ============================================================================

export const WEEKEND: readonly WeekDay[] = [
  "sabado",
  "domingo",
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtém o label completo de um dia
 */
export function getWeekDayLabel(day: WeekDay): string {
  return WEEK_DAY_LABELS[day];
}

/**
 * Obtém o label curto de um dia
 */
export function getWeekDayShortLabel(day: WeekDay): string {
  return WEEK_DAY_SHORT_LABELS[day];
}

/**
 * Verifica se é dia útil (segunda a sexta)
 */
export function isWeekday(day: WeekDay): boolean {
  return WEEKDAYS.includes(day);
}

/**
 * Verifica se é final de semana
 */
export function isWeekend(day: WeekDay): boolean {
  return WEEKEND.includes(day);
}

/**
 * Obtém todos os dias como array de objetos {value, label}
 */
export function getWeekDaysAsOptions(): Array<{ value: WeekDay; label: string }> {
  return WEEK_DAYS.map((day) => ({
    value: day,
    label: getWeekDayLabel(day),
  }));
}

/**
 * Obtém todos os dias como array de objetos {value, label} com labels curtos
 */
export function getWeekDaysAsShortOptions(): Array<{ value: WeekDay; label: string }> {
  return WEEK_DAYS.map((day) => ({
    value: day,
    label: getWeekDayShortLabel(day),
  }));
}

/**
 * Valida se uma string é um dia da semana válido
 */
export function isValidWeekDay(day: string): day is WeekDay {
  return WEEK_DAYS.includes(day as WeekDay);
}

/**
 * Converte índice (0-6, onde 0 = domingo) para WeekDay
 * Útil para trabalhar com Date.getDay()
 */
export function indexToWeekDay(index: number): WeekDay | null {
  const mapping: Record<number, WeekDay> = {
    0: "domingo",
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
  };
  return mapping[index] || null;
}

/**
 * Converte WeekDay para índice (0-6, onde 0 = domingo)
 * Útil para trabalhar com Date.getDay()
 */
export function weekDayToIndex(day: WeekDay): number {
  const mapping: Record<WeekDay, number> = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6,
  };
  return mapping[day];
}
