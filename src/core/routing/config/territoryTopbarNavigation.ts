import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { messagingRoutes } from "@/core/messaging";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { STATIC_ROUTE_PATHS } from "@/core/routing/config/staticRoutePaths";

export const TERRITORY_TOPBAR_NAVIGATION = {
  home: STATIC_ROUTE_PATHS.home,
  territorySelector: `${STATIC_ROUTE_PATHS.home}?trocar=territorio`,
  notifications: STATIC_ROUTE_PATHS.notifications,
  login: AUTH_PATHS.login,
  account: ACCOUNT_PATHS.home,
  messages: messagingRoutes.inbox(),
} as const;
