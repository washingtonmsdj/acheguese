/// <reference types="vite/client" />

import type { User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createConfirmedOperationalUser,
  deleteOperationalUserWithOwnedProfiles,
} from "../helpers/operational-auth-fixture";
import {
  createOperationalAdminClient,
  createOperationalAnonClient,
  describeOperational,
  type OperationalSupabaseClient,
} from "../helpers/operational-env";

const RUN_PROFESSIONAL_REVIEW_REAL_TESTS =
  process.env.RUN_PROFESSIONAL_REVIEW_REAL_TESTS === "1";
const describeProfessionalReview = RUN_PROFESSIONAL_REVIEW_REAL_TESTS
  ? (name: string, suite: () => void) =>
      describeOperational(
        name,
        { requireAnonKey: true, requireServiceRole: true },
        suite,
      )
  : describe.skip;

interface Identity {
  client: OperationalSupabaseClient;
  password: string;
  profileId: string;
  user: User;
}

let admin: OperationalSupabaseClient;
let anonymous: OperationalSupabaseClient;
let requester: Identity;
let attacker: Identity;
let professionalUser: User;
let professionalProfileId: string | undefined;
let professionalId: string | undefined;
let leadId: string | undefined;
let quoteId: string | undefined;
let engagementId: string | undefined;

const createdUserIds: string[] = [];

function suffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function waitForPersonalProfile(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_type", "personal")
      .maybeSingle();
    if (result.error) throw result.error;
    if (result.data?.id) return result.data.id as string;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Personal profile not created for ${userId}.`);
}

async function createIdentity(label: string): Promise<Identity> {
  const id = suffix();
  const password = `ProfessionalReview@${id}!`;
  const user = await createConfirmedOperationalUser(admin, {
    email: `professional-review-${label}-${id}@example.com`,
    handle: `proreview${label}${id}`,
    name: `Professional Review ${label}`,
    password,
  });
  createdUserIds.push(user.id);

  const profileId = await waitForPersonalProfile(user.id);
  const client = createOperationalAnonClient();
  const signIn = await client.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signIn.error) throw signIn.error;

  return { client, password, profileId, user };
}

async function findLocationId(): Promise<string> {
  const result = await admin
    .from("locations")
    .select("id")
    .eq("status", "active")
    .eq("type", "neighborhood")
    .order("geographic_path", { ascending: true })
    .limit(1)
    .single();
  if (result.error || !result.data?.id) {
    throw result.error ?? new Error("No active neighborhood for fixture.");
  }
  return result.data.id as string;
}

async function cleanup(): Promise<void> {
  if (leadId) {
    await admin.from("professional_lead_events").delete().eq("lead_id", leadId);
  }
  if (professionalProfileId) {
    await admin
      .from("reviews")
      .delete()
      .eq("reviewed_profile_id", professionalProfileId);
  }
  if (engagementId) {
    await admin
      .from("professional_service_engagements")
      .delete()
      .eq("id", engagementId);
  }
  if (quoteId) {
    await admin.from("professional_lead_quotes").delete().eq("id", quoteId);
  }
  if (leadId) {
    await admin.from("professional_leads").delete().eq("id", leadId);
  }
  if (professionalId) {
    await admin.from("professional_data").delete().eq("id", professionalId);
  }
  if (professionalProfileId) {
    await admin.from("profiles").delete().eq("id", professionalProfileId);
  }

  for (const userId of createdUserIds.reverse()) {
    await deleteOperationalUserWithOwnedProfiles(admin, userId);
  }
}

describeProfessionalReview("professional review RPC authorization", () => {
  beforeAll(async () => {
    admin = createOperationalAdminClient();
    anonymous = createOperationalAnonClient();
    requester = await createIdentity("requester");
    attacker = await createIdentity("attacker");

    const id = suffix();
    const password = `ProfessionalOwner@${id}!`;
    professionalUser = await createConfirmedOperationalUser(admin, {
      email: `professional-review-owner-${id}@example.com`,
      handle: `proreviewowner${id}`,
      name: "Professional Review Owner",
      password,
    });
    createdUserIds.push(professionalUser.id);

    const locationId = await findLocationId();
    const profile = await admin
      .from("profiles")
      .insert({
        handle: `professionalreview${id}`,
        is_active: true,
        is_public: true,
        is_suspended: false,
        name: "Professional Review Target",
        profile_type: "professional",
        suspended: false,
        user_id: professionalUser.id,
      })
      .select("id")
      .single();
    if (profile.error || !profile.data?.id) throw profile.error;
    professionalProfileId = profile.data.id as string;

    const professional = await admin
      .from("professional_data")
      .insert({
        location_id: locationId,
        owner_user_id: professionalUser.id,
        profession: "Operational security test",
        professional_name: "Professional Review Target",
        profile_id: professionalProfileId,
        service_category: "operational-test",
        slug: `professional-review-${id}`,
        visibility: "public_unlisted",
      })
      .select("id")
      .single();
    if (professional.error || !professional.data?.id) throw professional.error;
    professionalId = professional.data.id as string;

    const lead = await admin
      .from("professional_leads")
      .insert({
        description: "Operational review authorization fixture",
        location_id: locationId,
        professional_id: professionalId,
        requester_email: requester.user.email,
        requester_name: "Professional Review Requester",
        requester_profile_id: requester.profileId,
        requester_user_id: requester.user.id,
        service_needed: "Operational authorization validation",
        status: "completed",
      })
      .select("id")
      .single();
    if (lead.error || !lead.data?.id) throw lead.error;
    leadId = lead.data.id as string;

    const quote = await admin
      .from("professional_lead_quotes")
      .insert({
        amount_cents: 10000,
        description: "Operational authorization fixture",
        lead_id: leadId,
        professional_user_id: professionalUser.id,
        status: "accepted",
      })
      .select("id")
      .single();
    if (quote.error || !quote.data?.id) throw quote.error;
    quoteId = quote.data.id as string;

    const engagement = await admin
      .from("professional_service_engagements")
      .insert({
        amount_cents: 10000,
        completed_at: new Date().toISOString(),
        lead_id: leadId,
        professional_id: professionalId,
        professional_user_id: professionalUser.id,
        quote_id: quoteId,
        requester_profile_id: requester.profileId,
        requester_user_id: requester.user.id,
        service_description: "Operational authorization fixture",
        status: "completed",
      })
      .select("id")
      .single();
    if (engagement.error || !engagement.data?.id) throw engagement.error;
    engagementId = engagement.data.id as string;
  }, 120_000);

  afterAll(cleanup, 120_000);

  it("rejects anonymous callers", async () => {
    const result = await anonymous.rpc(
      "submit_professional_engagement_review",
      {
        p_comment: "Anonymous attempt",
        p_engagement_id: engagementId!,
        p_rating: 5,
      },
    );
    expect(result.error).not.toBeNull();
  });

  it("rejects an authenticated user who does not own the engagement", async () => {
    const result = await attacker.client.rpc(
      "submit_professional_engagement_review",
      {
        p_comment: "Cross-user attempt",
        p_engagement_id: engagementId!,
        p_rating: 5,
      },
    );
    expect(result.error).not.toBeNull();
  });

  it("rejects invalid review input for the legitimate requester", async () => {
    const result = await requester.client.rpc(
      "submit_professional_engagement_review",
      {
        p_comment: "Invalid rating attempt",
        p_engagement_id: engagementId!,
        p_rating: 6,
      },
    );
    expect(result.error).not.toBeNull();
  });

  it("creates only the requester-bound review and audit event", async () => {
    const result = await requester.client.rpc(
      "submit_professional_engagement_review",
      {
        p_comment: "Verified operational review",
        p_engagement_id: engagementId!,
        p_rating: 5,
      },
    );
    expect(result.error).toBeNull();
    expect(result.data?.review?.reviewed_profile_id).toBe(
      professionalProfileId,
    );
    expect(result.data?.review?.reviewer_profile_id).toBe(requester.profileId);

    const review = await admin
      .from("reviews")
      .select("id, reviewed_profile_id, reviewer_profile_id, rating")
      .eq("reviewed_profile_id", professionalProfileId!)
      .eq("reviewer_profile_id", requester.profileId)
      .single();
    expect(review.error).toBeNull();
    expect(review.data?.rating).toBe(5);

    const event = await admin
      .from("professional_lead_events")
      .select("actor_user_id, event_type")
      .eq("lead_id", leadId!)
      .eq("event_type", "engagement_review_submitted")
      .single();
    expect(event.error).toBeNull();
    expect(event.data?.actor_user_id).toBe(requester.user.id);
  });
});
