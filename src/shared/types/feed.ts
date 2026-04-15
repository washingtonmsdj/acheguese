/**
 * Feed Types
 *
 * Tipos para o sistema de feed social.
 * Usa namenclatura moderna com objeto 'author' aninhado.
 */

export type ProfileType = "personal" | "business" | "company" | "service";

export type PostCategory =
  | "alerta"
  | "evento"
  | "promoção"
  | "dica"
  | "segurança"
  | "aviso"
  | "pergunta"
  | "compra_venda"
  | "achados_perdidos"
  | "animais"
  | "transito";

export interface Author {
  id: string;
  name: string;
  avatar: string;
  type: ProfileType;
  neighborhood?: string;
}

export interface Post {
  id: string;
  content: string;
  category: PostCategory;
  hashtags: string[];
  image_url?: string;
  created_at: string;

  // Localização (apenas para posts normais, não alertas)
  latitude?: number;
  longitude?: number;

  // Alertas têm expiração
  expires_at?: string;
  hidden?: boolean;

  // Autor do post
  author: Author;

  // Interações
  liked: boolean;
  likes_count: number;
  comments_count: number;

  // Flag para posts mock (desenvolvimento)
  isMock?: boolean;
}

export interface CreatePostInput {
  author_profile_id: string;
  texto: string;
  category: PostCategory;
  hashtags?: string[];
  image_url?: string;
  latitude?: number;
  longitude?: number;
  expires_at?: string;
}

export interface PostFilters {
  category?: PostCategory | "todos";
  sort?: "recentes" | "populares";
}
