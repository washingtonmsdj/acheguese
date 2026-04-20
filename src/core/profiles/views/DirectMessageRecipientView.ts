/**
 * DirectMessageRecipientView — Dados do destinatário de mensagem direta
 * 
 * Usado em useMessageModal e DirectMessageModal para exibir o destinatário
 * no header do modal de mensagem direta.
 * 
 * ⚠️ NÃO usar fora do contexto de mensagem direta.
 * Para feeds e listas genéricas, usar ProfileSummary.
 * 
 * Naming: camelCase (shape de domínio, não shape do banco).
 * 
 * Nota: profileService.getProfileById() retorna row do banco (snake_case).
 * O hook useMessageModal deve mapear para este tipo ao consumir o service.
 * 
 * @version 1.0.0
 */

export interface DirectMessageRecipientView {
  /** ID do perfil */
  id: string;
  
  /**
   * Nome para exibição no header do modal
   * Normalizado: display_name ?? name
   */
  displayName: string;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** Se o perfil foi verificado (exibe badge de verificação) */
  verified: boolean;
}
