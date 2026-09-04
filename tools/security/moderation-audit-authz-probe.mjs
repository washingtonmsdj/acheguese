import { randomUUID } from "node:crypto";
import {
  createAnonClient,
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "../supabase/supabase-client.mjs";
import { wrapOperationalTechnicalAuthClient } from "../supabase/operational-alpha-invite.mjs";

const envFiles = [
  ".env.local",
  ".env.e2e.network",
  ".env.remote",
  ".env.test",
  ".env",
];
loadSupabaseScriptEnv(envFiles);
const operationalConfig = getSupabaseConfig({ envFiles });

const serviceRole = wrapOperationalTechnicalAuthClient(
  createServiceRoleClient({ envFiles }),
  operationalConfig.url,
);
const anonymous = createAnonClient({ envFiles });
const temporaryUserIds = [];
const outcomes = [];
const cleanupErrors = [];
let ordinaryIdentity;
let fixtureCommentId;
let fixtureLostFoundPostId;
let fixtureLostFoundCommentId;
let fixtureAnswerId;
let fixtureBanId;

async function createIdentity(label, role = "user") {
  const email = `federated-moderation-${label}-${randomUUID()}@example.invalid`;
  const password = `Aa1!${randomUUID()}`;
  const { data: authData, error: authError } =
    await serviceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Federated Moderation Probe ${label}`,
        terms_accepted: true,
        terms_version: "2026-07-13",
      },
    });

  if (authError || !authData.user) {
    throw new Error(
      `Unable to create ${label} identity (${authError?.status ?? "unknown"}: ${authError?.message ?? "unknown"})`,
    );
  }
  temporaryUserIds.push(authData.user.id);

  if (role === "admin") {
    const { error: roleError } = await serviceRole.from("user_roles").insert({
      user_id: authData.user.id,
      role: "admin",
      role_enum: "admin",
      reason: "Temporary federated moderation authorization probe",
    });
    if (roleError) {
      throw new Error(
        `Unable to grant temporary admin role (${roleError.code ?? "unknown"}: ${roleError.message ?? "unknown"})`,
      );
    }
  }

  const { data: profile, error: profileError } = await serviceRole
    .from("profiles")
    .select("id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    throw new Error(`Unable to resolve ${label} canonical Profile`);
  }
  const { error: activationError } = await serviceRole
    .from("profiles")
    .update({ is_active: true, is_suspended: false, suspended: false })
    .eq("id", profile.id);
  if (activationError) {
    throw new Error(`Unable to activate ${label} canonical Profile`);
  }

  const client = createAnonClient({ envFiles });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw new Error(
      `Unable to authenticate ${label} identity (${signInError.status ?? "unknown"}: ${signInError.message})`,
    );
  }

  return {
    client,
    profileId: profile.id,
    userId: authData.user.id,
  };
}

function record(operation, passed, allowed) {
  outcomes.push({ operation, allowed, passed });
  if (!passed) throw new Error(`${operation} failed`);
}

async function requireDenied(operation, request) {
  const { error } = await request();
  record(operation, Boolean(error), false);
}

function requireAllowed(operation, data, error, expectedKeys) {
  const hasOnlyMetadata = (data ?? []).every((item) => {
    const keys = Object.keys(item).sort();
    return keys.join(",") === [...expectedKeys].sort().join(",");
  });
  record(
    operation,
    !error && Array.isArray(data) && data.length <= 51 && hasOnlyMetadata,
    true,
  );
}

async function createReport(identity, targetType, targetId) {
  const { data, error } = await identity.client
    .from("community_reports")
    .insert({
      target_type: targetType,
      target_id: targetId,
      reason: "spam",
      description: `Authorization probe ${targetType}`,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(
      `ordinary_user_${targetType}_report failed (${error?.code ?? "unknown"}: ${error?.message ?? "missing row"})`,
    );
  }
  record(`ordinary_user_${targetType}_report`, true, true);
}

try {
  ordinaryIdentity = await createIdentity("ordinary-user");
  const adminIdentity = await createIdentity("admin", "admin");
  const ordinaryUser = ordinaryIdentity.client;
  const adminUser = adminIdentity.client;

  await requireDenied("anonymous_queue_read", () =>
    anonymous.rpc("list_federated_moderation_queue"),
  );
  await requireDenied("service_role_without_identity_queue_read", () =>
    serviceRole.rpc("list_federated_moderation_queue"),
  );
  await requireDenied("ordinary_user_queue_read", () =>
    ordinaryUser.rpc("list_federated_moderation_queue"),
  );

  const { data: queue, error: queueError } = await adminUser.rpc(
    "list_federated_moderation_queue",
    { p_limit: 100 },
  );
  requireAllowed("admin_bounded_metadata_queue_read", queue, queueError, [
    "created_at",
    "domain",
    "queue_state",
    "reason_code",
    "report_count",
    "report_id",
    "source_status",
    "target_id",
    "target_type",
  ]);

  await requireDenied("admin_invalid_queue_state", () =>
    adminUser.rpc("list_federated_moderation_queue", {
      p_queue_state: "unknown",
    }),
  );
  await requireDenied("admin_invalid_domain", () =>
    adminUser.rpc("list_federated_moderation_queue", {
      p_domain: "unknown",
    }),
  );
  await requireDenied("admin_incomplete_cursor", () =>
    adminUser.rpc("list_federated_moderation_queue", {
      p_before_created_at: new Date().toISOString(),
    }),
  );

  await requireDenied("anonymous_community_audit_read", () =>
    anonymous.rpc("list_community_social_audit_events"),
  );
  await requireDenied(
    "service_role_without_identity_community_audit_read",
    () => serviceRole.rpc("list_community_social_audit_events"),
  );
  await requireDenied("ordinary_user_community_audit_read", () =>
    ordinaryUser.rpc("list_community_social_audit_events"),
  );
  await requireDenied("admin_direct_community_audit_table_read", () =>
    adminUser.from("community_social_audit_log").select("id").limit(1),
  );

  const { data: auditEvents, error: auditError } = await adminUser.rpc(
    "list_community_social_audit_events",
    { p_limit: 100 },
  );
  requireAllowed(
    "admin_bounded_community_audit_read",
    auditEvents,
    auditError,
    [
      "action",
      "actor_profile_id",
      "actor_user_id",
      "created_at",
      "id",
      "location_id",
      "metadata",
      "target_id",
      "target_type",
    ],
  );

  await requireDenied("admin_incomplete_community_audit_cursor", () =>
    adminUser.rpc("list_community_social_audit_events", {
      p_before_created_at: new Date().toISOString(),
    }),
  );

  const { data: sourcePost, error: sourcePostError } = await serviceRole
    .from("posts")
    .select("id,author_profile_id")
    .neq("author_profile_id", ordinaryIdentity.profileId)
    .limit(1)
    .single();
  const { data: sourceQuestion, error: sourceQuestionError } = await serviceRole
    .from("community_questions")
    .select("id,author_profile_id")
    .neq("author_profile_id", ordinaryIdentity.profileId)
    .limit(1)
    .single();
  if (
    sourcePostError ||
    !sourcePost ||
    sourceQuestionError ||
    !sourceQuestion
  ) {
    throw new Error("Community report connector fixtures are unavailable");
  }

  const targetAuthorProfileId = sourcePost.author_profile_id;
  const { data: fixtureComment, error: fixtureCommentError } = await serviceRole
    .from("comments")
    .insert({
      post_id: sourcePost.id,
      author_profile_id: targetAuthorProfileId,
      content: `Moderation connector probe ${randomUUID()}`,
    })
    .select("id")
    .single();
  if (fixtureCommentError || !fixtureComment) {
    throw new Error("Unable to create Comment report fixture");
  }
  fixtureCommentId = fixtureComment.id;

  const { data: fixtureLostFoundPost, error: fixtureLostFoundPostError } =
    await serviceRole
      .from("lost_found_posts")
      .insert({
        autor_id: targetAuthorProfileId,
        tipo: "perdido",
        titulo: "Moderation connector probe",
        descricao: "Temporary lost and found report target",
        categoria: "outro",
        imagens: [],
      })
      .select("id")
      .single();
  if (fixtureLostFoundPostError || !fixtureLostFoundPost) {
    throw new Error("Unable to create Lost Found report fixture");
  }
  fixtureLostFoundPostId = fixtureLostFoundPost.id;

  const { data: fixtureLostFoundComment, error: fixtureLostFoundCommentError } =
    await serviceRole
      .from("lost_found_comments")
      .insert({
        post_id: fixtureLostFoundPostId,
        autor_id: targetAuthorProfileId,
        conteudo: "Temporary lost and found report target",
      })
      .select("id")
      .single();
  if (fixtureLostFoundCommentError || !fixtureLostFoundComment) {
    throw new Error("Unable to create Lost Found Comment report fixture");
  }
  fixtureLostFoundCommentId = fixtureLostFoundComment.id;

  const { data: fixtureAnswer, error: fixtureAnswerError } = await serviceRole
    .from("question_answers")
    .insert({
      question_id: sourceQuestion.id,
      author_profile_id: targetAuthorProfileId,
      content: "Temporary Community answer report target",
    })
    .select("id")
    .single();
  if (fixtureAnswerError || !fixtureAnswer) {
    throw new Error("Unable to create Answer report fixture");
  }
  fixtureAnswerId = fixtureAnswer.id;

  await requireDenied("invalid_community_report_reason", () =>
    ordinaryUser.from("community_reports").insert({
      target_type: "post",
      target_id: sourcePost.id,
      reason: "legacy_reason",
    }),
  );
  await requireDenied("invalid_community_report_target_type", () =>
    ordinaryUser.from("community_reports").insert({
      target_type: "unknown",
      target_id: randomUUID(),
      reason: "spam",
    }),
  );

  await createReport(ordinaryIdentity, "post", sourcePost.id);
  await createReport(ordinaryIdentity, "comment", fixtureCommentId);
  await createReport(ordinaryIdentity, "profile", targetAuthorProfileId);
  await createReport(
    ordinaryIdentity,
    "lost_found_post",
    fixtureLostFoundPostId,
  );
  await createReport(
    ordinaryIdentity,
    "lost_found_comment",
    fixtureLostFoundCommentId,
  );
  await createReport(ordinaryIdentity, "question", sourceQuestion.id);
  await createReport(ordinaryIdentity, "answer", fixtureAnswerId);

  await requireDenied("anonymous_active_ban_read", () =>
    anonymous.rpc("has_current_active_ban"),
  );
  await requireDenied("service_role_without_identity_active_ban_read", () =>
    serviceRole.rpc("has_current_active_ban"),
  );
  await requireDenied("ordinary_user_direct_ban_table_read", () =>
    ordinaryUser.from("banned_users").select("id").limit(1),
  );
  await requireDenied("admin_direct_ban_table_read", () =>
    adminUser.from("banned_users").select("id").limit(1),
  );

  const { data: noActiveBan, error: noActiveBanError } = await ordinaryUser.rpc(
    "has_current_active_ban",
  );
  record(
    "ordinary_user_without_active_ban",
    !noActiveBanError && noActiveBan === false,
    true,
  );

  const { data: fixtureBan, error: fixtureBanError } = await serviceRole
    .from("banned_users")
    .insert({
      user_id: ordinaryIdentity.userId,
      banned_by: adminIdentity.userId,
      reason: "Temporary active-ban authorization probe",
      is_active: true,
      banned_at: new Date().toISOString(),
      expires_at: null,
    })
    .select("id")
    .single();
  if (fixtureBanError || !fixtureBan) {
    throw new Error("Unable to create active-ban probe fixture");
  }
  fixtureBanId = fixtureBan.id;

  const { data: hasActiveBan, error: hasActiveBanError } =
    await ordinaryUser.rpc("has_current_active_ban");
  record(
    "ordinary_user_with_active_ban",
    !hasActiveBanError && hasActiveBan === true,
    true,
  );

  await ordinaryUser.auth.signOut();
  await adminUser.auth.signOut();
} finally {
  await anonymous.auth.signOut();
  if (ordinaryIdentity?.profileId) {
    const { error } = await serviceRole
      .from("community_reports")
      .delete()
      .eq("reporter_profile_id", ordinaryIdentity.profileId);
    if (error) cleanupErrors.push(error);
  }
  if (fixtureBanId) {
    const { error } = await serviceRole
      .from("banned_users")
      .delete()
      .eq("id", fixtureBanId);
    if (error) cleanupErrors.push(error);
  }
  for (const [table, id] of [
    ["question_answers", fixtureAnswerId],
    ["lost_found_comments", fixtureLostFoundCommentId],
    ["lost_found_posts", fixtureLostFoundPostId],
    ["comments", fixtureCommentId],
  ]) {
    if (!id) continue;
    const { error } = await serviceRole.from(table).delete().eq("id", id);
    if (error) cleanupErrors.push(error);
  }
  for (const userId of temporaryUserIds.reverse()) {
    const { error } = await serviceRole.auth.admin.deleteUser(userId);
    if (error) {
      cleanupErrors.push(error);
    }
  }
}

process.stdout.write(`${JSON.stringify({ outcomes }, null, 2)}\n`);

if (
  outcomes.length !== 28 ||
  outcomes.some((outcome) => !outcome.passed) ||
  cleanupErrors.length > 0
) {
  throw new Error("Moderation and audit authorization probe failed");
}
