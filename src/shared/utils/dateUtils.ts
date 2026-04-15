/**
 * Date Utilities
 *
 * Funções utilitárias para formatação e manipulação de datas.
 * Centraliza lógica de formatação para evitar duplicação.
 *
 * @module shared/utils/dateUtils
 * @version 1.0.0
 */

/**
 * Formata data/hora em formato relativo (ex: "há 5 min", "há 2h")
 *
 * @param iso - Data em formato ISO string
 * @returns String formatada em tempo relativo
 *
 * @example
 * formatRelativeTime('2026-04-15T10:00:00Z') // "há 5 min"
 * formatRelativeTime('2026-04-14T10:00:00Z') // "há 1 dia"
 */
export function formatRelativeTime(iso: string): string {
  try {
    const now = Date.now();
    const date = new Date(iso);
    const diff = now - date.getTime();

    // Menos de 1 minuto
    if (diff < 60000) {
      return 'agora';
    }

    // Menos de 1 hora (em minutos)
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `há ${mins} min`;
    }

    // Menos de 24 horas (em horas)
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `há ${hours}h`;
    }

    // Menos de 7 dias (em dias)
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }

    // Mais de 7 dias (em semanas)
    if (diff < 2592000000) {
      const weeks = Math.floor(diff / 604800000);
      return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }

    // Mais de 30 dias (em meses)
    if (diff < 31536000000) {
      const months = Math.floor(diff / 2592000000);
      return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }

    // Mais de 1 ano (em anos)
    const years = Math.floor(diff / 31536000000);
    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
  } catch {
    return 'data inválida';
  }
}

/**
 * Formata data/hora em formato de horário (ex: "14:30")
 *
 * @param iso - Data em formato ISO string
 * @returns String formatada em horário (HH:mm)
 *
 * @example
 * formatTime('2026-04-15T14:30:00Z') // "14:30"
 */
export function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

/**
 * Formata data em formato curto (ex: "15/04/2026")
 *
 * @param iso - Data em formato ISO string
 * @returns String formatada em data curta (DD/MM/YYYY)
 *
 * @example
 * formatShortDate('2026-04-15T14:30:00Z') // "15/04/2026"
 */
export function formatShortDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '--/--/----';
  }
}

/**
 * Formata data e hora em formato completo (ex: "15/04/2026 às 14:30")
 *
 * @param iso - Data em formato ISO string
 * @returns String formatada em data e hora completa
 *
 * @example
 * formatDateTime('2026-04-15T14:30:00Z') // "15/04/2026 às 14:30"
 */
export function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} às ${timeStr}`;
  } catch {
    return 'data inválida';
  }
}

/**
 * Verifica se uma data é hoje
 *
 * @param iso - Data em formato ISO string
 * @returns true se a data é hoje, false caso contrário
 *
 * @example
 * isToday('2026-04-15T14:30:00Z') // true (se hoje for 15/04/2026)
 */
export function isToday(iso: string): boolean {
  try {
    const date = new Date(iso);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Verifica se uma data é amanhã
 *
 * @param iso - Data em formato ISO string
 * @returns true se a data é amanhã, false caso contrário
 *
 * @example
 * isTomorrow('2026-04-16T14:30:00Z') // true (se hoje for 15/04/2026)
 */
export function isTomorrow(iso: string): boolean {
  try {
    const date = new Date(iso);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Calcula diferença em dias entre duas datas
 *
 * @param iso1 - Primeira data em formato ISO string
 * @param iso2 - Segunda data em formato ISO string (opcional, padrão: agora)
 * @returns Número de dias de diferença
 *
 * @example
 * getDaysDifference('2026-04-10T00:00:00Z', '2026-04-15T00:00:00Z') // 5
 */
export function getDaysDifference(iso1: string, iso2?: string): number {
  try {
    const date1 = new Date(iso1);
    const date2 = iso2 ? new Date(iso2) : new Date();
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / 86400000);
  } catch {
    return 0;
  }
}
