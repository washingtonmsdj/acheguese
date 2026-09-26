/**
 * Opening Hours Helpers
 *
 * Utilitários para trabalhar com horários de funcionamento
 */

import type { BusinessHours } from '../types';

const DAYS_OF_WEEK = [
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
type DaySchedule = BusinessHours[string];

function getDayByIndex(dayIndex: number): DayOfWeek {
  const normalizedIndex = ((dayIndex % 7) + 7) % 7;
  return DAYS_OF_WEEK.at(normalizedIndex) ?? "domingo";
}

function toScheduleMap(openingHours: BusinessHours | undefined): Map<string, DaySchedule> {
  if (!openingHours) {
    return new Map();
  }
  return new Map(Object.entries(openingHours));
}

function timeToMinutes(value: string): number | null {
  const [hours, minutes] = value.split(':').map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function isOvernightSchedule(schedule: DaySchedule): boolean {
  const opensAt = timeToMinutes(schedule.open);
  const closesAt = timeToMinutes(schedule.close);
  return opensAt !== null && closesAt !== null && closesAt < opensAt;
}

function getCurrentMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function getActiveSchedule(
  openingHours: BusinessHours | undefined,
  now = new Date(),
): DaySchedule | null {
  if (!openingHours) return null;

  const scheduleMap = toScheduleMap(openingHours);
  const currentMinutes = getCurrentMinutes(now);
  const currentDayIndex = now.getDay();
  const todaySchedule = scheduleMap.get(getDayByIndex(currentDayIndex));

  if (todaySchedule && !todaySchedule.closed) {
    const opensAt = timeToMinutes(todaySchedule.open);
    const closesAt = timeToMinutes(todaySchedule.close);

    if (opensAt !== null && closesAt !== null) {
      if (closesAt >= opensAt && currentMinutes >= opensAt && currentMinutes <= closesAt) {
        return todaySchedule;
      }

      if (closesAt < opensAt && currentMinutes >= opensAt) {
        return todaySchedule;
      }
    }
  }

  const previousSchedule = scheduleMap.get(getDayByIndex(currentDayIndex - 1));
  if (previousSchedule && !previousSchedule.closed && isOvernightSchedule(previousSchedule)) {
    const closesAt = timeToMinutes(previousSchedule.close);
    if (closesAt !== null && currentMinutes <= closesAt) {
      return previousSchedule;
    }
  }

  return null;
}

/**
 * Obtém dia da semana atual
 */
export function getCurrentDayOfWeek(): string {
  const dayIndex = new Date().getDay();
  return getDayByIndex(dayIndex);
}

/**
 * Verifica se está aberto agora, incluindo expedientes que atravessam meia-noite.
 */
export function isOpenNow(openingHours: BusinessHours | undefined): boolean {
  return getActiveSchedule(openingHours) !== null;
}

/**
 * Obtém horário de hoje
 */
export function getTodaySchedule(openingHours: BusinessHours | undefined): {
  open: string;
  close: string;
  closed: boolean;
} | null {
  if (!openingHours) {
    return null;
  }

  const currentDay = getCurrentDayOfWeek();
  const scheduleMap = toScheduleMap(openingHours);
  const daySchedule = scheduleMap.get(currentDay);

  if (!daySchedule) {
    return null;
  }

  return {
    open: daySchedule.open,
    close: daySchedule.close,
    closed: daySchedule.closed || false,
  };
}

/**
 * Formata horário para exibição
 */
export function formatSchedule(schedule: { open: string; close: string }): string {
  return `${schedule.open} - ${schedule.close}`;
}

/**
 * Obtém status de abertura
 */
export function getOpeningStatus(openingHours: BusinessHours | undefined): {
  isOpen: boolean;
  message: string;
  nextChange?: string;
} {
  if (!openingHours) {
    return {
      isOpen: false,
      message: 'Horário não informado',
    };
  }

  const activeSchedule = getActiveSchedule(openingHours);
  if (activeSchedule) {
    return {
      isOpen: true,
      message: 'Aberto agora',
      nextChange: `Fecha às ${activeSchedule.close}`,
    };
  }

  const todaySchedule = getTodaySchedule(openingHours);
  if (!todaySchedule) {
    return {
      isOpen: false,
      message: 'Horário não informado',
    };
  }

  if (todaySchedule.closed) {
    return {
      isOpen: false,
      message: 'Fechado hoje',
      nextChange: getNextOpeningTime(openingHours) ?? undefined,
    };
  }

  return {
    isOpen: false,
    message: 'Fechado agora',
    nextChange: getNextOpeningTime(openingHours) ?? undefined,
  };
}

/**
 * Verifica se está fechado hoje
 */
export function isClosedToday(openingHours: BusinessHours | undefined): boolean {
  if (!openingHours) {
    return true;
  }

  const todaySchedule = getTodaySchedule(openingHours);
  return !todaySchedule || todaySchedule.closed;
}

/**
 * Obtém próximo horário de abertura sem anunciar novamente um horário de hoje
 * que já ficou no passado.
 */
export function getNextOpeningTime(openingHours: BusinessHours | undefined): string | null {
  if (!openingHours) {
    return null;
  }

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentMinutes = getCurrentMinutes(now);
  const scheduleMap = toScheduleMap(openingHours);

  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (currentDayIndex + offset) % 7;
    const dayName = getDayByIndex(dayIndex);
    const daySchedule = scheduleMap.get(dayName);

    if (!daySchedule || daySchedule.closed) continue;

    if (offset === 0) {
      const opensAt = timeToMinutes(daySchedule.open);
      if (opensAt === null || currentMinutes >= opensAt) {
        continue;
      }
      return `Abre às ${daySchedule.open}`;
    }

    if (offset === 1) {
      return `Abre amanhã às ${daySchedule.open}`;
    }

    return `Abre ${dayName} às ${daySchedule.open}`;
  }

  return null;
}

/**
 * Verifica se tem horário de funcionamento definido
 */
export function hasOpeningHours(openingHours: BusinessHours | undefined): boolean {
  if (!openingHours) {
    return false;
  }

  return Object.keys(openingHours).length > 0;
}

/**
 * Obtém todos os dias com horário
 */
export function getScheduledDays(openingHours: BusinessHours | undefined): string[] {
  if (!openingHours) {
    return [];
  }

  const scheduleMap = toScheduleMap(openingHours);
  return Object.keys(openingHours).filter((day) => {
    const schedule = scheduleMap.get(day);
    return schedule && !schedule.closed;
  });
}

/**
 * Verifica se funciona 24h
 */
export function isOpen24Hours(openingHours: BusinessHours | undefined): boolean {
  if (!openingHours) {
    return false;
  }

  const todaySchedule = getTodaySchedule(openingHours);

  if (!todaySchedule || todaySchedule.closed) {
    return false;
  }

  return todaySchedule.open === '00:00' && todaySchedule.close === '23:59';
}

/**
 * Verifica se funciona todos os dias
 */
export function isOpenEveryDay(openingHours: BusinessHours | undefined): boolean {
  if (!openingHours) {
    return false;
  }

  const scheduleMap = toScheduleMap(openingHours);
  return DAYS_OF_WEEK.every((day) => {
    const schedule = scheduleMap.get(day);
    return schedule && !schedule.closed;
  });
}

/**
 * Obtém resumo do horário de funcionamento
 */
export function getOpeningHoursSummary(openingHours: BusinessHours | undefined): string {
  if (!openingHours) {
    return 'Horário não informado';
  }

  if (isOpen24Hours(openingHours) && isOpenEveryDay(openingHours)) {
    return 'Aberto 24 horas';
  }

  if (isOpenEveryDay(openingHours)) {
    const todaySchedule = getTodaySchedule(openingHours);
    if (todaySchedule && !todaySchedule.closed) {
      return `Todos os dias ${formatSchedule(todaySchedule)}`;
    }
  }

  const scheduledDays = getScheduledDays(openingHours);

  if (scheduledDays.length === 0) {
    return 'Fechado';
  }

  if (scheduledDays.length === 1) {
    const day = scheduledDays[0];
    const schedule = toScheduleMap(openingHours).get(day);
    if (!schedule) {
      return 'Fechado';
    }
    return `${day}: ${formatSchedule(schedule)}`;
  }

  return `${scheduledDays.length} dias por semana`;
}
