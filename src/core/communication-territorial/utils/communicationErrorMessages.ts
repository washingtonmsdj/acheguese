function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

const ERROR_MESSAGE_MAP: Array<{ match: string; message: string }> = [
  { match: "authentication_required", message: "Voce precisa estar autenticado para concluir esta acao." },
  { match: "admin_required", message: "Apenas administradores podem executar esta acao." },
  { match: "channel_member_required", message: "Voce nao tem permissao de operacao neste canal." },
  { match: "channel_not_active", message: "O canal ainda nao esta ativo para publicacao." },
  { match: "requested_location_id_required", message: "Selecione um territorio valido para continuar." },
  { match: "requested_profile_not_owned", message: "O perfil informado nao pertence ao usuario autenticado." },
  { match: "request_not_found", message: "Solicitacao nao encontrada." },
  { match: "request_already_reviewed", message: "Esta solicitacao ja foi analisada anteriormente." },
  {
    match: "request_not_found_or_already_reviewed",
    message: "Solicitacao inexistente ou ja analisada anteriormente.",
  },
  {
    match: "location_not_authorized_for_channel",
    message: "Este canal nao possui permissao para publicar no territorio selecionado.",
  },
  {
    match: "publication_type_not_allowed_in_mvp",
    message: "Tipo de publicacao indisponivel no MVP atual.",
  },
  {
    match: "content_format_not_allowed",
    message: "Formato de consumo indisponivel para publicacao.",
  },
  { match: "publication_not_found", message: "Publicacao nao encontrada." },
  { match: "only_draft_can_be_edited", message: "Apenas rascunhos podem ser editados." },
  {
    match: "communication_channel_territories_unique_location",
    message: "Este territorio ja esta vinculado ao canal.",
  },
  {
    match: "duplicate key value violates unique constraint",
    message: "Registro duplicado para esta operacao.",
  },
];

export function getCommunicationErrorMessage(error: unknown, fallback: string): string {
  const raw = extractErrorMessage(error);
  const normalized = raw.toLowerCase();

  for (const item of ERROR_MESSAGE_MAP) {
    if (normalized.includes(item.match)) {
      return item.message;
    }
  }

  return raw || fallback;
}
