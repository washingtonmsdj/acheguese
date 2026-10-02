import { APP_PATHS } from "@/core/routing/config/appPaths";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { messagingRoutes } from "@/core/messaging/routes/messagingRoutes";

const AUTH_REQUIRED_RUNTIME_PREFIXES = [
  ACCOUNT_PATHS.home,
  messagingRoutes.inbox(),
  "/central",
] as const;

const AUTH_REQUIRED_RUNTIME_EXACT_PATHS = new Set<string>([
  APP_PATHS.notifications,
  APP_PATHS.emailLogs,
  "/empresas/cadastrar",
]);

function normalizePathname(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function isSameOrDescendantPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

/**
 * Bootstrap hint for routes that are already protected by their canonical
 * route guards.
 *
 * This is not an authorization boundary. ProtectedRoute/CentralAccessGuard
 * remain the final authority. The sole purpose of this matcher is to let an
 * anonymous browser resolve to Login before downloading profile/territory
 * runtime that cannot be used without an authenticated session.
 *
 * A missing entry here degrades only startup performance: the canonical guard
 * still runs later and remains fail-closed.
 */
export function requiresPreContextAuthentication(pathname: string): boolean {
  const normalized = normalizePathname(pathname);

  if (AUTH_REQUIRED_RUNTIME_EXACT_PATHS.has(normalized)) {
    return true;
  }

  return AUTH_REQUIRED_RUNTIME_PREFIXES.some((basePath) =>
    isSameOrDescendantPath(normalized, basePath),
  );
}
