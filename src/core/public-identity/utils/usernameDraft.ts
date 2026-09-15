const PUBLIC_USERNAME_MAX_LENGTH = 30;

/**
 * Normalização leve para campos editáveis de @usuário.
 *
 * Esta função pertence à identidade pública e só prepara o rascunho visual:
 * disponibilidade, nomes reservados e unicidade continuam sob as policies/
 * adapters do PublicIdentityService e sob a autoridade do backend.
 */
export function normalizePublicUsernameDraft(value: string): string {
  return value
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, PUBLIC_USERNAME_MAX_LENGTH);
}
