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

const admin = wrapOperationalTechnicalAuthClient(
  createServiceRoleClient({ envFiles }),
  operationalConfig.url,
);
const anonymous = createAnonClient({ envFiles });
const identities = [];
const outcomes = [];
let fixturePostId;
let fixtureLinkId;
let threadId;

async function createIdentity(label) {
  const email = `community-dm-${label}-${randomUUID()}@example.com`;
  const password = `Aa1!${randomUUID()}`;
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Community DM Probe ${label}`,
        terms_accepted: true,
        terms_version: "2026-07-13",
      },
    });

  if (authError || !authData.user) {
    throw new Error(
      `Unable to create ${label} identity (${authError?.status ?? "unknown"}: ${authError?.message ?? "unknown"})`,
    );
  }

  const identity = {
    client: createAnonClient({ envFiles }),
    email,
    password,
    profileId: undefined,
    userId: authData.user.id,
  };
  identities.push(identity);

  let { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Unable to read ${label} Profile (${profileError.code ?? "unknown"})`,
    );
  }

  if (!profile) {
    const { data: insertedProfile, error: insertProfileError } = await admin
      .from("profiles")
      .insert({
        user_id: identity.userId,
        name: `Community DM Probe ${label}`,
        is_active: true,
      })
      .select("id")
      .single();
    if (insertProfileError || !insertedProfile) {
      throw new Error(
        `Unable to create ${label} Profile (${insertProfileError?.code ?? "unknown"})`,
      );
    }
    profile = insertedProfile;
  }

  const { error: activateError } = await admin
    .from("profiles")
    .update({ is_active: true, is_suspended: false, suspended: false })
    .eq("id", profile.id);
  if (activateError) {
    throw new Error(
      `Unable to activate ${label} Profile (${activateError.code ?? "unknown"})`,
    );
  }
  identity.profileId = profile.id;

  const { error: signInError } = await identity.client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw new Error(
      `Unable to authenticate ${label} identity (${signInError.status ?? "unknown"})`,
    );
  }

  return identity;
}

async function requireDenied(label, operation) {
  const { error } = await operation();
  const denied = Boolean(error);
  outcomes.push({ operation: label, allowed: false, passed: denied });
  if (!denied) {
    throw new Error(`${label} was unexpectedly allowed`);
  }
}

function requireAllowed(label, error) {
  const allowed = !error;
  outcomes.push({ operation: label, allowed: true, passed: allowed });
  if (error) {
    throw new Error(
      `${label} failed (${error.code ?? "unknown"}: ${error.message ?? "unknown"})`,
    );
  }
}

