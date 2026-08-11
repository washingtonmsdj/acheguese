/**
 * Tipos de Poll para camada de UI
 *
 * Este arquivo define o shape de Poll para componentes de renderização
 * (PollCard, usePollVote, modais). Inclui campos de estado de UI como
 * user_voted, user_vote_option_id e percentage.
 *
 * Separação intencional:
 * - src/shared/types/poll.ts  → shape de UI (estado de votação, percentuais)
 * - src/core/posts/types.ts   → shape de domínio (post_id, opções do banco)
 */

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  total_votes: number;
  expires_at: string; // Campo correto do banco
  ends_at?: string; // Compatibilidade retroativa
  user_voted: boolean;
  user_vote_option_id?: string;
}

export interface PollVoteRequest {
  poll_id: string;
  option_id: string;
}

export interface PollVoteResponse {
  success: boolean;
  updated_poll: Poll;
}
