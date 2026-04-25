/**
 * Utilitários genéricos para manipulação de texto
 *
 * Funções puras sem dependências de domínio
 */

/**
 * Formatar timestamp em formato relativo
 *
 * Exemplos:
 * - "agora"
 * - "há 10 minutos"
 * - "há 2 horas"
 * - "há 3 dias"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffSeconds < 60) return "agora";
  if (diffMinutes === 1) return "há 1 minuto";
  if (diffMinutes < 60) return `há ${diffMinutes} minutos`;
  if (diffHours === 1) return "há 1 hora";
  if (diffHours < 24) return `há ${diffHours} horas`;
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffWeeks === 1) return "há 1 semana";
  if (diffWeeks < 4) return `há ${diffWeeks} semanas`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

/**
 * Sanitizar conteúdo HTML para prevenir XSS
 *
 * - Sanitizar HTML em posts e comentários
 * - Prevenir XSS (Cross-Site Scripting)
 * - Escapar caracteres especiais
 * - Remover scripts maliciosos
 */
export function sanitizeContent(content: string): string {
  if (!content) return "";

  // Remove tags HTML e escapa caracteres especiais
  let sanitized = content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Remove tentativas de injeção de script
  sanitized = sanitized
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<script/gi, "&lt;script")
    .replace(/<\/script>/gi, "&lt;/script&gt;")
    .replace(/<iframe/gi, "&lt;iframe")
    .replace(/<object/gi, "&lt;object")
    .replace(/<embed/gi, "&lt;embed");

  return sanitized;
}

/**
 * Validar e sanitizar URLs para prevenir links maliciosos
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  // Remove espaços e caracteres de controle
  // eslint-disable-next-line no-control-regex
  const trimmed = url.trim();
  let cleaned = "";
  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    const isControl = (code >= 0 && code <= 31) || code === 127;
    if (!isControl) {
      cleaned += trimmed.charAt(i);
    }
  }

  // Valida protocolo seguro
  const allowedProtocols = ["http:", "https:"];
  try {
    const urlObj = new URL(cleaned);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return "";
    }
    return cleaned;
  } catch {
    // URL inválida
    return "";
  }
}

/**
 * Validar conteúdo de post antes de envio
 */
export function validatePostContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "O conteúdo não pode estar vazio" };
  }

  const trimmed = content.trim();

  if (trimmed.length < 20) {
    return {
      valid: false,
      error: "O conteúdo deve ter no mínimo 20 caracteres",
    };
  }

  if (trimmed.length > 2000) {
    return {
      valid: false,
      error: "O conteúdo deve ter no máximo 2000 caracteres",
    };
  }

  return { valid: true };
}

/**
 * Validar conteúdo de comentário antes de envio
 */
export function validateCommentContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "O comentário não pode estar vazio" };
  }

  const trimmed = content.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: "O comentário não pode estar vazio" };
  }

  if (trimmed.length > 1000) {
    return {
      valid: false,
      error: "O comentário deve ter no máximo 1000 caracteres",
    };
  }

  return { valid: true };
}

/**
 * Calcular engagement de um post
 *
 * Engagement = likes + comentários
 */
export function calculateEngagement(
  likesCount: number,
  commentsCount: number,
): number {
  return likesCount + commentsCount;
}
