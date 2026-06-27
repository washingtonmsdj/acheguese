/**
 * SessionProfileView — Dados de perfil para a sessão ativa
 * 
 * Usado em SessionData para representar o perfil ativo e a lista de perfis
 * disponíveis para o usuário. Contém campos de localização e estado de sessão
 * que ProfileSummary não inclui.
 * 
 * ⚠️ NÃO usar fora do contexto de sessão.
 * Para feeds e listas genéricas, usar ProfileSummary.
 * 
 * Naming: camelCase (shape de domínio, não shape do banco).
 * 
 * @version 1.0.0
 */

export interface SessionProfileView {
  /** ID do perfil */
  id: string;
  
  /** ID do usuário dono */
  userId: string;
  
  /**
   * Nome público preferido de exibição
   * Normalizado: display_name ?? name
   */
  displayName: string;
  
  /**
   * Campo base obrigatório no banco
   * Mantido para compatibilidade com código legado
   */
  name: string;
  
  /**
   * Identificador canônico para URL e @mention
   * Nullable — perfis legados podem não ter
   */
  username: string | null;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** Biografia */
  bio: string | null;
  
  /** Tipo de perfil */
  profileType: string;
  
  /** Cidade (snapshot territorial) */
  city: string | null;
  
  /** Bairro (snapshot territorial) */
  neighborhood: string | null;
  
  /** Estado (snapshot territorial) */
  state: string | null;

  /** Rua (snapshot territorial, quando o usuário permite escopo de rua) */
  street: string | null;
  
  /** Telefone */
  phone: string | null;
  
  /** WhatsApp */
  whatsapp: string | null;
  
  /** FK para locations */
  locationId: string | null;
  
  /** Se o perfil está ativo */
  isActive: boolean;
  
  /** Se o perfil foi verificado */
  verified: boolean;
  
  /** Data/hora de criação */
  createdAt: string;
}

