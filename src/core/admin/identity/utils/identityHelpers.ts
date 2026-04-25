/**
 * Admin Identidade - Identity Helpers
 * 
 * Funções utilitárias para formatação e labels
 * 
 * SSOT: Funções centralizadas e reutilizáveis
 */

import type { AdminProfileIdentityIssue } from "../sections/types";

/**
 * Converte snake_case para Title Case
 * @example label("profile_type") => "Profile Type"
 */
export function label(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Retorna o label traduzido para um issue
 */
export function issueLabel(issue: AdminProfileIdentityIssue): string {
  switch (issue) {
    case "public_without_username":
      return "Publico sem username";
    case "public_unverified":
      return "Publico sem verificacao";
    case "suspended":
      return "Suspenso";
    case "inactive":
      return "Inativo";
    case "multi_profile":
      return "Conta multi-profile";
    case "missing_preferences":
      return "Sem preferencias";
    default:
      return label(issue);
  }
}

/**
 * Formata um score numérico
 * @example formatScore(4.567) => "4.6"
 * @example formatScore(null) => "-"
 */
export function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(1);
}
