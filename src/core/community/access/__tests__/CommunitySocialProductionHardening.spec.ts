import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713090000_harden_community_social_runtime.sql",
  ),
  "utf8",
);
const moderationMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713100000_harden_community_moderation_actions.sql",
  ),
  "utf8",
);
const moderationBrokerMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713103000_broker_community_moderation_rpc.sql",
  ),
  "utf8",
);
const notificationMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713110000_harden_community_notification_runtime.sql",
  ),
  "utf8",
);
const notificationContractMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713113000_add_notification_priority_contract.sql",
  ),
  "utf8",
);
const transactionalCommunityNotificationMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713150000_make_community_social_notifications_transactional.sql",
  ),
  "utf8",
);
const communityMediaAssetMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260717130000_consolidate_community_post_media_assets.sql",
  ),
  "utf8",
);
const communityMembershipMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713123000_harden_community_membership_runtime.sql",
  ),
  "utf8",
);
const lostFoundMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713130000_harden_lost_found_runtime.sql",
  ),
  "utf8",
);
const alertMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713131000_harden_community_alert_reports.sql",
  ),
  "utf8",
);
const alertCreateMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713151000_fix_community_alert_create_audit_contract.sql",
  ),
  "utf8",
);
const qaMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713132000_harden_community_qa_runtime.sql",
  ),
  "utf8",
);
const issueMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713133000_harden_community_issue_runtime.sql",
  ),
  "utf8",
);
const groupDiscoveryMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713134000_harden_active_profile_and_group_discovery.sql",
  ),
  "utf8",
);
const contentReviewMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713135000_harden_community_content_review.sql",
  ),
  "utf8",
);
const contentReviewStatsMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713136000_fix_community_moderation_queue_stats.sql",
  ),
  "utf8",
);
const profileGovernanceMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713137000_harden_profile_server_owned_fields.sql",
  ),
  "utf8",
);
const communityRpcBroker = readFileSync(
  join(root, "supabase/functions/community-rpc/index.ts"),
  "utf8",
);
const notificationService = readFileSync(
  join(root, "src/core/notifications/services/NotificationService.ts"),
  "utf8",
);
const notificationItem = readFileSync(
  join(root, "src/app/components/notifications/NotificationItem.tsx"),
  "utf8",
);
const notificationHook = readFileSync(
  join(root, "src/core/notifications/useUnifiedNotifications.ts"),
  "utf8",
);
const createPostModal = readFileSync(
  join(root, "src/core/community/components/composer/CreatePostModal.tsx"),
  "utf8",
);
const createPostForm = readFileSync(
  join(root, "src/core/community/hooks/composer/useCreatePostForm.ts"),
  "utf8",
);
const postRuntime = readFileSync(
  join(root, "src/core/posts/services/post.service.runtime.ts"),
  "utf8",
);
const storageBuckets = readFileSync(
  join(root, "src/core/media/config/storageBuckets.ts"),
  "utf8",
);
const postMutations = readFileSync(
  join(root, "src/core/posts/services/posts.mutations.ts"),
  "utf8",
);
const postFeedQueries = readFileSync(
  join(root, "src/core/posts/services/posts.feed.queries.ts"),
  "utf8",
);
const postFeedCursor = readFileSync(
  join(root, "src/core/posts/services/postFeedCursor.ts"),
  "utf8",
);
const communityFeedIndexMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713152000_add_community_feed_keyset_index.sql",
  ),
  "utf8",
);
const groupMessageReactionMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260713153000_add_group_message_reactions.sql",
  ),
  "utf8",
);
const canonicalReportDialog = readFileSync(
  join(root, "src/shared/components/moderation/ReportReasonDialog.tsx"),
  "utf8",
);
const postCommentsPanel = readFileSync(
  join(root, "src/core/community/components/comments/PostCommentsPanel.tsx"),
  "utf8",
);
const commentQueries = readFileSync(
  join(root, "src/core/comments/services/comments.queries.ts"),
  "utf8",
);
const postUserQueries = readFileSync(
  join(root, "src/core/posts/services/posts.user.queries.ts"),
  "utf8",
);
const profileActivityQueries = readFileSync(
  join(root, "src/core/profiles/services/profile.activity.queries.ts"),
  "utf8",
);
const profileService = readFileSync(
  join(root, "src/core/profiles/services/ProfileService.ts"),
  "utf8",
);
const profileValidationSchema = readFileSync(
  join(root, "src/shared/validation/schemas/profile.schema.ts"),
  "utf8",
);
const profileEditPage = readFileSync(
  join(root, "src/modules/profile/pages/ContaEditarPerfilPage.tsx"),
  "utf8",
);
const profileRepository = readFileSync(
  join(
    root,
    "src/core/infrastructure/database/repositories/ProfileRepository.ts",
  ),
  "utf8",
);
const communityRuntimeLimits = readFileSync(
  join(root, "src/shared/constants/communityRuntime.ts"),
  "utf8",
);
const postEngagement = readFileSync(
  join(root, "src/core/engagement/services/PostEngagementService.ts"),
  "utf8",
);
const groupInteractionsService = readFileSync(
  join(root, "src/core/social/services/SocialGroupInteractionsService.ts"),
  "utf8",
);
const groupInteractions = readFileSync(
  join(root, "src/core/social/services/SocialGroupInteractionsService.ts"),
  "utf8",
);
const communityReportService = readFileSync(
  join(root, "src/core/community/moderation/CommunityReportService.ts"),
  "utf8",
);
const realtimeService = readFileSync(
  join(root, "src/core/realtime/services/RealtimeService.ts"),
  "utf8",
);
const realtimeRegistry = readFileSync(
  join(root, "src/core/realtime/config/realtimeRegistry.ts"),
  "utf8",
);
const groupQueries = readFileSync(
  join(root, "src/core/community/hooks/useGroupQueries.ts"),
  "utf8",
);
const lostFoundService = readFileSync(
  join(root, "src/core/community-lost-found/services/LostFoundService.ts"),
  "utf8",
);
const lostFoundListPage = readFileSync(
  join(root, "src/core/community/pages/AchadosPerdidosPage.tsx"),
  "utf8",
);
const lostFoundCreatePage = readFileSync(
  join(root, "src/core/community/pages/NovoAchadoPerdidoPage.tsx"),
  "utf8",
);
const lostFoundDetailPage = readFileSync(
  join(root, "src/core/community/pages/AchadoPerdidoDetailPage.tsx"),
  "utf8",
);
const alertService = readFileSync(
  join(root, "src/core/community/alerts/services/CommunityAlertService.ts"),
  "utf8",
);
const adminAlertService = readFileSync(
  join(root, "src/core/admin/services/AdminCommunityAlertsService.ts"),
  "utf8",
);
const qaService = readFileSync(
  join(root, "src/core/community/services/CommunityQAService.ts"),
  "utf8",
);
const qaCreateHook = readFileSync(
  join(root, "src/core/community/hooks/useNovaRecomendacao.ts"),
  "utf8",
);
const qaDetailHook = readFileSync(
  join(root, "src/core/community/hooks/useRecomendacaoDetail.ts"),
  "utf8",
);
const qaListHook = readFileSync(
  join(root, "src/core/community/hooks/useRecomendacoes.ts"),
  "utf8",
);
const issueService = readFileSync(
  join(root, "src/core/community/issues/services/CommunityIssueService.ts"),
  "utf8",
);
const adminIssueService = readFileSync(
  join(root, "src/core/admin/services/AdminCommunityIssuesService.ts"),
  "utf8",
);
const groupsService = readFileSync(
  join(root, "src/core/community/services/CommunityGroupsService.ts"),
  "utf8",
);
const favoriteGroupsHook = readFileSync(
  join(root, "src/core/community/hooks/useFavoriteGroups.ts"),
  "utf8",
);
const moderationQueueService = readFileSync(
  join(
    root,
    "src/core/community/moderation/CommunityContentModerationService.ts",
  ),
  "utf8",
);
const adminModerationPage = readFileSync(
  join(root, "src/modules/admin/pages/AdminModeracao.tsx"),
  "utf8",
);

