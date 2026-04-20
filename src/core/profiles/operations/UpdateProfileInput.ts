/**
 * UpdateProfileInput — Input de Atualização de Perfil
 * 
 * Usado para atualizar perfis existentes.
 * Todos os campos são opcionais (partial update).
 * 
 * @version 2.0.0
 */

/**
 * UpdateProfileInput — Input de Atualização
 * 
 * Dados que podem ser atualizados em um perfil.
 * Todos os campos são opcionais.
 */
export interface UpdateProfileInput {
  /** Nome de exibição */
  display_name?: string;
  
  /** Username para @mentions */
  username?: string;
  
  /** Biografia */
  bio?: string;
  
  /** URL do avatar */
  avatar_url?: string;
  
  /** URL da capa */
  cover_url?: string;
  
  /** ID da localização */
  location_id?: string;
  
  /** Telefone */
  phone?: string;
  
  /** WhatsApp */
  whatsapp?: string;
  
  /** Se o perfil está ativo */
  is_active?: boolean;
  
  /** Metadata adicional */
  metadata?: Record<string, unknown>;
}

/**
 * UpdateProfileAdminInput — Input de Atualização Admin
 * 
 * Campos adicionais que apenas admins podem atualizar.
 */
export interface UpdateProfileAdminInput extends UpdateProfileInput {
  /** Pontuação de reputação */
  reputation?: number;
  
  /** Se o perfil está suspenso */
  is_suspended?: boolean;
  
  /** Data/hora até quando a suspensão é válida */
  suspended_until?: string | null;
  
  /** Motivo da suspensão */
  suspension_reason?: string | null;
  
  /** Se o perfil é verificado */
  verified?: boolean;
  
  /** Data/hora da verificação */
  verified_at?: string | null;
}

/**
 * Valida se o input de atualização é válido
 */
export function validateUpdateProfileInput(
  input: unknown
): input is UpdateProfileInput {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  
  // Pelo menos um campo deve estar presente
  const data = input as Partial<UpdateProfileInput>;
  const hasAtLeastOneField = Object.keys(data).length > 0;
  
  return hasAtLeastOneField;
}
