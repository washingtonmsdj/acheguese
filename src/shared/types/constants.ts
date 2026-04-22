// Re-export de todas as constantes do sistema
// Este arquivo centraliza os imports de constantes para facilitar a migração

export * from "./global.constants";
export * from "./mobility.constants";

// Re-export de tipos gerados
export type {
  Profile,
  Post,
  Driver,
  Notification,
  Payment,
  Review,
} from "./core.generated";

export type {
  RideRequestsRow,
  RideReportsRow,
  AdminUsersRow,
} from "./mobility.generated";

export type { CompaniesRow, SubscriptionPlan } from "./companies.generated";
export { SUBSCRIPTION_PLAN } from "./companies.generated";

export type {
  ProfileQuery,
  PostQuery,
  CommentQuery,
  RideRequestQuery,
  CompanyQuery,
  QueryFields,
  QueryRelations,
} from "./queries.generated";

// Re-export de helpers SSOT
export {
  SSOTValidators,
  SSOTGuards,
  SSOTUtils,
  useSSOTValidation,
} from "../utils/ssot-helpers";
export { SSOTMiddleware, useSSOTMiddleware } from "../utils/ssot-middleware";

// Re-export de tipos específicos
export type { RideStatus } from "./mobility.constants";
export type {
  UserRole,
  PostStatus,
  PaymentStatus,
  PaymentMethod,
  ReportStatus,
  NotificationType,
  DriverStatus,
  VerificationStatus,
  AlertSeverity,
  AlertStatus,
} from "./global.constants";
