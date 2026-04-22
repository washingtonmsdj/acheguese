/**
 * Driver Helpers
 * 
 * Funções utilitárias para manipulação de dados de motoristas
 */

import type { DriverRequest } from "../sections/types";

/**
 * Formata data para exibição
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formata data e hora para exibição
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Verifica se motorista está pendente de aprovação
 */
export function isDriverPending(driver: DriverRequest): boolean {
  return !driver.profileContext?.verified && !driver.profileContext?.status.isSuspended;
}

/**
 * Verifica se motorista está aprovado
 */
export function isDriverApproved(driver: DriverRequest): boolean {
  return !!driver.profileContext?.verified;
}

/**
 * Verifica se motorista está suspenso
 */
export function isDriverSuspended(driver: DriverRequest): boolean {
  return !!driver.profileContext?.status.isSuspended;
}

/**
 * Verifica se motorista está online
 */
export function isDriverOnline(driver: DriverRequest): boolean {
  return driver.is_online && !isDriverSuspended(driver);
}

/**
 * Obtém iniciais do nome do motorista
 */
export function getDriverInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
