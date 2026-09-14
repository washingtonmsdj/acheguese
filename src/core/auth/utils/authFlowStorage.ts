interface AuthFlowStorageEnvelope {
  version: 1;
  value: string;
  expiresAt: number;
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isEnvelope(value: unknown): value is AuthFlowStorageEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthFlowStorageEnvelope>;
  return (
    candidate.version === 1 &&
    typeof candidate.value === "string" &&
    typeof candidate.expiresAt === "number" &&
    Number.isFinite(candidate.expiresAt)
  );
}

/**
 * Armazena contexto efêmero do fluxo de autenticação.
 *
 * O envelope inclui expiração para impedir que uma tentativa antiga de login,
 * OAuth ou cadastro contamine uma jornada nova na mesma aba. Nada sensível ou
 * credencial deve ser salvo por esta API.
 */
export function setAuthFlowSessionValue(
  key: string,
  value: string,
  ttlMs: number,
): void {
  const storage = getSessionStorage();
  if (!storage) return;

  const envelope: AuthFlowStorageEnvelope = {
    version: 1,
    value,
    expiresAt: Date.now() + ttlMs,
  };

  try {
    storage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Fluxos de auth continuam funcionando sem persistência efêmera quando o
    // navegador bloqueia storage (modo privado/política corporativa/etc.).
  }
}

export function getAuthFlowSessionValue(key: string): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isEnvelope(parsed)) {
      // Compatibilidade transitória com o formato legado em string pura.
      return raw;
    }

    if (parsed.expiresAt <= Date.now()) {
      storage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    // Strings legadas não eram JSON. Elas continuam legíveis durante a migração
    // e serão substituídas pelo envelope na próxima escrita.
    return raw;
  }
}

export function clearAuthFlowSessionValue(key: string): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Limpeza é best-effort; não deve quebrar logout/login por storage bloqueado.
  }
}
