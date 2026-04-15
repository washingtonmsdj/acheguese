/**
 * 👥 SOCIAL SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export {
  SocialInteractionsService,
  socialInteractionsService,
  SocialInteractionsFacade,
} from "./SocialInteractionsService";

// ============================================================
// 📦 SERVICES LEGACY
// ============================================================
export * from "./GroupService";
export * from "./BlockService";

// ============================================================
// 📝 TYPES - Re-exports de tipos
// ============================================================
export type {
  PostLike,
  SavedPost,
  GroupMember,
  GroupMessage,
  CreateGroupMessageData,
  SocialInteractionStats,
} from "../types";
