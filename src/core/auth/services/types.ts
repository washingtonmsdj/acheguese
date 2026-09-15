/**
 * Tipos públicos da autenticação.
 *
 * O cadastro inicial cria somente a conta + perfil pessoal. Localização e
 * demais atributos de perfil pertencem ao primeiro acesso/ProfileService.
 */

import type { TermsAcceptance } from "@/core/legal/termsOfService";
import type { User as SessionUser } from "@/core/session/types";

export type AuthUser = Pick<
  SessionUser,
  "id" | "email" | "emailConfirmed"
>;

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  /** Identificador público desejado para o perfil pessoal criado no signup. */
  handle?: string;
  termsAcceptance: TermsAcceptance;
  /** Token anti-bot emitido pelo Turnstile quando o gate está habilitado. */
  captchaToken?: string;
}

export interface SignInData {
  email: string;
  password: string;
  /** Token anti-bot emitido pelo Turnstile quando o gate está habilitado. */
  captchaToken?: string;
}

export interface SignInWithUsernameData {
  username: string;
  password: string;
  /** Token anti-bot repassado ao broker público de login por @usuário. */
  captchaToken?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
