export function getAuthErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel concluir a operacao. Tente novamente.",
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const errorMessage =
    "message" in error && typeof error.message === "string"
      ? error.message
      : fallback;

  if (/invalid login credentials/i.test(errorMessage)) {
    return "Email, usuario ou senha incorretos.";
  }

  if (/email not confirmed/i.test(errorMessage)) {
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
  }

  if (/user not found/i.test(errorMessage)) {
    return "Usuario nao encontrado.";
  }

  if (/over email rate limit/i.test(errorMessage)) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }

  if (/invalid email/i.test(errorMessage)) {
    return "Email invalido.";
  }

  if (/same password/i.test(errorMessage)) {
    return "Escolha uma senha diferente da atual.";
  }

  return errorMessage || fallback;
}
