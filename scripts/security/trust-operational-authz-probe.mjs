import { randomUUID } from "node:crypto";
import {
  createAnonClient,
  createServiceRoleClient,
  issuePrivateAlphaInvite,
  loadSupabaseScriptEnv,
} from "../lib/supabase-client.mjs";

const envFiles = [
  ".env.local",
  ".env.e2e.network",
  ".env.remote",
  ".env.test",
  ".env",
];
loadSupabaseScriptEnv(envFiles);

const serviceRole = createServiceRoleClient({ envFiles });
const anonymous = createAnonClient({ envFiles });
const temporaryUserIds = [];
const cleanupErrors = [];
const outcomes = [];

async function createIdentity(label, role = "user") {
  const email = `trust-authz-${label}-${randomUUID()}@example.invalid`;
  const password = `Aa1!${randomUUID()}`;
  await issuePrivateAlphaInvite(serviceRole, email, "security_probe");
  const { data: authData, error: authError } =
    await serviceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Trust Authz Probe ${label}`,
        terms_accepted: true,
        terms_version: "2026-07-13",
      },
    });

  if (authError || !authData.user) {
    throw new Error(
      `Unable to create ${label} identity (${authError?.status ?? "unknown"}: ${authError?.message ?? "missing user"})`,
    );
  }
  temporaryUserIds.push(authData.user.id);

  if (role === "admin") {
    const { error } = await serviceRole.from("user_roles").insert({
      user_id: authData.user.id,
      role: "admin",
      role_enum: "admin",
      reason: "Temporary Trust authorization probe",
    });
    if (error) throw new Error(`Unable to grant ${label} admin role`);
  }

  const { data: profile, error: profileError } = await serviceRole
    .from("profiles")
    .select("id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    throw new Error(`Unable to resolve ${label} Profile`);
  }

  const { error: activationError } = await serviceRole
    .from("profiles")
    .update({ is_active: true, is_suspended: false, suspended: false })
    .eq("id", profile.id);
  if (activationError) throw new Error(`Unable to activate ${label} Profile`);

  const client = createAnonClient({ envFiles });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(`Unable to authenticate ${label} identity`);

  return { client, profileId: profile.id };
}

function record(operation, passed, allowed) {
  outcomes.push({ operation, allowed, passed });
  if (!passed) throw new Error(`${operation} failed`);
}

async function requireDenied(operation, request) {
  const { error } = await request();
  record(operation, Boolean(error), false);
}

try {
  const ordinaryIdentity = await createIdentity("ordinary");
  const adminIdentity = await createIdentity("admin", "admin");
  const ordinary = ordinaryIdentity.client;
  const admin = adminIdentity.client;
  const randomId = randomUUID();

  await requireDenied("anonymous_trust_events_read", () =>
    anonymous.from("trust_events").select("id").limit(1),
  );
  await requireDenied("ordinary_trust_events_read", () =>
    ordinary.from("trust_events").select("id").limit(1),
  );
  await requireDenied("admin_direct_trust_events_read", () =>
    admin.from("trust_events").select("id").limit(1),
  );
  await requireDenied("ordinary_trust_admin_actions_read", () =>
    ordinary.from("trust_admin_actions").select("id").limit(1),
  );
  await requireDenied("ordinary_ride_rating_direct_write", () =>
    ordinary.from("ride_ratings").insert({
      ride_id: randomId,
      rater_id: ordinaryIdentity.profileId,
      rated_id: adminIdentity.profileId,
      rating: 5,
    }),
  );

  await requireDenied("anonymous_policy_read", () =>
    anonymous.rpc("get_current_trust_policy_decision", {
      p_role: "customer",
    }),
  );
  await requireDenied("ordinary_admin_queue_read", () =>
    ordinary.rpc("list_trust_events_admin", { p_limit: 10 }),
  );
  await requireDenied("anonymous_review_aggregate_admin_read", () =>
    anonymous.rpc("get_review_aggregates_admin", {
      p_profile_ids: [ordinaryIdentity.profileId],
      p_review_type: "business",
    }),
  );
  await requireDenied("ordinary_review_aggregate_admin_read", () =>
    ordinary.rpc("get_review_aggregates_admin", {
      p_profile_ids: [ordinaryIdentity.profileId],
      p_review_type: "business",
    }),
  );
  await requireDenied("service_role_without_identity_admin_queue_read", () =>
    serviceRole.rpc("list_trust_events_admin", { p_limit: 10 }),
  );

  for (const [operation, functionName, args] of [
    [
      "ordinary_fake_classified_feedback",
      "submit_classified_trust_feedback",
      {
        p_classified_id: randomId,
        p_subject_profile_id: adminIdentity.profileId,
        p_rating: 5,
        p_reason_code: "smooth_negotiation",
      },
    ],
    [
      "ordinary_fake_order_feedback",
      "submit_order_trust_feedback",
      {
        p_order_id: randomId,
        p_subject_profile_id: adminIdentity.profileId,
        p_rating: 5,
        p_reason_code: "smooth_operation",
      },
    ],
    [
      "ordinary_fake_ride_feedback",
      "submit_ride_trust_feedback",
      {
        p_ride_id: randomId,
        p_subject_profile_id: adminIdentity.profileId,
        p_rating: 5,
        p_reason_code: "smooth_operation",
      },
    ],
    [
      "ordinary_fake_work_feedback",
      "submit_work_opportunity_feedback",
      { p_opportunity_id: randomId, p_answer: "helped" },
    ],
    [
      "ordinary_fake_ride_rating",
      "submit_ride_rating",
      { p_ride_id: randomId, p_rating: 5 },
    ],
  ]) {
    await requireDenied(operation, () => ordinary.rpc(functionName, args));
  }

  const { data: policy, error: policyError } = await ordinary.rpc(
    "get_current_trust_policy_decision",
    { p_role: "customer" },
  );
  record(
    "ordinary_own_policy_read",
    !policyError && policy?.profile_id === ordinaryIdentity.profileId,
    true,
  );

  const { data: ratingSummary, error: ratingSummaryError } =
    await anonymous.rpc("get_ride_rating_summary", {
      p_profile_id: randomId,
    });
  record(
    "anonymous_aggregate_rating_read",
    !ratingSummaryError &&
      ratingSummary?.profile_id === randomId &&
      ratingSummary?.total_ratings === 0,
    true,
  );

  const { data: events, error: eventsError } = await admin.rpc(
    "list_trust_events_admin",
    { p_limit: 10 },
  );
  record(
    "admin_bounded_trust_queue_read",
    !eventsError && Array.isArray(events) && events.length <= 10,
    true,
  );

  const { data: actions, error: actionsError } = await admin.rpc(
    "list_trust_admin_actions_admin",
    { p_limit: 10 },
  );
  record(
    "admin_bounded_trust_action_read",
    !actionsError && Array.isArray(actions) && actions.length <= 10,
    true,
  );

  const { data: reviewAggregates, error: reviewAggregatesError } =
    await admin.rpc("get_review_aggregates_admin", {
      p_profile_ids: [ordinaryIdentity.profileId, adminIdentity.profileId],
      p_review_type: "business",
    });
  record(
    "admin_bounded_review_aggregate_read",
    !reviewAggregatesError &&
      Array.isArray(reviewAggregates) &&
      reviewAggregates.length <= 2,
    true,
  );

  await ordinary.auth.signOut();
  await admin.auth.signOut();
} finally {
  await anonymous.auth.signOut();
  for (const userId of temporaryUserIds.reverse()) {
    const { error } = await serviceRole.auth.admin.deleteUser(userId);
    if (error) cleanupErrors.push(error);
  }
}

process.stdout.write(`${JSON.stringify({ outcomes }, null, 2)}\n`);

if (
  outcomes.length !== 20 ||
  outcomes.some((outcome) => !outcome.passed) ||
  cleanupErrors.length > 0
) {
  throw new Error("Trust operational authorization probe failed");
}
