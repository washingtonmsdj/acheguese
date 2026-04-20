/**
 * ProfileActivityRecords — Read models para atividade do usuário
 *
 * Tipos que representam registros de atividade do perfil:
 * likes, saves e votos em enquetes.
 *
 * Casos de uso:
 * - useUserActivity (timeline de atividade)
 * - ActivityTimeline (componente de exibição)
 *
 * Estes tipos descrevem o shape retornado pelo ProfileService
 * para consultas de atividade — não são entidades de domínio.
 *
 * @version 1.0.0
 */

// ── Tipos auxiliares ──────────────────────────────────────────────────────

interface ActivityAuthorSummary {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface ActivityPostSummary {
  id: string;
  type: string | null;
  content: string | null;
  author: ActivityAuthorSummary | null;
}

interface ActivityPollOptionRecord {
  id: string;
  text: string | null;
}

interface ActivityPollSummary {
  id: string;
  question: string | null;
  options: ActivityPollOptionRecord[] | null;
  post_id: string | null;
}

// ── Read models públicos ──────────────────────────────────────────────────

/**
 * Registro de like em post
 */
export interface ProfileLikeActivityRecord {
  id: string;
  created_at: string;
  post: ActivityPostSummary | null;
}

/**
 * Registro de post salvo
 */
export interface ProfileSaveActivityRecord {
  id: string;
  created_at: string;
  post: ActivityPostSummary | null;
}

/**
 * Registro de voto em enquete
 */
export interface ProfilePollVoteActivityRecord {
  id: string;
  option_id: string;
  created_at: string;
  poll: ActivityPollSummary | null;
}
