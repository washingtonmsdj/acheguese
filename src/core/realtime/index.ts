/**
 * Core Realtime - Barrel Export
 *
 * Exporta apenas a API pública do módulo de realtime
 */

export { RealtimeService, realtimeService } from "./services/RealtimeService";

export type {
  RealtimeConnectionStatus,
  RealtimeEvent,
  RealtimePresenceOptions,
  RealtimePresenceState,
  RealtimePresenceSubscription,
  RealtimeSubscription,
} from "./services/RealtimeService";
export type {
  RealtimeBroadcastTopic,
  RealtimePresenceTopic,
  RealtimeStreamKey,
  RealtimeTopic,
} from "./config/realtimeRegistry";
