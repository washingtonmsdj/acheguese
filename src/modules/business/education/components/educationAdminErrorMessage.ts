const AUTHORIZATION_HINTS = [
  "permission denied",
  "not authorized",
  "unauthorized",
  "forbidden",
  "row-level security",
  "rls",
];

const CONNECTIVITY_HINTS = [
  "failed to fetch",
  "network",
  "networkerror",
  "timeout",
  "timed out",
  "connection",
];

function normalizeErrorHint(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

/**
 * Converts infrastructure failures into a small, safe user-facing vocabulary.
 * Raw backend/Supabase error text must never cross into the rendered UI.
 */
export function getEducationAdminReadErrorMessage(error: unknown): string {
  const hint = normalizeErrorHint(error);

  if (AUTHORIZATION_HINTS.some((token) => hint.includes(token))) {
    return "Sua conta não tem permissão para consultar estes dados de Educação.";
  }

  if (CONNECTIVITY_HINTS.some((token) => hint.includes(token))) {
    return "Não foi possível conectar ao serviço de Educação. Verifique a conexão e tente novamente.";
  }

  return "Não foi possível carregar os dados de Educação agora. Tente novamente.";
}
