/**
 * Authentication Service Types
 *
 * Tipos TypeScript para o serviço de autenticação
 */

import type { TermsAcceptance } from "@/core/legal/termsOfService";

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

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

export interface AuthResult {
  user: AuthUser;
  session: AuthSession;
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
