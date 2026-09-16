function getAuthErrorDetails(error: unknown): {
  message: string;
  code: string;
  status: number | null;
} {
  if (!error || typeof error !== "object") {
    return { message: "", code: "", status: null };
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  const code =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const rawStatus =
    "status" in error
      ? error.status
      : "statusCode" in error
        ? error.statusCode
        : null;
  const status = typeof rawStatus === "number" ? rawStatus : null;

  return { message, code, status };
}

export function isAuthRateLimitError(error: unknown): boolean {
  const { message, code, status } = getAuthErrorDetails(error);
  if (status === 429) return true;

  const signal = `${code} ${message}`;
  return (
    /over[_\s-]*email[_\s-]*send[_\s-]*rate[_\s-]*limit/i.test(signal) ||
    /over[_\s-]*email[_\s-]*rate[_\s-]*limit/i.test(signal) ||
    /rate[_\s-]*limit/i.test(signal) ||
    /too many requests/i.test(signal)
  );
}

/**
 * Identifies failures where the Auth gateway/service did not complete the
 * request. These errors are operational and must not be presented as bad
 * credentials.
 */
export function isAuthServiceUnavailableError(error: unknown): boolean {
  const { message, status } = getAuthErrorDetails(error);
  if (status !== null && (status === 408 || status >= 500)) return true;

  return /gateway timeout|connection timeout|timed out|timeout|failed to fetch|networkerror|network request failed|load failed/i.test(
    message,
  );
}

export function isEmailNotConfirmedError(error: unknown): boolean {
  const { message, code } = getAuthErrorDetails(error);
  const signal = `${code} ${message}`;
  return /email[_\s-]*not[_\s-]*confirmed/i.test(signal);
}

export function isRecoverySessionDisposalError(error: unknown): boolean {
  return getAuthErrorDetails(error).code === "RECOVERY_SESSION_DISPOSAL_FAILED";
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação. Tente novamente.",
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const { message: rawMessage } = getAuthErrorDetails(error);
  const errorMessage = rawMessage || fallback;

  if (
    isAuthServiceUnavailableError(error) ||
    /^\s*(?:\{\}|\[object Object\]|error:\s*\{\})\s*$/i.test(errorMessage)
  ) {
    return "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.";
  }

  if (
    /invalid login credentials/i.test(errorMessage) ||
    /user not found/i.test(errorMessage) ||
    /invalid email/i.test(errorMessage)
  ) {
    return "E-mail, usuário ou senha incorretos.";
  }

  if (isEmailNotConfirmedError(error)) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }

  if (isAuthRateLimitError(error)) {
    return "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";
  }

  if (/error sending confirmation email/i.test(errorMessage)) {
    return "Não foi possível enviar o e-mail de confirmação agora. Tente novamente em instantes.";
  }

  if (/user already registered/i.test(errorMessage)) {
    return "Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.";
  }

  if (/same password/i.test(errorMessage)) {
    return "Escolha uma senha diferente da atual.";
  }

  return errorMessage || fallback;
}
