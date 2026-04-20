/**
 * ProfileSummary — Read Model para Listas
 * 
 * Usado em feeds, comentários, listas de usuários.
 * Contém apenas dados não-sensíveis e públicos.
 * 
 * Casos de uso:
 * - Lista de autores em feed de posts
 * - Lista de comentadores
 * - Busca de usuários
 * - Menções em chat
 * 
 * @version 2.0.0
 */

/**
 * ProfileSummary — Read Model Mínimo
 * 
 * Shape de domínio (camelCase), não shape do banco.
 */
export interface ProfileSummary {
  /** ID do perfil */
  id: string;
  
  /** Nome de exibição */
  displayName: string;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** Se o perfil é verificado */
  verified: boolean;
}

/**
 * ProfileSummaryExtended — Read Model com Dados Adicionais
 * 
 * Usado quando ProfileSummary não é suficiente.
 * Adiciona informações de localização e contato.
 */
export interface ProfileSummaryExtended extends ProfileSummary {
  /** Username para @mentions */
  username: string | null;
  
  /** Bairro */
  neighborhood: string | null;
  
  /** WhatsApp */
  whatsapp: string | null;
}

/**
 * Cria um ProfileSummary a partir de dados parciais
 */
export function createProfileSummary(data: {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  verified?: boolean;
}): ProfileSummary {
  return {
    id: data.id,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl ?? null,
    verified: data.verified ?? false,
  };
}
