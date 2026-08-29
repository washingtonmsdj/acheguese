/**
 * Authentication Service Types
 *
 * Tipos TypeScript para o serviço de autenticação.
 * Identidade runtime deriva do contrato canônico de core/session.
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
  username?: string;
  handle?: string; // handle desejado para o perfil personal
  display_name?: string; // nome de exibição (fallback: name)
  // Localização — strings legíveis para exibição
  city?: string;
  neighborhood?: string;
  state?: string;
  street?: string;
  // UUID canônico do bairro (tabela locations) — SSOT territorial
  neighborhood_id?: string;
  termsAcceptance: TermsAcceptance;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignInWithUsernameData {
  username: string;
  password: string;
}

/**
 * Custom error class for authentication errors
 */
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
