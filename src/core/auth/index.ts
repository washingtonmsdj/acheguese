/**
 * Core Auth Module
 *
 * Exports públicos do módulo de autenticação.
 * Estado de sessão/perfil pertence a core/session.
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
export { useAuth } from "./hooks";
