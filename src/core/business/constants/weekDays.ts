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
  switch (day) {
    case "segunda": return WEEK_DAY_LABELS.segunda;
    case "terca": return WEEK_DAY_LABELS.terca;
    case "quarta": return WEEK_DAY_LABELS.quarta;
    case "quinta": return WEEK_DAY_LABELS.quinta;
    case "sexta": return WEEK_DAY_LABELS.sexta;
    case "sabado": return WEEK_DAY_LABELS.sabado;
    case "domingo": return WEEK_DAY_LABELS.domingo;
    default: return WEEK_DAY_LABELS.segunda;
  }
}

/**
 * Obtém o label curto de um dia
 */
export function getWeekDayShortLabel(day: WeekDay): string {
  switch (day) {
    case "segunda": return WEEK_DAY_SHORT_LABELS.segunda;
    case "terca": return WEEK_DAY_SHORT_LABELS.terca;
    case "quarta": return WEEK_DAY_SHORT_LABELS.quarta;
    case "quinta": return WEEK_DAY_SHORT_LABELS.quinta;
    case "sexta": return WEEK_DAY_SHORT_LABELS.sexta;
    case "sabado": return WEEK_DAY_SHORT_LABELS.sabado;
    case "domingo": return WEEK_DAY_SHORT_LABELS.domingo;
    default: return WEEK_DAY_SHORT_LABELS.segunda;
  }
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
  switch (index) {
    case 0: return "domingo";
    case 1: return "segunda";
    case 2: return "terca";
    case 3: return "quarta";
    case 4: return "quinta";
    case 5: return "sexta";
    case 6: return "sabado";
    default: return null;
  }
}

/**
 * Converte WeekDay para índice (0-6, onde 0 = domingo)
 * Útil para trabalhar com Date.getDay()
 */
export function weekDayToIndex(day: WeekDay): number {
  switch (day) {
    case "domingo": return 0;
    case "segunda": return 1;
    case "terca": return 2;
    case "quarta": return 3;
    case "quinta": return 4;
    case "sexta": return 5;
    case "sabado": return 6;
    default: return 1;
  }
}
