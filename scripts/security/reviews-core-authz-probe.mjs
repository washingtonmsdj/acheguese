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

const admin = createServiceRoleClient({ envFiles });
const anonymous = createAnonClient({ envFiles });
const identities = [];
const outcomes = [];
let fixtureJobId;
let reviewerProfileId;
let reviewedProfileId;

async function createIdentity(label) {
  const email = `reviews-core-${label}-${randomUUID()}@example.com`;
  const password = `Aa1!${randomUUID()}`;
  await issuePrivateAlphaInvite(admin, email, "security_probe");
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Reviews Core Probe ${label}`,
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
        name: `Reviews Core Probe ${label}`,
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

function record(label, passed, allowed) {
  outcomes.push({ operation: label, allowed, passed });
  if (!passed) throw new Error(`${label} failed`);
}

async function requireDenied(label, operation) {
  const { error } = await operation();
  record(label, Boolean(error), false);
}

function requireAllowed(label, error) {
  if (error) {
    outcomes.push({ operation: label, allowed: true, passed: false });
    throw new Error(
      `${label} failed (${error.code ?? "unknown"}: ${error.message ?? "unknown"})`,
    );
  }
  outcomes.push({ operation: label, allowed: true, passed: true });
}

async function readStats(profileId) {
  return anonymous.rpc("get_profile_review_stats", {
    p_reviewed_profile_id: profileId,
    p_review_type: "professional",
  });
}

try {
  const { error: businessLegacyError } = await admin
    .from("business_reviews_new")
    .select("id")
    .limit(1);
  record("legacy_business_table_removed", Boolean(businessLegacyError), false);

  const { error: professionalLegacyError } = await admin
    .from("professional_reviews_new")
    .select("id")
    .limit(1);
  record(
    "legacy_professional_table_removed",
    Boolean(professionalLegacyError),
    false,
  );

  const { data: professionalCandidates, error: candidatesError } = await admin
    .from("professional_data")
    .select("id, profile_id")
    .limit(50);
  if (candidatesError || !professionalCandidates?.length) {
    throw new Error("No active professional is available for the probe");
  }

  const candidateProfileIds = professionalCandidates.map(
    (candidate) => candidate.profile_id,
  );
  const { data: candidateProfiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, is_active, is_suspended, suspended, suspended_until")
    .in("id", candidateProfileIds)
    .eq("is_active", true);
  if (profilesError) {
    throw new Error(
      `Unable to inspect professional Profiles (${profilesError.code ?? "unknown"})`,
    );
  }

  const now = Date.now();
  const eligibleProfile = candidateProfiles?.find(
    (profile) =>
      !profile.is_suspended &&
      !profile.suspended &&
      (!profile.suspended_until ||
        new Date(profile.suspended_until).getTime() <= now),
  );
  const targetProfessional = professionalCandidates.find(
    (candidate) => candidate.profile_id === eligibleProfile?.id,
  );
  if (!targetProfessional || !eligibleProfile) {
    throw new Error(
      "No eligible professional Profile is available for the probe",
    );
  }
  reviewedProfileId = eligibleProfile.id;

  const reviewer = await createIdentity("reviewer");
  const voter = await createIdentity("voter");
  const outsider = await createIdentity("outsider");
  reviewerProfileId = reviewer.profileId;

  const { data: baselineStats, error: baselineStatsError } =
    await readStats(reviewedProfileId);
  requireAllowed("public_stats_baseline", baselineStatsError);
  const baselineTotal = Number(baselineStats?.total ?? 0);

  const { data: job, error: jobError } = await admin
    .from("professional_jobs")
    .insert({
      profile_id: reviewedProfileId,
      client_id: reviewer.profileId,
      title: `Reviews Core authorization probe ${randomUUID()}`,
      description: "Temporary completed service for authorization validation",
      status: "completed",
      price: 0,
    })
    .select("id")
    .single();
  if (jobError || !job) {
    throw new Error(
      `Unable to create completed service fixture (${jobError?.code ?? "unknown"}: ${jobError?.message ?? "unknown"})`,
    );
  }
  fixtureJobId = job.id;

  await requireDenied("anonymous_profile_review_upsert", () =>
    anonymous.rpc("upsert_profile_review", {
      p_reviewed_profile_id: reviewedProfileId,
      p_reviewer_profile_id: reviewer.profileId,
      p_rating: 5,
      p_comment: "Anonymous write must fail",
    }),
  );

  await requireDenied("profile_spoof_review_upsert", () =>
    outsider.client.rpc("upsert_profile_review", {
      p_reviewed_profile_id: reviewedProfileId,
      p_reviewer_profile_id: reviewer.profileId,
      p_rating: 5,
      p_comment: "Spoofed reviewer must fail",
    }),
  );

  await requireDenied("ineligible_profile_review_upsert", () =>
    voter.client.rpc("upsert_profile_review", {
      p_reviewed_profile_id: reviewedProfileId,
      p_reviewer_profile_id: voter.profileId,
      p_rating: 5,
      p_comment: "No completed service",
    }),
  );

  await requireDenied("direct_review_table_insert", () =>
    reviewer.client.from("reviews").insert({
      reviewed_profile_id: reviewedProfileId,
      reviewer_profile_id: reviewer.profileId,
      rating: 5,
      comment: "Direct browser write must fail",
      review_type: "professional",
      status: "active",
    }),
  );

  const firstComment = `Authorized profile review ${randomUUID()}`;
  const { data: firstWrite, error: firstWriteError } =
    await reviewer.client.rpc("upsert_profile_review", {
      p_reviewed_profile_id: reviewedProfileId,
      p_reviewer_profile_id: reviewer.profileId,
      p_rating: 5,
      p_comment: firstComment,
    });
  requireAllowed("eligible_profile_review_upsert", firstWriteError);
  const reviewId = firstWrite?.review?.id;
  record(
    "profile_review_create_contract",
    typeof reviewId === "string" && firstWrite?.isNew === true,
    true,
  );

  const { data: canonicalReview, error: canonicalReadError } =
    await reviewer.client
      .from("reviews")
      .select("id, comment, review_type, status")
      .eq("id", reviewId)
      .single();
  requireAllowed("canonical_review_read", canonicalReadError);
  record(
    "canonical_review_shape",
    canonicalReview?.comment === firstComment &&
      canonicalReview?.review_type === "professional" &&
      canonicalReview?.status === "active",
    true,
  );

  const secondComment = `Updated profile review ${randomUUID()}`;
  const { data: secondWrite, error: secondWriteError } =
    await reviewer.client.rpc("upsert_profile_review", {
      p_reviewed_profile_id: reviewedProfileId,
      p_reviewer_profile_id: reviewer.profileId,
      p_rating: 4,
      p_comment: secondComment,
    });
  requireAllowed("eligible_profile_review_update", secondWriteError);
  record(
    "profile_review_update_contract",
    secondWrite?.review?.id === reviewId &&
      secondWrite?.review?.comment === secondComment &&
      secondWrite?.isNew === false,
    true,
  );

  const { data: createdStats, error: createdStatsError } =
    await readStats(reviewedProfileId);
  requireAllowed("public_stats_after_create", createdStatsError);
  record(
    "profile_review_stats_increment",
    Number(createdStats?.total ?? 0) === baselineTotal + 1,
    true,
  );

  await requireDenied("direct_helpfulness_table_insert", () =>
    voter.client.from("review_helpfulness").insert({
      review_id: reviewId,
      voter_profile_id: voter.profileId,
      is_helpful: true,
    }),
  );

  const { data: vote, error: voteError } = await voter.client.rpc(
    "set_review_helpfulness",
    {
      p_review_id: reviewId,
      p_voter_profile_id: voter.profileId,
      p_is_helpful: true,
    },
  );
  requireAllowed("owned_helpfulness_vote", voteError);
  record(
    "helpfulness_vote_contract",
    vote?.review_id === reviewId && vote?.is_helpful === true,
    true,
  );

  const { data: currentVote, error: currentVoteError } = await voter.client.rpc(
    "get_current_review_helpfulness",
    {
      p_review_id: reviewId,
      p_voter_profile_id: voter.profileId,
    },
  );
  requireAllowed("owned_helpfulness_read", currentVoteError);
  record("owned_helpfulness_value", currentVote === true, true);

  await requireDenied("helpfulness_profile_spoof_read", () =>
    outsider.client.rpc("get_current_review_helpfulness", {
      p_review_id: reviewId,
      p_voter_profile_id: voter.profileId,
    }),
  );

  await requireDenied("review_author_self_vote", () =>
    reviewer.client.rpc("set_review_helpfulness", {
      p_review_id: reviewId,
      p_voter_profile_id: reviewer.profileId,
      p_is_helpful: true,
    }),
  );

  const { data: report, error: reportError } = await voter.client.rpc(
    "create_review_report",
    {
      p_review_id: reviewId,
      p_reason: "other",
      p_description: "Automated Reviews Core authorization probe",
    },
  );
  requireAllowed("review_report_command", reportError);
  record("review_report_contract", typeof report?.id === "string", true);

  await requireDenied("outsider_profile_review_delete", () =>
    outsider.client.rpc("delete_profile_review", {
      p_review_id: reviewId,
      p_reviewer_profile_id: reviewer.profileId,
    }),
  );

  const { data: deleted, error: deleteError } = await reviewer.client.rpc(
    "delete_profile_review",
    {
      p_review_id: reviewId,
      p_reviewer_profile_id: reviewer.profileId,
    },
  );
  requireAllowed("owned_profile_review_delete", deleteError);
  record("profile_review_delete_contract", deleted === true, true);

  const { data: publicRows, error: publicReadError } = await anonymous
    .from("reviews")
    .select("id")
    .eq("id", reviewId);
  requireAllowed("public_deleted_review_query", publicReadError);
  record("deleted_review_absent", (publicRows ?? []).length === 0, false);

  const { data: deletedStats, error: deletedStatsError } =
    await readStats(reviewedProfileId);
  requireAllowed("public_stats_after_delete", deletedStatsError);
  record(
    "profile_review_stats_decrement",
    Number(deletedStats?.total ?? 0) === baselineTotal,
    true,
  );
} finally {
  if (reviewerProfileId && reviewedProfileId) {
    await admin
      .from("reviews")
      .delete()
      .eq("reviewed_profile_id", reviewedProfileId)
      .eq("reviewer_profile_id", reviewerProfileId)
      .eq("review_type", "professional");
  }
  if (fixtureJobId) {
    await admin.from("professional_jobs").delete().eq("id", fixtureJobId);
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

if (outcomes.length !== 31 || outcomes.some((outcome) => !outcome.passed)) {
  throw new Error("Reviews Core authorization probe failed");
}
