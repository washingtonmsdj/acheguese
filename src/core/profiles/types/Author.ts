/**
 * Author - Quem assina conteúdo
 *
 * Representa a identidade de quem cria conteúdo no sistema.
 * Usado em posts, comments, reviews.
 */
export interface Author {
  profile_id: string;
  display_name: string;
  avatar_url?: string;
}
