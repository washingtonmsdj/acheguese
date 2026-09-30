import type { BusinessHours } from "@/core/business/types/Business";

export type DraftDaySchedule = Partial<BusinessHours[string]>;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function getScheduleError(schedule?: DraftDaySchedule): string | null {
  if (!schedule || schedule.closed) return null;
  if (
    !timePattern.test(schedule.open ?? "") ||
    !timePattern.test(schedule.close ?? "")
  ) {
    return "Preencha abertura e fechamento com horários válidos.";
  }
  if (schedule.open === schedule.close) {
    return "Abertura e fechamento precisam ser diferentes.";
  }
  return null;
}

export function getSchedulePreview(schedule?: DraftDaySchedule): string {
  if (!schedule) return "Não informado";
  if (schedule.closed) return "Fechado";
  if (getScheduleError(schedule)) return "Em edição";
  return `${schedule.open} – ${schedule.close}`;
}
