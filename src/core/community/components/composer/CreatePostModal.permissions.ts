export type CreatePostIntentId =
  | "discussao"
  | "pergunta"
  | "enquete"
  | "recomendacao"
  | "aviso_comunitario"
  | "alerta_urgente"
  | "reportar_problema"
  | "oportunidade"
  | "classificado"
  | "promocao"
  | "servico"
  | "evento"
  | "mutirao"
  | "encontro";

export const DEFAULT_BLOCKED_POST_MESSAGE = "Publicar exige acesso comunitario valido.";
export const DEFAULT_BLOCKED_ALERT_MESSAGE =
  "Criar alerta exige participacao ativa e residencia verificada neste territorio.";
export const DEFAULT_BLOCKED_ISSUE_MESSAGE =
  "Reportar problema exige participacao ativa e residencia verificada neste territorio.";

export function resolveCreatePostPublicationPermissionError({
  intent,
  canCreatePost,
  canCreateAlert,
  canCreateIssue,
  blockedPostMessage = DEFAULT_BLOCKED_POST_MESSAGE,
  blockedAlertMessage = DEFAULT_BLOCKED_ALERT_MESSAGE,
  blockedIssueMessage = DEFAULT_BLOCKED_ISSUE_MESSAGE,
}: {
  intent: CreatePostIntentId;
  canCreatePost: boolean;
  canCreateAlert: boolean;
  canCreateIssue: boolean;
  blockedPostMessage?: string;
  blockedAlertMessage?: string;
  blockedIssueMessage?: string;
}): string | null {
  if (intent === "alerta_urgente" && !canCreateAlert) return blockedAlertMessage;
  if (intent === "reportar_problema" && !canCreateIssue) return blockedIssueMessage;
  if (!canCreatePost) return blockedPostMessage;
  return null;
}