try {
  const { data: community, error: communityError } = await admin
    .from("territory_communities")
    .select("id, city_id, territory_id, territory_type")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (communityError || !community?.territory_id) {
    throw new Error(
      "No active territorial Community is available for the probe",
    );
  }

  const locationCandidates = [community.territory_id, community.city_id].filter(
    (value, index, values) => value && values.indexOf(value) === index,
  );
  const { data: locations, error: locationsError } = await admin
    .from("locations")
    .select("id, type")
    .in("id", locationCandidates)
    .eq("status", "active")
    .in("type", ["city", "district", "neighborhood"]);
  if (locationsError) {
    throw new Error(
      `Unable to resolve the probe Post location (${locationsError.code ?? "unknown"})`,
    );
  }
  const canonicalPostLocationId = locationCandidates.find((candidate) =>
    locations?.some((location) => location.id === candidate),
  );
  if (!canonicalPostLocationId) {
    throw new Error(
      `Community territory type ${community.territory_type} has no canonical Post location`,
    );
  }

  const actor = await createIdentity("actor");
  const recipient = await createIdentity("recipient");
  const outsider = await createIdentity("outsider");
  const now = new Date().toISOString();

  const { error: membershipError } = await admin
    .from("community_memberships")
    .insert(
      [actor, recipient].map((identity) => ({
        community_id: community.id,
        profile_id: identity.profileId,
        user_id: identity.userId,
        role: "member",
        status: "active",
        join_method: "admin_created",
        approved_at: now,
        joined_at: now,
        metadata: { source: "community_dm_authz_probe" },
      })),
    );
  if (membershipError) {
    throw new Error(
      `Unable to create probe memberships (${membershipError.code ?? "unknown"}: ${membershipError.message ?? "unknown"})`,
    );
  }

  const postContent = `Community DM authorization fixture ${randomUUID()}`;
  const { data: post, error: postError } = await admin
    .from("posts")
    .insert({
      author_profile_id: recipient.profileId,
      location_id: canonicalPostLocationId,
      type: "post",
      content: postContent,
      images: [],
      tags: [],
      distribution_channels: [],
      is_published: true,
      is_hidden: false,
      is_removed: false,
    })
    .select("id")
    .single();
  if (postError || !post) {
    throw new Error(
      `Unable to create probe Post (${postError?.code ?? "unknown"}: ${postError?.message ?? "unknown"})`,
    );
  }
  fixturePostId = post.id;

  const { data: link, error: linkError } = await admin
    .from("community_entity_links")
    .insert({
      community_id: community.id,
      entity_type: "post",
      entity_id: fixturePostId,
      link_type: "official",
      status: "active",
      created_by_profile_id: recipient.profileId,
      approved_by_profile_id: recipient.profileId,
      approved_at: now,
      metadata: { source: "community_dm_authz_probe" },
    })
    .select("id")
    .single();
  if (linkError || !link) {
    throw new Error(
      `Unable to create probe Community link (${linkError?.code ?? "unknown"}: ${linkError?.message ?? "unknown"})`,
    );
  }
  fixtureLinkId = link.id;

  await requireDenied("anonymous_thread_create", () =>
    anonymous.rpc("create_community_direct_thread", {
      p_profile_id: actor.profileId,
      p_community_id: community.id,
      p_post_id: fixturePostId,
      p_recipient_profile_id: recipient.profileId,
    }),
  );

  await requireDenied("profile_spoof_thread_create", () =>
    actor.client.rpc("create_community_direct_thread", {
      p_profile_id: recipient.profileId,
      p_community_id: community.id,
      p_post_id: fixturePostId,
      p_recipient_profile_id: actor.profileId,
    }),
  );

  await requireDenied("non_member_thread_create", () =>
    outsider.client.rpc("create_community_direct_thread", {
      p_profile_id: outsider.profileId,
      p_community_id: community.id,
      p_post_id: fixturePostId,
      p_recipient_profile_id: recipient.profileId,
    }),
  );

  const { data: createdThreadId, error: createThreadError } =
    await actor.client.rpc("create_community_direct_thread", {
      p_profile_id: actor.profileId,
      p_community_id: community.id,
      p_post_id: fixturePostId,
      p_recipient_profile_id: recipient.profileId,
    });
  requireAllowed("member_thread_create", createThreadError);
  if (typeof createdThreadId !== "string") {
    throw new Error("Community Direct Messaging did not return a thread ID");
  }
  threadId = createdThreadId;

  const bypassBody = `Direct write bypass ${randomUUID()}`;
  await requireDenied("direct_message_table_insert", () =>
    actor.client.from("community_direct_messages").insert({
      thread_id: threadId,
      sender_profile_id: actor.profileId,
      body: bypassBody,
    }),
  );

  const privateBody = `Private probe body ${randomUUID()}`;
  const { data: sentRows, error: sendError } = await actor.client.rpc(
    "send_community_direct_message",
    {
      p_profile_id: actor.profileId,
      p_thread_id: threadId,
      p_body: privateBody,
    },
  );
  requireAllowed("participant_message_send", sendError);
  const sentMessage = Array.isArray(sentRows) ? sentRows[0] : undefined;
  if (!sentMessage?.id || sentMessage.body !== privateBody) {
    throw new Error("Sent Community message did not satisfy its RPC contract");
  }

  const { data: actorInbox, error: actorInboxError } = await actor.client.rpc(
    "list_community_direct_thread_previews",
    { p_profile_id: actor.profileId, p_limit: 2 },
  );
  requireAllowed("participant_inbox_read", actorInboxError);
  if (!actorInbox?.some((item) => item.id === threadId)) {
    throw new Error("Participant inbox omitted the probe thread");
  }

  const { data: actorMessages, error: actorMessagesError } =
    await actor.client.rpc("list_community_direct_messages", {
      p_profile_id: actor.profileId,
      p_thread_id: threadId,
      p_limit: 2,
    });
  requireAllowed("participant_message_read", actorMessagesError);
  if (!actorMessages?.some((message) => message.body === privateBody)) {
    throw new Error("Participant message page omitted the probe message");
  }

  await requireDenied("outsider_message_rpc_read", () =>
    outsider.client.rpc("list_community_direct_messages", {
      p_profile_id: outsider.profileId,
      p_thread_id: threadId,
      p_limit: 2,
    }),
  );

  const { data: outsiderRows, error: outsiderReadError } = await outsider.client
    .from("community_direct_messages")
    .select("id, body")
    .eq("thread_id", threadId);
  requireAllowed("outsider_rls_query", outsiderReadError);
  const outsiderSeesNothing = (outsiderRows ?? []).length === 0;
  outcomes.push({
    operation: "outsider_rls_visibility",
    allowed: false,
    passed: outsiderSeesNothing,
  });
  if (!outsiderSeesNothing) {
    throw new Error(
      "Outsider could read a private Community message through RLS",
    );
  }

  const { data: recipientMessages, error: recipientMessagesError } =
    await recipient.client.rpc("list_community_direct_messages", {
      p_profile_id: recipient.profileId,
      p_thread_id: threadId,
      p_limit: 2,
    });
  requireAllowed("recipient_message_read", recipientMessagesError);
  if (!recipientMessages?.some((message) => message.id === sentMessage.id)) {
    throw new Error("Recipient message page omitted the probe message");
  }

  const { data: reportId, error: reportError } = await recipient.client.rpc(
    "report_community_direct_thread",
    {
      p_profile_id: recipient.profileId,
      p_thread_id: threadId,
      p_message_id: sentMessage.id,
      p_reason: "spam",
      p_description: "Automated authorization probe",
    },
  );
  requireAllowed("participant_report_and_block", reportError);
  if (typeof reportId !== "string") {
    throw new Error("Community Direct Messaging did not return a report ID");
  }

  await requireDenied("non_admin_report_moderation", () =>
    actor.client.rpc("moderate_community_direct_report", {
      p_report_id: reportId,
      p_action: "dismiss",
      p_resolution_notes: "Unauthorized moderation probe",
    }),
  );

  await requireDenied("message_send_after_block", () =>
    actor.client.rpc("send_community_direct_message", {
      p_profile_id: actor.profileId,
      p_thread_id: threadId,
      p_body: "This send must be denied after the report block",
    }),
  );

  const { data: duplicateReportId, error: duplicateReportError } =
    await recipient.client.rpc("report_community_direct_thread", {
      p_profile_id: recipient.profileId,
      p_thread_id: threadId,
      p_message_id: sentMessage.id,
      p_reason: "spam",
      p_description: "Duplicate authorization probe",
    });
  requireAllowed("pending_report_deduplication", duplicateReportError);
  if (duplicateReportId !== reportId) {
    throw new Error("Pending Community Direct Messaging report was duplicated");
  }
} finally {
  if (threadId) {
    await admin.from("community_direct_threads").delete().eq("id", threadId);
  }
  if (fixtureLinkId) {
    await admin.from("community_entity_links").delete().eq("id", fixtureLinkId);
  }
  if (fixturePostId) {
    await admin.from("posts").delete().eq("id", fixturePostId);
  }
  for (const identity of identities) {
    await identity.client.auth.signOut();
  }
  for (const identity of identities.reverse()) {
    await admin.auth.admin.deleteUser(identity.userId);
  }
}

process.stdout.write(
  `${JSON.stringify(
    {
      passed:
        outcomes.length > 0 && outcomes.every((outcome) => outcome.passed),
      outcomes,
    },
    null,
    2,
  )}\n`,
);

if (outcomes.length !== 16 || outcomes.some((outcome) => !outcome.passed)) {
  throw new Error("Community Direct Messaging authorization probe failed");
}
