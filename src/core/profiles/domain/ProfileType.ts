/**
 * ProfileType — Enum Canônico
 *
 * SSOT para tipos de perfil no sistema.
 *
 * @version 2.0.0
 */

/**
 * Tipos de perfil suportados
 *
 * - personal: Perfil pessoal (padrão no signup)
 * - business: Perfil de empresa/negócio
 * - professional: Perfil de profissional autônomo
 * - driver: Perfil de motorista (mobility)
 */
export type ProfileType =
  | 'personal'
  | 'business'
  | 'professional'
  | 'driver'
  | 'communication_channel';

/**
 * Labels amigáveis para cada tipo
 */
export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  personal: 'Pessoal',
  business: 'Empresa',
  professional: 'Profissional',
  driver: 'Motorista',
  communication_channel: 'Canal de Comunicacao',
};

/**
 * Descrições de cada tipo
 */
export const PROFILE_TYPE_DESCRIPTIONS: Record<ProfileType, string> = {
  personal: 'Perfil pessoal para uso individual',
  business: 'Perfil para empresas e negócios',
  professional: 'Perfil para profissionais autônomos',
  driver: 'Perfil para motoristas da plataforma',
  communication_channel: 'Perfil institucional para canais comunitarios e editoriais',
};

/**
 * Type guard para validar ProfileType
 */
export function isProfileType(value: unknown): value is ProfileType {
  return (
    typeof value === 'string' &&
    ['personal', 'business', 'professional', 'driver', 'communication_channel'].includes(value)
  );
}
