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

/**
 * Obtém dia da semana atual
 */
export function getCurrentDayOfWeek(): string {
  const dayIndex = new Date().getDay();
  return DAYS_OF_WEEK[dayIndex];
}

/**
 * Verifica se está aberto agora
 */
export function isOpenNow(openingHours: BusinessHours | undefined): boolean {
  if (!openingHours) {
    return false;
  }

  const currentDay = getCurrentDayOfWeek();
  const daySchedule = openingHours[currentDay];

  if (!daySchedule || daySchedule.closed) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
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
  const daySchedule = openingHours[currentDay];

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
    };
  }

  const isOpen = isOpenNow(openingHours);

  if (isOpen) {
    return {
      isOpen: true,
      message: 'Aberto agora',
      nextChange: `Fecha às ${todaySchedule.close}`,
    };
  }

  return {
    isOpen: false,
    message: 'Fechado agora',
    nextChange: `Abre às ${todaySchedule.open}`,
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
 * Obtém próximo horário de abertura
 */
export function getNextOpeningTime(openingHours: BusinessHours | undefined): string | null {
  if (!openingHours) {
    return null;
  }

  const currentDayIndex = new Date().getDay();

  // Procurar nos próximos 7 dias
  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const dayName = DAYS_OF_WEEK[dayIndex];
    const daySchedule = openingHours[dayName];

    if (daySchedule && !daySchedule.closed) {
      if (i === 0) {
        // Hoje
        return `Abre às ${daySchedule.open}`;
      } else if (i === 1) {
        // Amanhã
        return `Abre amanhã às ${daySchedule.open}`;
      } else {
        // Outro dia
        return `Abre ${dayName} às ${daySchedule.open}`;
      }
    }
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

  return Object.keys(openingHours).filter((day) => {
    const schedule = openingHours[day];
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

  return DAYS_OF_WEEK.every((day) => {
    const schedule = openingHours[day];
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
    const schedule = openingHours[day];
    return `${day}: ${formatSchedule(schedule)}`;
  }

  return `${scheduledDays.length} dias por semana`;
}
