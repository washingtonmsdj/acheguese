/**
 * Business Helpers - Funções utilitárias para lógica de negócio
 * 
 * SSOT: Funções reutilizáveis para lógica de empresa
 * Sem gambiarras: Funções puras e testáveis
 */

import type { OpenStatus } from "../sections/types";
import { getRecordValue } from "@/shared/utils/recordLookup";

type DaySchedule = {
  closed?: boolean;
  open?: unknown;
  close?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDaySchedule(value: unknown): value is DaySchedule {
  return isRecord(value);
}

/**
 * Verifica se empresa está aberta no momento
 */
export function isCurrentlyOpen(
  hours: unknown,
): OpenStatus {
  if (!isRecord(hours)) return { open: false, todayHours: null };

  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const now = new Date();
  const dayKey = days.at(now.getDay());
  const todaySchedule = dayKey ? getRecordValue(hours, dayKey) : undefined;

  if (!isDaySchedule(todaySchedule) || todaySchedule.closed) {
    return { open: false, todayHours: "Fechado hoje" };
  }

  // Verificar se open e close existem e são strings
  if (
    !todaySchedule.open ||
    !todaySchedule.close ||
    typeof todaySchedule.open !== "string" ||
    typeof todaySchedule.close !== "string"
  ) {
    return { open: false, todayHours: null };
  }

  const todayHours = `${todaySchedule.open} – ${todaySchedule.close}`;
  const [openH, openM] = todaySchedule.open.split(":").map(Number);
  const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return {
    open: currentMinutes >= openMinutes && currentMinutes <= closeMinutes,
    todayHours,
  };
}

/**
 * Extrai texto de endereço
 */
export function getAddressText(address: any, businessAddress?: string | null): string | null {
  if (!address) return businessAddress || null;
  
  if (typeof address === "object" && address) {
    return [address.street, address.number, address.complement]
      .filter(Boolean)
      .join(", ");
  }
  
  return (typeof address === "string" ? address : businessAddress) || null;
}

/**
 * Extrai texto de localização
 */
export function getLocationText(
  location: any,
  businessCity?: string | null,
  businessState?: string | null,
): string | null {
  if (!location) {
    if (businessCity && businessState) {
      return `${businessCity} - ${businessState}`;
    }

    return businessCity || businessState || null;
  }

  return location.full_name || location.name || null;
}
