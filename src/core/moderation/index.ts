/**
 * Moderation Services - Barrel Export
 * SSOT v2.0 - Domain services for moderation
 */

export { ModerationService } from "./services/ModerationService";
export { moderationQueueService } from "./services/ModerationQueueService";
export { userWarningsService } from "./services/UserWarningsService";
export { adminAuditService } from "./services/AdminAuditService";

export type { UserWarning, CreateUserWarningData } from "./services/UserWarningsService";
export type { AdminAuditLog, CreateAdminAuditLogData } from "./services/AdminAuditService";
