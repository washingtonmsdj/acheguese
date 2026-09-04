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

const credentialCandidates = [
  [process.env.E2E_USER_EMAIL, process.env.E2E_USER_PASSWORD],
  [process.env.TEST_DRIVER_EMAIL, process.env.TEST_DRIVER_PASSWORD],
  [process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD],
  [
    process.env.E2E_EDUCATION_OWNER_EMAIL,
    process.env.E2E_EDUCATION_OWNER_PASSWORD,
  ],
  [process.env.E2E_NETWORK_USER_EMAIL, process.env.E2E_NETWORK_USER_PASSWORD],
].filter(([email, password]) => email?.trim() && password?.trim());

if (credentialCandidates.length === 0) {
  throw new Error("At least one E2E credential pair is required");
}

const userClient = createAnonClient({ envFiles });
const admin = wrapOperationalTechnicalAuthClient(
  createServiceRoleClient({ envFiles }),
  operationalConfig.url,
);
const outcomes = [];
let fixturePostId;
let unexpectedSpoofedPostId;
let temporaryUserId;

try {
  let ownProfile;
  for (const [rawEmail, rawPassword] of credentialCandidates) {
    const { data: authData, error: authError } =
      await userClient.auth.signInWithPassword({
        email: rawEmail.trim(),
        password: rawPassword.trim(),
      });
    if (authError || !authData.user) continue;

    const { data: candidateProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    const { data: candidateRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);
    const hasPrivilegedRole = (candidateRoles ?? []).some(({ role }) =>
      ["admin", "super_admin"].includes(role),
    );
    if (candidateProfile && !hasPrivilegedRole) {
      ownProfile = candidateProfile;
      break;
    }
    await userClient.auth.signOut();
  }
  if (!ownProfile) {
    const temporaryPassword = `Aa1!${randomUUID()}`;
    const { data: temporaryAuth, error: temporaryAuthError } =
      await admin.auth.admin.createUser({
        email: `community-security-probe-${randomUUID()}@example.invalid`,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: "Community Security Probe" },
      });
    if (temporaryAuthError || !temporaryAuth.user) {
      throw new Error(
        `Unable to create temporary auth identity (${temporaryAuthError?.status ?? "unknown"}: ${temporaryAuthError?.message ?? "unknown"})`,
      );
    }
    temporaryUserId = temporaryAuth.user.id;

    const { error: temporarySignInError } =
      await userClient.auth.signInWithPassword({
        email: temporaryAuth.user.email,
        password: temporaryPassword,
      });
    if (temporarySignInError) {
      throw new Error(
        `Unable to authenticate temporary identity (${temporarySignInError.status ?? "unknown"})`,
      );
    }

    const { data: temporaryProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", temporaryUserId)
      .maybeSingle();
    if (!temporaryProfile) {
      throw new Error("Temporary auth identity has no canonical profile");
    }
    ownProfile = temporaryProfile;
  }

  const { data: sourcePost, error: sourceError } = await admin
    .from("posts")
    .select("author_profile_id, location_id")
    .neq("author_profile_id", ownProfile.id)
    .not("location_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (
    sourceError ||
    !sourcePost?.author_profile_id ||
    !sourcePost.location_id
  ) {
    throw new Error(
      "No foreign Community post scope is available for the authz probe",
    );
  }

  const fixtureContent = `Private authorization fixture ${randomUUID()}`;
  const { data: fixture, error: fixtureError } = await admin
    .from("posts")
    .insert({
      author_profile_id: sourcePost.author_profile_id,
      location_id: sourcePost.location_id,
      type: "post",
      content: fixtureContent,
      images: [],
      tags: [],
      distribution_channels: [],
      is_published: false,
    })
    .select("id")
    .single();
  if (fixtureError || !fixture) {
    throw new Error(
      `Unable to create authz fixture (${fixtureError?.code ?? "unknown"}: ${fixtureError?.message ?? "unknown"})`,
    );
  }
  fixturePostId = fixture.id;

  const spoofMarker = `Spoofed author probe ${randomUUID()}`;
  await userClient.from("posts").insert({
    author_profile_id: sourcePost.author_profile_id,
    location_id: sourcePost.location_id,
    type: "post",
    content: spoofMarker,
    images: [],
  });
  const { data: spoofedRows } = await admin
    .from("posts")
    .select("id")
    .eq("content", spoofMarker);
  unexpectedSpoofedPostId = spoofedRows?.[0]?.id;
  outcomes.push({
    operation: "authenticated_author_spoof_insert",
    blocked: !unexpectedSpoofedPostId,
  });

  const attackedContent = `Unauthorized update probe ${randomUUID()}`;
  await userClient
    .from("posts")
    .update({ content: attackedContent })
    .eq("id", fixturePostId);
  const { data: afterUpdate } = await admin
    .from("posts")
    .select("content")
    .eq("id", fixturePostId)
    .maybeSingle();
  outcomes.push({
    operation: "authenticated_foreign_post_update",
    blocked: afterUpdate?.content === fixtureContent,
  });

  await userClient.from("posts").delete().eq("id", fixturePostId);
  const { data: afterDelete } = await admin
    .from("posts")
    .select("id")
    .eq("id", fixturePostId)
    .maybeSingle();
  outcomes.push({
    operation: "authenticated_foreign_post_delete",
    blocked: afterDelete?.id === fixturePostId,
  });
} finally {
  if (unexpectedSpoofedPostId) {
    await admin.from("posts").delete().eq("id", unexpectedSpoofedPostId);
  }
  if (fixturePostId) {
    await admin.from("posts").delete().eq("id", fixturePostId);
  }
  await userClient.auth.signOut();
  if (temporaryUserId) {
    await admin.auth.admin.deleteUser(temporaryUserId);
  }
}

process.stdout.write(`${JSON.stringify({ outcomes }, null, 2)}\n`);

if (outcomes.length !== 3 || outcomes.some((outcome) => !outcome.blocked)) {
  throw new Error("Community post authorization probe failed");
}
