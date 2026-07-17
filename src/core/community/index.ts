/**
 * Core community public API.
 *
 * Expõe apenas contratos canônicos consumidos cross-domain.
 */

export {
  CommunityService,
  communityService,
} from "./services/CommunityService";
export * from "./access";
export * from "./audit";
export * from "./components";
export * from "./moderation";
