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
    /gateway timeout/i.test(errorMessage) ||
    /connection timeout/i.test(errorMessage) ||
    /timed out/i.test(errorMessage) ||
    /timeout/i.test(errorMessage) ||
    /failed to fetch/i.test(errorMessage) ||
    /networkerror/i.test(errorMessage) ||
    /network request failed/i.test(errorMessage) ||
    /load failed/i.test(errorMessage)
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

  if (/email not confirmed/i.test(errorMessage)) {
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
