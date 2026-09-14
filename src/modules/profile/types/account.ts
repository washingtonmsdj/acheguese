/**
 * Account view types.
 *
 * Este módulo não redefine contratos de domínio. Ele apenas dá nomes de UI aos
 * read models canônicos de core/profiles para impedir que a superfície /conta
 * volte a manter cópias paralelas de identidade, contexto ou estado da conta.
 */
export type { ProfileAccountSnapshot as AccountSnapshot } from "@/core/profiles/views/ProfileAccountSnapshot";
export type { ProfileContext as Context } from "@/core/profiles/views/ProfileContext";
export type { ProfileIdentitySnapshot as Identity } from "@/core/profiles/services/types";
