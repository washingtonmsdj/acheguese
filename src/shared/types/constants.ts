// Re-export de todas as constantes do sistema
// Este arquivo centraliza os imports de constantes para facilitar a migracao

export {
  USER_ROLE,
  POST_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  NOTIFICATION_TYPE,
  DRIVER_STATUS,
  VERIFICATION_STATUS,
  ALERT_SEVERITY,
  ALERT_STATUS,
  BUSINESS_STATUS,
  REPORT_STATUS,
  BUSINESS_STATUS_LABELS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_COLORS,
  isValidUserRole,
  isValidPostStatus,
  isValidPaymentStatus,
  isValidPaymentMethod,
  isValidNotificationType,
  isValidDriverStatus,
  isValidVerificationStatus,
  isValidReportStatus,
  isValidAlertStatus,
  isValidBusinessStatus,
} from "./global.constants";

export type {
  UserRole,
  PostStatus,
  PaymentStatus,
  PaymentMethod,
  NotificationType,
  DriverStatus,
  VerificationStatus,
  AlertSeverity,
  AlertStatus,
  BusinessStatus,
  ReportStatus,
} from "./global.constants";

export * from "./mobility.constants";

export type { Post, Driver, Notification, Payment, Review } from "./core.generated";

export type { RideRequestsRow, RideReportsRow, AdminUsersRow } from "./mobility.generated";

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

export {
  SSOTValidators,
  SSOTGuards,
  SSOTUtils,
  useSSOTValidation,
} from "../utils/ssot-helpers";
export { SSOTMiddleware, useSSOTMiddleware } from "../utils/ssot-middleware";

export type { RideStatus } from "./mobility.constants";
