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

  if (
    /invalid login credentials/i.test(errorMessage) ||
    /user not found/i.test(errorMessage) ||
    /invalid email/i.test(errorMessage)
  ) {
    return "Email, usuario ou senha incorretos.";
  }

  if (/email not confirmed/i.test(errorMessage)) {
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
  }

  if (/over email rate limit/i.test(errorMessage)) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }

  if (/error sending confirmation email/i.test(errorMessage)) {
    return "Nao foi possivel enviar o email de confirmacao agora. Tente novamente em instantes.";
  }

  if (/user already registered/i.test(errorMessage)) {
    return "Este e-mail ja esta cadastrado. Tente fazer login ou recuperar sua senha.";
  }

  if (/same password/i.test(errorMessage)) {
    return "Escolha uma senha diferente da atual.";
  }

  return errorMessage || fallback;
}
