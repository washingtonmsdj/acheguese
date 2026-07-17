import { profileService } from "@/core/profiles/services/ProfileService";
import { CacheManager } from "@/core/session/cache/CacheManager";
import { getCacheConfig } from "@/core/session/cache/CacheConfig";
import type {
  AppRole,
  CapabilityAction,
  CapabilityPreviewContext,
  CapabilityPreviewResult,
  CapabilityPreviewSubject,
  CapabilityTargetHint,
} from "../types";
import { RoleService } from "./RoleService";
import {
  actionNeedsRoleLookup,
  buildCapabilityPreviewMatrix,
  evaluateCapabilityPreview,
} from "./capabilityPreviewPolicy";

/**
 * Computes conservative UI visibility hints.
 *
 * A positive result is never proof that a backend command is authorized.
 * RLS, RPCs and Edge Functions must re-evaluate identity, role, scope and
 * ownership for every protected operation.
 */
export class CapabilityPreviewService {
  private static readonly previewCache = new Map<string, CapabilityPreviewResult>();
  private static readonly cacheExpiry = new Map<string, number>();
  private static readonly CACHE_TTL = getCacheConfig().authorization.ttl;
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    CacheManager.registerInvalidationCallback((scope) => {
      if (scope === "session" || scope === "authorization") {
        this.invalidateCache();
      }
    });
  }

  static async previewActions(
    profileId: string,
    actions: readonly CapabilityAction[],
    context: CapabilityPreviewContext = {},
    target?: CapabilityTargetHint,
  ): Promise<CapabilityPreviewResult[]> {
    const cached = actions.map((action) =>
      this.getCachedPreview(this.generateCacheKey(profileId, action, context, target)),
    );
    if (cached.every((result) => result !== null)) {
      return cached as CapabilityPreviewResult[];
    }

    const subject = await this.loadSubject(
      profileId,
      actions.some(actionNeedsRoleLookup),
    );
    if (!subject) {
      return actions.map((action) => {
        const result: CapabilityPreviewResult = {
          action,
          status: "denied",
          reason: "anonymous",
        };
        this.cachePreview(this.generateCacheKey(profileId, action, context, target), result);
        return result;
      });
    }

    return actions.map((action) => {
      const key = this.generateCacheKey(profileId, action, context, target);
      const existing = this.getCachedPreview(key);
      if (existing) return existing;
      const result = evaluateCapabilityPreview(subject, action, context, target);
      this.cachePreview(key, result);
      return result;
    });
  }

  static async canDisplayAction(
    profileId: string,
    action: CapabilityAction,
    context: CapabilityPreviewContext = {},
    target?: CapabilityTargetHint,
  ): Promise<boolean> {
    const [result] = await this.previewActions(profileId, [action], context, target);
    return result?.status === "allowed";
  }

  static async getProfileCapabilityPreview(
    profileId: string,
    context: CapabilityPreviewContext = {},
  ): Promise<CapabilityPreviewResult[]> {
    const subject = await this.loadSubject(profileId, true);
    return subject ? buildCapabilityPreviewMatrix(subject, context) : [];
  }

  private static async loadSubject(
    profileId: string,
    includeRoles: boolean,
  ): Promise<CapabilityPreviewSubject | null> {
    const profile = await profileService.getProfileById(profileId);
    if (!profile) return null;

    const roles: AppRole[] = includeRoles
      ? await RoleService.getUserRoles(profile.user_id)
      : [];

    return {
      profileId: profile.id,
      isActive: profile.is_active === true,
      isSuspended: profile.is_suspended === true || profile.suspended === true,
      isBlocked: false,
      roles,
    };
  }

  private static generateCacheKey(
    profileId: string,
    action: CapabilityAction,
    context: CapabilityPreviewContext,
    target?: CapabilityTargetHint,
  ): string {
    return JSON.stringify({
      profileId,
      action,
      context: {
        communityId: context.communityId ?? null,
        businessId: context.businessId ?? null,
        eventId: context.eventId ?? null,
        communityModeratorHint: context.communityModeratorHint === true,
      },
      target: target
        ? {
            type: target.type,
            id: target.id,
            ownerProfileIdHint: target.ownerProfileIdHint ?? null,
          }
        : null,
    });
  }

  private static getCachedPreview(key: string): CapabilityPreviewResult | null {
    const value = this.previewCache.get(key);
    const expiry = this.cacheExpiry.get(key);
    if (!value || !expiry || Date.now() > expiry) return null;
    return value;
  }

  private static cachePreview(key: string, result: CapabilityPreviewResult): void {
    this.previewCache.set(key, result);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  static invalidateCache(): void {
    this.previewCache.clear();
    this.cacheExpiry.clear();
  }
}
