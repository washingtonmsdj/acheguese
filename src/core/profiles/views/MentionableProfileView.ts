/**
 * MentionableProfileView — Dados de perfil para busca de @mentions
 * 
 * Usado em MentionInput para exibir resultados de busca de perfis
 * que podem ser mencionados em posts. Inclui neighborhood e profileType
 * para filtro e exibição contextual.
 * 
 * ⚠️ NÃO usar fora do contexto de @mention.
 * Para feeds e listas genéricas, usar ProfileSummary.
 * 
 * Naming: camelCase (shape de domínio, não shape do banco).
 * 
 * Nota: profileService.searchProfilesByName() retorna rows do banco (snake_case).
 * O componente MentionInput deve mapear para este tipo ao consumir o service.
 * 
 * @version 1.0.0
 */

export interface MentionableProfileView {
  /** ID do perfil */
  id: string;
  
  /**
   * Nome para exibição nos resultados de busca
   * Normalizado: display_name ?? name
   */
  displayName: string;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** Bairro — exibido como contexto geográfico na busca */
  neighborhood: string | null;
  
  /**
   * Tipo de perfil — usado para exibir badge "Empresa" etc.
   * Valores: 'personal' | 'business' | 'professional' | 'driver'
   */
  profileType: string | null;
}
