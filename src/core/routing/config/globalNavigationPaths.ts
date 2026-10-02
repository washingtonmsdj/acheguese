import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { messagingRoutes } from "@/core/messaging";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { APP_PATHS } from "@/core/routing/config/appPaths";

/**
 * Canonical global navigation destinations for presentation components.
 *
 * Shared components receive these values as data and never import Core.
 */
export const GLOBAL_NAV_PATHS = {
  home: APP_PATHS.home,
  territorySwitch: `${APP_PATHS.home}?trocar=territorio`,
  notifications: APP_PATHS.notifications,
  login: AUTH_PATHS.login,
  account: ACCOUNT_PATHS.home,
  messages: messagingRoutes.inbox(),
} as const;
