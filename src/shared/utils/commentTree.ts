/**
 * Utilitários para construir árvore de comentários
 *
 * Requirement 6: Sistema de Comentários
 * Requirement 16: Estrutura de Comentários (recursiva)
 */

export interface Comment {
  id: string;
  post_id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  likes_count: number;
  is_liked?: boolean;
  replies?: Comment[];
  depth: number;
}

/**
 * Construir árvore de comentários a partir de lista flat
 *
 * Requirement 6: Sistema de Comentários
 * Requirement 16: Estrutura recursiva (máximo 5 níveis)
 *
 * Algoritmo:
 * 1. Separar comentários top-level (parent_comment_id === null)
 * 2. Para cada comentário, search suas replies recursivamente
 * 3. Limitar profundidade máxima a 5 níveis
 */
export function buildCommentTree(
  comments: Comment[],
  maxDepth: number = 5,
): Comment[] {
  // Criar mapa de comentários por ID para acesso rápido
  const commentMap = new Map<string, Comment>();
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [], depth: 0 });
  });

  // Separar comentários top-level
  const topLevelComments: Comment[] = [];

  // Construir árvore
  comments.forEach((comment) => {
    const commentNode = commentMap.get(comment.id);
    if (!commentNode) return;

    if (comment.parent_comment_id === null) {
      // Comentário top-level
      topLevelComments.push(commentNode);
    } else {
      // Reply - add ao parent
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent && parent.depth < maxDepth - 1) {
        commentNode.depth = parent.depth + 1;
        parent.replies = parent.replies || [];
        parent.replies.push(commentNode);
      }
    }
  });

  return topLevelComments;
}

/**
 * Contar total de comentários (incluindo replies)
 */
export function countTotalComments(comments: Comment[]): number {
  let total = 0;

  function countRecursive(comments: Comment[]) {
    comments.forEach((comment) => {
      total++;
      if (comment.replies && comment.replies.length > 0) {
        countRecursive(comment.replies);
      }
    });
  }

  countRecursive(comments);
  return total;
}

/**
 * Verificar se comentário pode ser editado
 *
 * Requirement 6: Sistema de Comentários
 * - Autor pode edit comentário dentro de 24h
 */
export function canEditComment(
  commentCreatedAt: string,
  currentUserId: string,
  commentAuthorId: string,
): boolean {
  // Verificar se é o autor
  if (currentUserId !== commentAuthorId) {
    return false;
  }

  // Verificar se está dentro de 24h
  const createdAt = new Date(commentCreatedAt);
  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / 3600000;

  return diffHours < 24;
}
