import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";

describe("getAuthErrorMessage", () => {
  it("returns the provided fallback for unknown non-object errors", () => {
    expect(getAuthErrorMessage(null, "Falha genérica")).toBe("Falha genérica");
    expect(getAuthErrorMessage("erro solto", "Falha genérica")).toBe("Falha genérica");
  });

  it("maps invalid credential variants to the canonical PT-BR message", () => {
    expect(getAuthErrorMessage({ message: "invalid login credentials" })).toBe(
      "E-mail, usuário ou senha incorretos.",
    );
    expect(getAuthErrorMessage({ message: "user not found" })).toBe(
      "E-mail, usuário ou senha incorretos.",
    );
    expect(getAuthErrorMessage({ message: "invalid email" })).toBe(
      "E-mail, usuário ou senha incorretos.",
    );
  });

  it("maps confirmation and rate-limit auth failures to friendly guidance", () => {
    expect(getAuthErrorMessage({ message: "email not confirmed" })).toBe(
      "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
    );
    expect(getAuthErrorMessage({ message: "over email rate limit" })).toBe(
      "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    );
    expect(getAuthErrorMessage({ message: "error sending confirmation email" })).toBe(
      "Não foi possível enviar o e-mail de confirmação agora. Tente novamente em instantes.",
    );
  });

  it("maps known account-state failures and preserves unknown upstream messages", () => {
    expect(getAuthErrorMessage({ message: "user already registered" })).toBe(
      "Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.",
    );
    expect(getAuthErrorMessage({ message: "same password" })).toBe(
      "Escolha uma senha diferente da atual.",
    );
    expect(getAuthErrorMessage({ message: "Erro inesperado do provedor" })).toBe(
      "Erro inesperado do provedor",
    );
  });
});
