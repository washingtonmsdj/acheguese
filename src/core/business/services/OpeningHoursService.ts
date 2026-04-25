import { logger } from '@/shared/utils/logger';
/**
 * OpeningHoursService - Cálculo de horário de funcionamento
 * 
 * Fonte de verdade: business_data.opening_hours
 */

export interface OpeningStatus {
  is_open: boolean;
  status_text: string;
  next_change?: {
    time: string;
    action: 'opens' | 'closes';
  };
}

interface DaySchedule {
  open: string;
  close: string;
}

interface OpeningHours {
  schedules?: Record<string, DaySchedule>;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getDayNameByIndex(index: number): string {
  if (index < 0 || index > 6) {
    return 'sunday';
  }
  return DAY_NAMES.at(index) ?? 'sunday';
}

export class OpeningHoursService {
  /**
   * Calcula status de abertura atual
   */
  static calculateStatus(
    openingHours: OpeningHours | null | undefined,
    timezone: string = 'America/Bahia',
  ): OpeningStatus {
    if (!openingHours || !openingHours.schedules) {
      return {
        is_open: false,
        status_text: 'Horário não informado',
      };
    }

    try {
      const now = new Date();
      const dayIndex = now.getDay();
      const dayName = getDayNameByIndex(dayIndex);
      const scheduleMap = new Map(Object.entries(openingHours.schedules));
      const schedule = scheduleMap.get(dayName);

      if (!schedule) {
        return {
          is_open: false,
          status_text: 'Fechado hoje',
        };
      }

      const currentTime = this.formatTime(now);
      const openTime = schedule.open;
      const closeTime = schedule.close;

      const isOpen = currentTime >= openTime && currentTime < closeTime;

      if (isOpen) {
        return {
          is_open: true,
          status_text: 'Aberto agora',
          next_change: {
            time: closeTime,
            action: 'closes',
          },
        };
      }

      // Fechado - calcular quando abre
      if (currentTime < openTime) {
        return {
          is_open: false,
          status_text: `Abre às ${openTime}`,
          next_change: {
            time: openTime,
            action: 'opens',
          },
        };
      }

      // Fechado após horário - abre amanhã
      const tomorrowIndex = (dayIndex + 1) % 7;
      const tomorrowName = getDayNameByIndex(tomorrowIndex);
      const tomorrowSchedule = scheduleMap.get(tomorrowName);

      if (tomorrowSchedule) {
        return {
          is_open: false,
          status_text: `Abre amanhã às ${tomorrowSchedule.open}`,
          next_change: {
            time: tomorrowSchedule.open,
            action: 'opens',
          },
        };
      }

      return {
        is_open: false,
        status_text: 'Fechado',
      };
    } catch (error: any) {
      logger.error('[OpeningHoursService] Error calculating status:', error);
      return {
        is_open: false,
        status_text: 'Horário indisponível',
      };
    }
  }

  /**
   * Formata hora atual como HH:MM
   */
  private static formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
