/**
 * CreateProfileInput — Input de Criação de Perfil
 * 
 * Usado para criar novos perfis.
 * Validado por Zod antes de chegar no service.
 * 
 * @version 2.0.0
 */

import type { ProfileType } from '../domain/ProfileType';

/**
 * CreateProfileInput — Input de Criação
 * 
 * Dados necessários para criar um novo perfil.
 */
export interface CreateProfileInput {
  /** Tipo de perfil (obrigatório) */
  profile_type: ProfileType;
  
  /** Nome de exibição (obrigatório) */
  display_name: string;
  
  /** Username para @mentions (opcional) */
  username?: string;
  
  /** Biografia (opcional) */
  bio?: string;
  
  /** URL do avatar (opcional) */
  avatar_url?: string;
  
  /** URL da capa (opcional) */
  cover_url?: string;
  
  /** ID da localização (opcional) */
  location_id?: string;
  
  /** Telefone (opcional) */
  phone?: string;
  
  /** WhatsApp (opcional) */
  whatsapp?: string;
}

/**
 * CreateProfileWithExtensionInput — Input de Criação com Extensão
 * 
 * Usado para criar perfis business/professional/driver com dados de extensão.
 */
export interface CreateProfileWithExtensionInput extends CreateProfileInput {
  /** Dados de extensão (business/professional/driver) */
  extension_data?: Record<string, unknown>;
}

/**
 * Valida se o input de criação é válido
 */
export function validateCreateProfileInput(
  input: unknown
): input is CreateProfileInput {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  
  const data = input as Partial<CreateProfileInput>;
  
  return (
    typeof data.profile_type === 'string' &&
    typeof data.display_name === 'string' &&
    data.display_name.length > 0
  );
}
