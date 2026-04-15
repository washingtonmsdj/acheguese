/**
 * Tipos do módulo Q&A — perguntas e respostas da comunidade
 *
 * Backend: community_questions (type='question') com location_id NOT NULL
 */

export interface CommunityQuestion {
  id: string;
  titulo: string;
  description: string;
  category: string;
  respostas_count: number;
  resolved: boolean;
  created_at: string;
  autor_id: string;
  /** Território canônico da pergunta — obrigatório para filtro territorial */
  location_id?: string;
  location?: { id: string; name: string; type?: string } | null;
  autor?: {
    id: string;
    name: string;
    avatar_url: string;
  } | null;
}

export interface CommunityAnswer {
  id: string;
  question_id: string;
  texto: string;
  curtidas: number;
  melhor_resposta: boolean;
  created_at: string;
  autor_id: string;
  professional_id?: string | null;
  business_id?: string | null;
  autor?: {
    id: string;
    name: string;
    avatar_url: string;
  } | null;
  professional?: {
    id: string;
    name: string;
    service: string;
    rating: number;
  } | null;
  business?: {
    id: string;
    name: string;
    category: string;
    slug?: string;
    neighborhood?: string;
  } | null;
  liked?: boolean;
}

export interface CreateAnswerInput {
  question_id: string;
  autor_id: string;
  texto: string;
  professional_id?: string | null;
  business_id?: string | null;
}

export interface CreateQuestionInput {
  autor_id: string;
  titulo: string;
  description: string;
  category: string;
  /** Território canônico — obrigatório. UUID de city ou district. */
  location_id: string;
}

export interface QuestionFilters {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  /** Filtro territorial — UUID de city ou district */
  location_id?: string;
  /** Filtro territorial por grupo — array de UUIDs */
  location_ids?: string[];
}

export interface AnswerLike {
  id: string;
  answer_id: string;
  user_id: string;
  created_at: string;
}

export interface MentionResult {
  id: string;
  name: string;
  type: "professional" | "business";
  category?: string;
  service?: string;
  rating?: number;
  slug?: string;
  neighborhood?: string;
}
