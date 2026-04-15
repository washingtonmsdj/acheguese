/**
 * PublicProfile - Identidade pública
 *
 * Representa dados seguros para exibição pública.
 * NÃO expõe dados sensíveis do usuário.
 */
export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  reputation_score: number;
}