describe("community social production hardening", () => {
  it("requires an owned active profile and verified canonical residence", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.auth_owns_active_profile",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.auth_has_verified_residence",
    );
    expect(migration).toContain("ur.is_verified = TRUE");
    expect(migration).toContain("verified_residence_required");
  });

  it("enforces transactional anti-flood limits on the server", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("post_rate_limit_exceeded");
    expect(migration).toContain("comment_rate_limit_exceeded");
    expect(migration).toContain("group_message_rate_limit_exceeded");
    expect(migration).toContain("social_interaction_rate_limit_exceeded");
  });

  it("prevents group role escalation and protects the last admin", () => {
    expect(migration).toContain("group_role_cannot_be_self_assigned");
    expect(migration).toContain("role::TEXT = 'member'");
    expect(migration).toContain("only_group_admin_can_change_roles");
    expect(migration).toContain("group_must_keep_an_admin");
    expect(groupInteractions).not.toMatch(/joinGroup\([\s\S]{0,120}role\s*:/);
  });

  it("enforces group visibility, membership and posting policy in RLS and triggers", () => {
    expect(migration).toContain("CREATE POLICY groups_public_read");
    expect(migration).toContain("CREATE POLICY group_messages_member_read");
    expect(migration).toContain("group_posting_policy_denied");
    expect(migration).toContain("group_is_not_open_for_direct_join");
  });

  it("implements server-owned group message reactions promised by group capabilities", () => {
    expect(groupMessageReactionMigration).toContain(
      "CREATE TABLE IF NOT EXISTS public.group_message_reactions",
    );
    expect(groupMessageReactionMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.toggle_group_message_like",
    );
    expect(groupMessageReactionMigration).toContain(
      "private.current_active_profile_id()",
    );
    expect(groupMessageReactionMigration).toContain(
      "private.auth_is_group_member(v_group_id)",
    );
    expect(groupMessageReactionMigration).toContain("pg_advisory_xact_lock");
    expect(groupMessageReactionMigration).toContain(
      "REVOKE ALL ON TABLE public.group_message_reactions FROM anon, authenticated",
    );
  });

  it("uses one explicit report-reason contract in active community flows", () => {
    expect(canonicalReportDialog).toContain("reasonOptions");
    expect(canonicalReportDialog).toContain("onSubmit(reason");
    expect(postCommentsPanel).toContain("ReportReasonDialog");
    expect(postCommentsPanel).toContain("reportCommentAsync");
  });

  it("loads canonical comment authors, own-like state and nested replies", () => {
    expect(commentQueries).toContain(
      "profile:profiles!comments_author_profile_id_fkey",
    );
    expect(commentQueries).toContain(
      "viewer_likes:comment_likes!comment_likes_comment_id_fkey",
    );
    expect(commentQueries).toContain("buildCommentTree");
  });

  it("only exposes comments whose parent post remains public", () => {
    expect(migration).toContain(
      "CREATE POLICY community_comments_visible_parent_read",
    );
    expect(migration).toContain("p.is_published = TRUE");
    expect(migration).toContain("p.is_hidden = FALSE");
    expect(migration).toContain("p.is_removed = FALSE");
  });

  it("derives counters atomically from unique relation rows", () => {
    expect(migration).toContain("post_share_events_unique_profile");
    expect(migration).toContain("trg_sync_post_likes_count");
    expect(migration).toContain("trg_sync_post_comments_count");
    expect(migration).toContain("trg_sync_comment_likes_count_v2");
    expect(migration).toContain("trg_sync_post_shares_count");
    expect(postMutations).toContain("recordPostShare");
    expect(postMutations).not.toContain("incrementSharesCount");
  });

  it("uses profile identity consistently for comment likes", () => {
    expect(migration).toContain("liker_profile_id");
    expect(migration).toContain("comment_likes_comment_profile_key");
    expect(postMutations).not.toContain("followed_posts");
  });

  it("derives moderation actors and report history on the server", () => {
    expect(migration).toContain("NEW.removed_by := CASE");
    expect(migration).toContain("NEW.reviewed_by := v_reviewer_profile_id");
    expect(migration).toContain("NEW.moderation_history := COALESCE");
    expect(migration).toContain("community_report_identity_is_immutable");
    expect(moderationMigration).toContain(
      "NEW.reporter_profile_id := v_actor_profile_id",
    );
    expect(moderationMigration).toContain(
      "NEW.target_author_profile_id := v_target_author_profile_id",
    );
    expect(communityReportService).not.toContain("reporterId");
    expect(communityReportService).not.toContain("reviewed_at: new Date");
  });

  it("routes warnings, suspensions and bans through one server-owned contract", () => {
    expect(moderationMigration).toContain(
      "CREATE TABLE public.community_user_moderation_actions",
    );
    expect(moderationMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.apply_community_user_moderation_action",
    );
    expect(moderationBrokerMigration).toContain("SET SCHEMA private");
    expect(moderationBrokerMigration).toContain("SECURITY INVOKER");
    expect(moderationBrokerMigration).toContain(
      "SELECT private.apply_community_user_moderation_action",
    );
    expect(moderationMigration).toContain(
      "NOT COALESCE(private.is_admin_user(v_actor_user_id), FALSE)",
    );
    expect(moderationMigration).toContain(
      "v_actor_profile_id := private.current_active_profile_id()",
    );
    expect(moderationMigration).toContain("WHERE user_id = v_target_user_id");
    expect(
      existsSync(
        join(root, "src/core/moderation/services/UserWarningsService.ts"),
      ),
    ).toBe(false);
    expect(communityReportService).not.toContain("is_permanent");
  });

  it("allows time-limited suspensions to expire in server authorization", () => {
    expect(moderationMigration).toContain(
      "(p.suspended_until IS NULL OR p.suspended_until > now())",
    );
    expect(moderationMigration).toContain(
      "v_expires_at := now() + interval '7 days'",
    );
  });

  it("deduplicates social notifications by persisted domain event", () => {
    expect(notificationMigration).toContain("idx_notifications_user_dedupe");
    expect(notificationMigration).toContain(
      "ON CONFLICT (user_id, dedupe_key)",
    );
    expect(notificationMigration).toContain(
      "mark_current_user_notifications_as_read",
    );
    expect(notificationMigration).toContain("SECURITY INVOKER");
    expect(notificationContractMigration).toContain(
      "p_priority TEXT DEFAULT 'medium'",
    );
    expect(notificationContractMigration).toContain("p_priority NOT IN");
    expect(notificationContractMigration).toContain("pg_column_size");
    expect(transactionalCommunityNotificationMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.create_community_social_notification",
    );
    expect(transactionalCommunityNotificationMigration).toContain(
      "SECURITY DEFINER",
    );
    expect(transactionalCommunityNotificationMigration).toContain(
      "community:post_like:",
    );
    expect(transactionalCommunityNotificationMigration).toContain(
      "community:post_comment:",
    );
    expect(transactionalCommunityNotificationMigration).toContain(
      "community:comment_reply:",
    );
    expect(transactionalCommunityNotificationMigration).toContain(
      "community:post_mention:",
    );
    expect(transactionalCommunityNotificationMigration).toContain(
      "community:comment_mention:",
    );
    expect(notificationService).toContain("filters.limit ?? 30");
    expect(notificationService).toContain(
      "mark_current_user_notifications_as_read",
    );
    expect(notificationService).toContain(
      "deleted_at: new Date().toISOString()",
    );
    expect(notificationService).toContain(
      'realtimeService.subscribe("notifications.user"',
    );
    expect(realtimeRegistry).toContain('"notifications.user"');
    expect(realtimeRegistry).toContain('event: "INSERT"');
    expect(realtimeRegistry).toContain('event: "UPDATE"');
    expect(notificationHook).toContain(
      "activeUserIdRef.current !== requestUserId",
    );
    expect(notificationHook).toContain("notificationMatchesFilters");
    expect(notificationItem).not.toContain("useNotifications(");
    expect(
      existsSync(
        join(root, "src/core/notifications/hooks/useNotificationsOptimized.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(
          root,
          "src/core/notifications/components/UnifiedNotificationBell.tsx",
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(
          root,
          "src/core/community/alerts/services/AlertNotificationService.ts",
        ),
      ),
    ).toBe(false);
  });

  it("owns post media through MediaAsset and never persists blob previews", () => {
    expect(communityMediaAssetMigration).toContain(
      "private.require_attachable_owned_media_asset",
    );
    expect(communityMediaAssetMigration).toContain(
      "private.sync_post_media_asset_links",
    );
    expect(communityMediaAssetMigration).toContain(
      "private.sync_lost_found_media_asset_links",
    );
    expect(communityMediaAssetMigration).toContain(
      "DROP POLICY IF EXISTS post_images_owner_insert",
    );
    expect(communityMediaAssetMigration).toContain(
      "DROP FUNCTION IF EXISTS private.can_upload_owned_post_image",
    );
    expect(storageBuckets).not.toContain("POST_IMAGES");
    expect(createPostForm).toContain("imageFiles");
    expect(createPostForm).toContain("URL.revokeObjectURL");
    expect(createPostModal).toContain("createPostWithImages");
    expect(createPostModal).not.toContain("images: form.images");
    expect(postRuntime).toContain("uploadMediaAsset(");
    expect(postRuntime).toContain("references.push(asset.reference)");
    expect(postRuntime).not.toContain("uploadPostImage(");
    expect(postRuntime).not.toContain("deleteFromBucket(");
  });

  it("protects Local Community membership roles and audits every transition", () => {
    expect(communityMembershipMigration).toContain("TG_OP = 'DELETE'");
    expect(communityMembershipMigration).toContain(
      "community_manager_cannot_change_own_membership",
    );
    expect(communityMembershipMigration).toContain(
      "community_owner_transition_requires_backend",
    );
    expect(communityMembershipMigration).toContain(
      "community_must_keep_an_owner",
    );
    expect(communityMembershipMigration).toContain(
      "community_membership_request_rate_limit_exceeded",
    );
    expect(communityMembershipMigration).toContain(
      "audit_community_membership_change",
    );
    expect(communityMembershipMigration).toContain(
      "community_social_audit_log",
    );
  });

  it("keeps group realtime subscriptions isolated and reconciles every row event", () => {
    expect(realtimeService).toContain(
      'this.subscribe("community.group-messages"',
    );
    expect(realtimeRegistry).toContain('"community.group-messages"');
    expect(realtimeRegistry).toContain('table: "group_messages_new"');
    expect(realtimeRegistry).toContain('column: "group_id"');
    expect(realtimeRegistry).toContain('event: "*"');
    expect(realtimeService).toContain(
      'eventType === "DELETE" ? typedPayload.old : typedPayload.new',
    );
    expect(groupQueries).toContain('eventType === "DELETE"');
    expect(groupQueries).toContain("GroupService.getGroupMessageById(row.id)");
    expect(
      existsSync(join(root, "src/core/community/hooks/useGroupChat.ts")),
    ).toBe(false);
  });

  it("protects lost-and-found identity, contact data and cursor pagination", () => {
    expect(lostFoundMigration).toContain("NEW.autor_id := v_actor_profile_id");
    expect(lostFoundMigration).toContain("lost_found_post_rate_limit_exceeded");
    expect(lostFoundMigration).toContain("audit_lost_found_change");
    expect(lostFoundMigration).toContain("GRANT SELECT (");
    const publicPostProjection = lostFoundMigration.slice(
      lostFoundMigration.indexOf("GRANT SELECT ("),
      lostFoundMigration.indexOf(") ON public.lost_found_posts"),
    );
    expect(publicPostProjection).not.toContain("contato_telefone");
    expect(publicPostProjection).not.toContain("contato_email");
    expect(lostFoundService).toContain("LostFoundPageCursor");
    expect(lostFoundService).toContain(
      "created_at.lt.${normalizedCursor.createdAt}",
    );
    expect(lostFoundListPage).toContain("useInfiniteQuery");
    expect(lostFoundCreatePage).not.toContain("autor_id: user.id");
    expect(lostFoundDetailPage).toContain(
      "activeProfile?.id === post.autor_id",
    );
    expect(lostFoundDetailPage).not.toContain("profile.whatsapp");
    expect(
      existsSync(
        join(root, "src/core/community/services/LostFoundRuntimeService.ts"),
      ),
    ).toBe(false);
  });

  it("owns alert mutations, counters and audit atomically in the database", () => {
    expect(alertMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.mutate_community_alert",
    );
    expect(alertMigration).toContain("edit_count = edit_count + 1");
    expect(alertMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.sync_community_alert_report_count",
    );
    expect(alertMigration).toContain("community_social_audit_log");
    expect(alertMigration).not.toContain("public.community_alert_audit");
    expect(alertCreateMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.create_community_alert",
    );
    expect(alertCreateMigration).toContain("community_social_audit_log");
    expect(alertCreateMigration).not.toContain("community_alert_audit");
    expect(alertCreateMigration).toContain("pg_advisory_xact_lock");
    expect(alertCreateMigration).toContain(
      "idx_community_alerts_profile_type_location_active_created",
    );
    expect(alertCreateMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(alertCreateMigration).toContain("TO service_role");
    expect(alertService).toContain('supabase.rpc("mutate_community_alert"');
    expect(alertService).not.toContain("from(this.TABLE)\n        .update");
    expect(adminAlertService).toContain("getReportsForAlerts");
    expect(adminAlertService).toContain("get_community_alert_admin_stats");
    expect(adminAlertService).not.toContain("writeAuditLog");
    expect(communityRpcBroker).not.toContain("incrementAlertEditCount");
  });

  it("uses deterministic, indexed keyset pagination for the territorial feed", () => {
    expect(postFeedQueries).toContain(
      '.order("created_at", { ascending: false })',
    );
    expect(postFeedQueries).toContain('.order("id", { ascending: false })');
    expect(postFeedQueries).toContain("postFeedKeysetFilter");
    expect(postFeedCursor).toContain("created_at.lt.${cursor.createdAt}");
    expect(postFeedCursor).toContain("id.lt.${cursor.id}");
    expect(communityFeedIndexMigration).toContain(
      "idx_posts_community_feed_location_visible_created_id",
    );
    expect(communityFeedIndexMigration).toContain(
      "(location_id, created_at DESC, id DESC)",
    );
  });

  it("derives Q&A actors and serializes reactions and best-answer state", () => {
    expect(qaMigration).toContain(
      "NEW.author_profile_id := v_actor_profile_id",
    );
    expect(qaMigration).toContain("community_question_rate_limit_exceeded");
    expect(qaMigration).toContain("question_answer_rate_limit_exceeded");
    expect(qaMigration).toContain("question_answer_like_rate_limits");
    expect(qaMigration).toContain("pg_advisory_xact_lock");
    expect(qaMigration).toContain("private.mark_best_question_answer");
    expect(qaMigration).toContain("audit_community_qa_change");
    expect(qaService).toContain('supabase.rpc("toggle_question_answer_like"');
    expect(qaService).toContain('supabase.rpc("mark_best_answer"');
    expect(qaService).not.toContain("author_profile_id: input.autor_id");
    expect(qaCreateHook).toContain("useSessionContext");
    expect(qaCreateHook).not.toContain("autor_id: user");
    expect(qaDetailHook).toContain("question?.autor_id !== activeProfile?.id");
    expect(qaListHook).toContain("useInfiniteQuery");
    expect(qaListHook).toContain("QuestionCursor");
    expect(communityRpcBroker).not.toContain("markBestAnswer");
  });

  it("owns issue identity, reactions, moderation and audit on the server", () => {
    expect(issueMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.create_community_issue",
    );
    expect(issueMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.mutate_community_issue",
    );
    expect(issueMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.toggle_community_issue_support",
    );
    expect(issueMigration).toContain("verified_residence_required");
    expect(issueMigration).toContain("pg_advisory_xact_lock");
    expect(issueMigration).toContain("community_social_audit_log");
    expect(issueMigration).toContain("DROP TABLE public.community_issue_audit");
    expect(issueService).toContain('supabase.rpc("create_community_issue"');
    expect(issueService).toContain('supabase.rpc("mutate_community_issue"');
    expect(issueService).toContain(
      'supabase.rpc("toggle_community_issue_support"',
    );
    expect(issueService).not.toContain("supportIssue(");
    expect(issueService).not.toContain("unsupportIssue(");
    expect(issueService).not.toContain('from("community_issue_audit")');
    expect(adminIssueService).toContain("getReportsForIssues");
    expect(adminIssueService).toContain("get_community_issue_admin_stats");
    expect(adminIssueService).not.toContain("SessionService");
    expect(communityRpcBroker).not.toContain("createIssue");
  });

  it("uses the persisted active profile and globally orders group discovery", () => {
    expect(groupDiscoveryMigration).toContain("public.user_active_profiles");
    expect(groupDiscoveryMigration).toContain("public.profile_members");
    expect(groupDiscoveryMigration).toContain(
      "p_profile_id = private.current_active_profile_id()",
    );
    expect(groupDiscoveryMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.sync_group_members_count",
    );
    expect(groupDiscoveryMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.list_community_groups_page",
    );
    expect(groupDiscoveryMigration).toContain("SECURITY INVOKER");
    expect(groupDiscoveryMigration).toContain("idx_groups_location_popular");
    expect(groupsService).toContain(
      'supabase.rpc("list_community_groups_page"',
    );
    expect(groupsService).not.toContain("normalized.sort(");
    expect(favoriteGroupsHook).toContain("onlyMemberGroups: true");
    expect(favoriteGroupsHook).not.toContain("getUserGroupIds");
  });

  it("reviews reported content atomically through the active admin queue", () => {
    expect(contentReviewMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.review_community_content_reports",
    );
    expect(contentReviewMigration).toContain("SECURITY DEFINER");
    expect(contentReviewMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.review_community_content_reports",
    );
    expect(contentReviewMigration).toContain("SECURITY INVOKER");
    expect(contentReviewMigration).toContain("pg_advisory_xact_lock");
    expect(contentReviewMigration).toContain("affected_reports', 0");
    expect(contentReviewMigration).toContain("UPDATE public.community_reports");
    expect(contentReviewMigration).toContain("community_social_audit_log");
    expect(contentReviewMigration).toContain("get_community_moderation_stats");
    expect(contentReviewStatsMigration).toContain(
      "count(DISTINCT reports.target_id) FILTER",
    );
    expect(moderationQueueService).toContain(
      '"review_community_content_reports"',
    );
    expect(moderationQueueService).toContain(
      '"get_community_moderation_stats"',
    );
    expect(moderationQueueService).toContain(
      "COMMUNITY_RUNTIME_LIMITS.MODERATION_QUEUE_PAGE_SIZE",
    );
    expect(adminModerationPage).toContain("CommunityContentModerationQueue");
    expect(
      existsSync(
        join(root, "src/core/admin/services/AdminModerationService.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(root, "src/modules/admin/pages/AdminModeracaoCompleta.tsx"),
      ),
    ).toBe(false);
  });

  it("does not retain unpublished reputation, mention or unbounded social contracts", () => {
    expect(postRuntime).not.toContain("add_pontos");
    expect(postRuntime).not.toContain("addUserPoints");
    expect(postRuntime).not.toContain("getPostMentions");
    expect(postUserQueries).not.toContain("community_post_mentions");
    expect(profileActivityQueries).not.toContain("community_post_mentions");
    expect(profileService).not.toContain("getUserMentions(");
    expect(postUserQueries).toContain("requestedOffset > 10_000");
    expect(postEngagement).not.toContain("user_follows");
    expect(postEngagement).toContain(
      "COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX",
    );
    expect(groupInteractionsService).toContain(
      "COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX",
    );
    expect(communityRuntimeLimits).toContain("SOCIAL_PAGE_OFFSET_MAX: 10_000");
    expect(communityRuntimeLimits).toContain("MODERATION_QUEUE_PAGE_SIZE: 50");
    expect(
      existsSync(
        join(
          root,
          "src/core/community/services/CommunityGamificationService.ts",
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(root, "src/core/social/hooks/useCommunityInteractions.ts"),
      ),
    ).toBe(false);
    expect(
      existsSync(join(root, "src/core/community/hooks/useFollowUser.ts")),
    ).toBe(false);
    expect(
      existsSync(join(root, "src/modules/profile/hooks/useUserMentions.ts")),
    ).toBe(false);
    expect(
      existsSync(
        join(root, "src/modules/profile/components/UserMentionsGrid.tsx"),
      ),
    ).toBe(false);
  });

  it("keeps profile score and moderation state outside ordinary browser control", () => {
    expect(profileGovernanceMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.guard_profile_server_owned_fields",
    );
    expect(profileGovernanceMigration).toContain(
      "profile_score_is_server_owned",
    );
    expect(profileGovernanceMigration).toContain(
      "profile_moderation_state_is_admin_owned",
    );
    expect(profileGovernanceMigration).toContain(
      "profile_structural_identity_is_immutable",
    );
    expect(profileGovernanceMigration).toContain(
      "SET search_path = pg_catalog, public, private",
    );
    expect(profileValidationSchema).not.toContain("community_reputation_score");
    expect(profileEditPage).not.toContain("community_reputation_score");
    expect(profileService).not.toContain("getRanking(");
    expect(profileRepository).not.toContain("incrementPoints(");
    expect(profileRepository).not.toContain("findTopByPoints(");
    expect(
      existsSync(join(root, "src/modules/admin/pages/AdminGamificacao.tsx")),
    ).toBe(false);
    expect(
      existsSync(
        join(root, "src/modules/admin/components/UserReputationManager.tsx"),
      ),
    ).toBe(false);
  });

  it("keeps audit data internal and excludes social content payloads", () => {
    expect(migration).toContain(
      "security-authority: internal-table public.community_social_audit_log",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.community_social_audit_log FROM PUBLIC, anon, authenticated",
    );

    const auditFunction = migration.slice(
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION private.audit_community_social_change",
      ),
      migration.indexOf("COMMENT ON TABLE public.post_share_events"),
    );
    expect(auditFunction).not.toContain("v_new->>'content'");
    expect(auditFunction).not.toContain("v_old->>'content'");
    expect(auditFunction).not.toContain("media_url");
  });
});
