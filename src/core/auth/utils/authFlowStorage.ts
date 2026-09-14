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

function removeStoredValue(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Limpeza é best-effort quando o navegador bloqueia storage.
  }
}

/**
 * Armazena apenas contexto efêmero do fluxo de autenticação.
 *
 * O envelope versionado e com expiração é o único formato aceito. Valores
 * antigos, corrompidos ou sem TTL são descartados em vez de contaminarem uma
 * jornada nova. Compatibilidade transitória com o formato legado foi removida:
 * dados antigos não são promovidos nem reinterpretados. Credenciais e outros
 * dados sensíveis nunca pertencem a esta API.
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
    if (!isEnvelope(parsed) || parsed.expiresAt <= Date.now()) {
      removeStoredValue(storage, key);
      return null;
    }

    return parsed.value;
  } catch {
    removeStoredValue(storage, key);
    return null;
  }
}

export function clearAuthFlowSessionValue(key: string): void {
  const storage = getSessionStorage();
  if (!storage) return;
  removeStoredValue(storage, key);
}
