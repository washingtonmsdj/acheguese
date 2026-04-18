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
  const labels: Record<AdminProfileIdentityIssue, string> = {
    public_without_username: "Publico sem username",
    public_unverified: "Publico sem verificacao",
    suspended: "Suspenso",
    inactive: "Inativo",
    multi_profile: "Conta multi-profile",
    missing_preferences: "Sem preferencias",
  };

  return labels[issue] || label(issue);
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
