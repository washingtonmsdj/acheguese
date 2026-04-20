/**
 * Author — Read Model para Autoria
 * 
 * Usado em posts, comentários, reviews, mensagens.
 * Representa o autor de um conteúdo.
 * 
 * Casos de uso:
 * - Exibir autor de post
 * - Exibir autor de comentário
 * - Exibir autor de review
 * - Exibir remetente de mensagem
 * 
 * @version 2.0.0
 */

/**
 * Author — Read Model para Autoria
 * 
 * Informações mínimas sobre o autor de um conteúdo.
 */
export interface Author {
  /** ID do perfil autor */
  id: string;
  
  /** Nome de exibição */
  name: string;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** Se o perfil é verificado */
  verified: boolean;
}

/**
 * AuthorExtended — Read Model com Dados Adicionais
 * 
 * Usado quando Author não é suficiente.
 * Adiciona username e localização.
 */
export interface AuthorExtended extends Author {
  /** Username para @mentions */
  username: string | null;
  
  /** Bairro */
  neighborhood: string | null;
  
  /** Cidade */
  city: string | null;
}

/**
 * Cria um Author a partir de dados parciais
 */
export function createAuthor(data: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
}): Author {
  return {
    id: data.id,
    name: data.name,
    avatarUrl: data.avatarUrl ?? null,
    verified: data.verified ?? false,
  };
}
