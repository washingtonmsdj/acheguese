// src/core/authorization/services/AuthorizationEngine.ts
//
// Validates: Requirements 4.1–4.9, 6.4, 6.7, 7.1–7.8, 8.1, 8.2, 8.7

import { supabase } from "@/integrations/supabase/supabase";
import { CacheManager } from "@/core/session/cache/CacheManager";
import { getCacheConfig } from "@/core/session/cache/CacheConfig";
import type {
  Action,
  ActionContext,
  TargetEntity,
  Permission,
  ProfileStatus,
  ProfileType,
} from "../types";

export class AuthorizationEngine {
  private static permissionCache = new Map<string, boolean>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_TTL = getCacheConfig().authorization.ttl;
  private static initialized = false;

  // ── 15.1 / 15.2 ────────────────────────────────────────────────────────────

  static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    CacheManager.registerInvalidationCallback((scope) => {
      if (scope === "session" || scope === "authorization") {
        this.invalidateCache();
      }
    });
  }

  // ── 15.3 ───────────────────────────────────────────────────────────────────

  static async canProfilePerformAction(
    profileId: string,
    action: Action,
    context: ActionContext,
    targetEntity?: TargetEntity,
  ): Promise<boolean> {
    const cacheKey = this.generateCacheKey(
      profileId,
      action,
      context,
      targetEntity,
    );
    const cached = this.getCachedDecision(cacheKey);
    if (cached !== null) return cached;

    const profile = await this.getProfileData(profileId);
    if (!profile) {
      this.cacheDecision(cacheKey, false);
      return false;
    }

    if (!this.isProfileAllowed(profile.status)) {
      this.cacheDecision(cacheKey, false);
      return false;
    }

    let isOwner = false;
    if (targetEntity) {
      isOwner = await this.checkOwnership(profileId, targetEntity);
    }

    const canPerform = await this.checkActionPermission(
      profile,
      action,
      context,
      targetEntity,
      isOwner,
    );
    this.cacheDecision(cacheKey, canPerform);
    return canPerform;
  }

  // ── 15.4 ───────────────────────────────────────────────────────────────────

  static async checkOwnership(
    profileId: string,
    targetEntity: TargetEntity,
  ): Promise<boolean> {
    const { type, id } = targetEntity;
    switch (type) {
      case "post":
        return this.checkPostOwnership(profileId, id);
      case "comment":
        return this.checkCommentOwnership(profileId, id);
      case "business":
        return this.checkBusinessOwnership(profileId, id);
      case "message":
        return this.checkMessageOwnership(profileId, id);
      default:
        return false;
    }
  }

  // ── 15.5 ───────────────────────────────────────────────────────────────────

  static async getProfilePermissions(
    profileId: string,
    context: ActionContext,
  ): Promise<Permission[]> {
    const profile = await this.getProfileData(profileId);
    if (!profile) return [];

    const permissions: Permission[] = [];

    const globalActions: Action[] = [
      "createPost",
      "createComment",
      "createMessage",
      "createBusiness",
      "moderateContent",
      "verifyUser",
      "banUser",
      "suspendUser",
      "reviewContent",
      "voteOnContent",
      "uploadMedia",
      "reportContent",
    ];

    for (const action of globalActions) {
      const canPerform = await this.canPerformWithProfile(
        profile,
        action,
        context,
      );
      permissions.push({ action, status: canPerform ? "allowed" : "denied" });
    }

    const targetDependentActions: Action[] = [
      "editPost",
      "deletePost",
      "editComment",
      "deleteComment",
      "editMessage",
      "deleteMessage",
      "editBusiness",
      "deleteBusiness",
    ];

    for (const action of targetDependentActions) {
      permissions.push({ action, status: "requiresTarget" });
    }

    return permissions;
  }

  // ── 15.6 ───────────────────────────────────────────────────────────────────

  private static async canPerformWithProfile(
    profile: ReturnType<
      (typeof AuthorizationEngine)["getProfileData"]
    > extends Promise<infer T>
      ? NonNullable<T>
      : never,
    action: Action,
    context: ActionContext,
    targetEntity?: TargetEntity,
  ): Promise<boolean> {
    if (!profile) return false;
    if (!this.isProfileAllowed(profile.status)) return false;
    let isOwner = false;
    if (targetEntity) {
      isOwner = await this.checkOwnership(profile.id, targetEntity);
    }
    return this.checkActionPermission(
      profile,
      action,
      context,
      targetEntity,
      isOwner,
    );
  }

  // ── 15.7 ───────────────────────────────────────────────────────────────────

  private static async getProfileData(profileId: string): Promise<{
    id: string;
    type: ProfileType;
    status: ProfileStatus;
    verified: boolean;
  } | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, profile_type, is_active, is_suspended, verified")
      .eq("id", profileId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      type: data.profile_type as ProfileType,
      status: {
        isActive: data.is_active,
        isSuspended: data.is_suspended || false,
        isBlocked: false,
      },
      verified: data.verified || false,
    };
  }

  private static isProfileAllowed(status: ProfileStatus): boolean {
    return status.isActive && !status.isSuspended && !status.isBlocked;
  }

  // ── 15.8 ───────────────────────────────────────────────────────────────────

  private static async checkActionPermission(
    profile: {
      id: string;
      type: ProfileType;
      status: ProfileStatus;
      verified: boolean;
    },
    action: Action,
    context: ActionContext,
    targetEntity?: TargetEntity,
    isOwner: boolean = false,
  ): Promise<boolean> {
    if (profile.status.isSuspended) return false;

    switch (action) {
      case "createPost":
      case "createComment":
      case "createMessage":
        return profile.status.isActive;

      case "editPost":
      case "editComment":
      case "editMessage":
        if (!isOwner || !targetEntity) return false;
        return profile.status.isActive;

      case "deletePost":
      case "deleteComment":
      case "deleteMessage":
        if (!isOwner || !targetEntity) return false;
        return profile.status.isActive;

      case "createBusiness":
      case "editBusiness":
      case "deleteBusiness": {
        if (context.communityId) {
          const communityAllows = await this.checkCommunityPermission(
            context.communityId,
            action,
          );
          if (!communityAllows) return false;
        }
        if (
          (action === "editBusiness" || action === "deleteBusiness") &&
          !isOwner
        )
          return false;
        return profile.status.isActive;
      }

      case "moderateContent":
      case "verifyUser":
      case "banUser":
      case "suspendUser": {
        const isMod = await this.isModerator(profile.id);
        if (!isMod) return false;
        if (context.communityId) {
          return this.isCommunityModerator(profile.id, context.communityId);
        }
        return true;
      }

      case "reviewContent":
      case "voteOnContent":
      case "uploadMedia":
      case "reportContent":
        return profile.status.isActive;

      default:
        return false;
    }
  }

  // ── 15.9 ───────────────────────────────────────────────────────────────────

  private static async checkCommunityPermission(
    communityId: string,
    action: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("communities")
      .select("settings")
      .eq("id", communityId)
      .single();
    if (!data?.settings) return true;
    return (
      (data.settings as Record<string, unknown>)[`allow_${action}`] !== false
    );
  }

  // ── 15.10 ──────────────────────────────────────────────────────────────────

  private static async isModerator(profileId: string): Promise<boolean> {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();
    if (!profile) return false;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id)
      .in("role", ["admin", "moderator"])
      .eq("is_active", true)
      .limit(1);
    return !!data && data.length > 0;
  }

  // ── 15.11 ──────────────────────────────────────────────────────────────────

  private static async isCommunityModerator(
    profileId: string,
    communityId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("community_moderators")
      .select("id")
      .eq("profile_id", profileId)
      .eq("community_id", communityId)
      .eq("is_active", true)
      .limit(1);
    return !!data && data.length > 0;
  }

  // ── Ownership helpers ──────────────────────────────────────────────────────

  private static async checkPostOwnership(
    profileId: string,
    postId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .single();
    return data?.author_profile_id === profileId;
  }

  private static async checkCommentOwnership(
    profileId: string,
    commentId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("comments")
      .select("author_profile_id")
      .eq("id", commentId)
      .single();
    return data?.author_profile_id === profileId;
  }

  private static async checkBusinessOwnership(
    profileId: string,
    businessId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("businesses")
      .select("owner_profile_id")
      .eq("id", businessId)
      .single();
    return data?.owner_profile_id === profileId;
  }

  private static async checkMessageOwnership(
    profileId: string,
    messageId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("messages")
      .select("sender_profile_id")
      .eq("id", messageId)
      .single();
    return data?.sender_profile_id === profileId;
  }

  // ── 15.12 ──────────────────────────────────────────────────────────────────

  private static normalizeContext(context: ActionContext): object {
    return {
      communityId: context.communityId ?? null,
      businessId: context.businessId ?? null,
      eventId: context.eventId ?? null,
    };
  }

  // ── 15.13 ──────────────────────────────────────────────────────────────────

  private static normalizeTargetEntity(
    targetEntity?: TargetEntity,
  ): object | null {
    if (!targetEntity) return null;
    return { type: targetEntity.type, id: targetEntity.id };
  }

  // ── 15.14 ──────────────────────────────────────────────────────────────────

  private static generateCacheKey(
    profileId: string,
    action: Action,
    context: ActionContext,
    targetEntity?: TargetEntity,
  ): string {
    const parts = [
      profileId,
      action,
      JSON.stringify(this.normalizeContext(context)),
    ];
    const normalizedTarget = this.normalizeTargetEntity(targetEntity);
    if (normalizedTarget) parts.push(JSON.stringify(normalizedTarget));
    return parts.join(":");
  }

  // ── 15.15 ──────────────────────────────────────────────────────────────────

  private static getCachedDecision(key: string): boolean | null {
    const cached = this.permissionCache.get(key);
    const expiry = this.cacheExpiry.get(key);
    if (cached === undefined || !expiry || Date.now() > expiry) return null;
    return cached;
  }

  // ── 15.16 ──────────────────────────────────────────────────────────────────

  private static cacheDecision(key: string, decision: boolean): void {
    this.permissionCache.set(key, decision);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  // ── 15.17 ──────────────────────────────────────────────────────────────────

  static invalidateCache(): void {
    this.permissionCache.clear();
    this.cacheExpiry.clear();
  }
}

