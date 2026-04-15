/**
 * Core Auth Module
 *
 * Exports públicos do módulo de autenticação
 */

// Services
export { AuthService, authService } from "./services";
export type {
  AuthUser,
  AuthSession,
  SignUpData,
  SignInData,
  AuthResult,
} from "./services";
export { AuthError } from "./services";

// Hooks
export { useAuth, useUser, useSession } from "./hooks";
