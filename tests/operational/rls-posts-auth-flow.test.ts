/// <reference types="vite/client" />

/**
 * End-to-end RLS validation for the canonical Posts table.
 *
 * Every identity and territorial grant is created for this run and removed at
 * teardown. Runtime mutations always use authenticated anon clients; the admin
 * client is restricted to fixture setup, verification and cleanup.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";
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

const RUN_RLS_REAL_TESTS = process.env.RUN_RLS_REAL_TESTS === "1";
const describeRls = RUN_RLS_REAL_TESTS
  ? (name: string, suite: () => void) =>
      describeOperational(
        name,
        { requireAnonKey: true, requireServiceRole: true },
        suite,
      )
  : describe.skip;

const INVALID_LOCATION_ID = "00000000-0000-0000-0000-999999999999";

interface TestIdentity {
  client: OperationalSupabaseClient;
  personalProfileId: string;
  user: User;
}

let admin: OperationalSupabaseClient;
let clientAnon: OperationalSupabaseClient;
let identityA: TestIdentity;
let identityB: TestIdentity;
let businessProfileBId: string;
let locationId: string;

const createdPostIds = new Set<string>();
const createdUserIds: string[] = [];

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPersonalProfile(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_type", "personal")
      .maybeSingle();

    if (error) throw error;
    if (data?.id) return data.id as string;
    await delay(500);
  }

  throw new Error(
    `Personal profile not created for operational user ${userId}.`,
  );
}

async function setActiveProfile(
  userId: string,
  profileId: string,
): Promise<void> {
  const { error } = await admin
    .from("user_active_profiles")
    .upsert(
      { user_id: userId, profile_id: profileId },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

async function createIdentity(label: "a" | "b"): Promise<TestIdentity> {
  const suffix = uniqueSuffix();
  const password = `RlsPosts@${suffix}!`;
  const user = await createConfirmedOperationalUser(admin, {
    email: `rls-posts-${label}-${suffix}@example.com`,
    handle: `rlsposts${label}${suffix}`,
    name: `RLS Posts ${label.toUpperCase()}`,
    password,
  });
  createdUserIds.push(user.id);

  const personalProfileId = await waitForPersonalProfile(user.id);
  await setActiveProfile(user.id, personalProfileId);

  const client = createOperationalAnonClient();
  const signIn = await client.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signIn.error) throw signIn.error;

  return { client, personalProfileId, user };
}

async function findActiveCommunityLocation(): Promise<string> {
  const preferred = await admin
    .from("locations")
    .select("id")
    .eq("geographic_path", "/br/ba/salvador/nordeste-de-amaralina")
    .eq("status", "active")
    .maybeSingle();

  if (preferred.error) throw preferred.error;
  if (preferred.data?.id) return preferred.data.id as string;

  const fallback = await admin
    .from("locations")
    .select("id")
    .eq("status", "active")
    .eq("type", "neighborhood")
    .order("geographic_path", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallback.error || !fallback.data?.id) {
    throw (
      fallback.error ?? new Error("No active community location available.")
    );
  }
  return fallback.data.id as string;
}

async function seedVerifiedResidence(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const address = await admin
    .from("addresses")
    .insert({
      owner_user_id: userId,
      location_id: locationId,
      address_type: "exact",
      street: "Rua RLS Posts",
      number: "100",
      postal_code: "40000000",
      precision: "street",
      is_verified: true,
      verification_status: "verified",
      verified_at: now,
      verified_reason: "operational_rls_posts",
      metadata: { source: "rls-posts-auth-flow" },
    })
    .select("id")
    .single();

  if (address.error || !address.data?.id) {
    throw (
      address.error ?? new Error("Could not create verified address fixture.")
    );
  }

  const residence = await admin.from("user_residences").insert({
    user_id: userId,
    address_id: address.data.id,
    location_id: locationId,
    country: "BR",
    is_primary: true,
    is_verified: true,
    verification_requested_at: now,
  });
  if (residence.error) throw residence.error;
}

async function createBusinessProfile(userId: string): Promise<string> {
  const suffix = uniqueSuffix();
  const profile = await admin
    .from("profiles")
    .insert({
      user_id: userId,
      profile_type: "business",
      name: `RLS Business ${suffix}`,
      display_name: `RLS Business ${suffix}`,
      username: `rlsbusiness${suffix}`,
      handle: `rlsbusiness${suffix}`,
      slug: `rls-business-${suffix}`,
      is_active: true,
      is_public: true,
    })
    .select("id")
    .single();

  if (profile.error || !profile.data?.id) {
    throw (
      profile.error ?? new Error("Could not create business profile fixture.")
    );
  }

  const member = await admin
    .from("profile_members")
    .upsert(
      { profile_id: profile.data.id, user_id: userId, role: "owner" },
      { onConflict: "profile_id,user_id" },
    );
  if (member.error) throw member.error;

  return profile.data.id as string;
}

async function insertPost(
  client: SupabaseClient,
  params: {
    profileId: string;
    targetLocationId?: string;
    content?: string;
    reach?: string;
  },
) {
  return client
    .from("posts")
    .insert({
      author_profile_id: params.profileId,
      content: params.content ?? "Operational post used to validate RLS.",
      type: "post",
      location_id: params.targetLocationId ?? locationId,
      reach: params.reach ?? "neighborhood",
      images: [],
      tags: [],
      is_published: true,
    })
    .select("id, author_profile_id, location_id, reach")
    .single();
}

async function seedPost(params: {
  profileId: string;
  content: string;
  isPublished?: boolean;
  reach?: string;
}): Promise<string> {
  const { data, error } = await admin
    .from("posts")
    .insert({
      author_profile_id: params.profileId,
      content: params.content,
      type: "post",
      location_id: locationId,
      reach: params.reach ?? "neighborhood",
      images: [],
      tags: [],
      is_published: params.isPublished ?? true,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error("Could not create operational post fixture.");
  }
  createdPostIds.add(data.id as string);
  return data.id as string;
}

async function cleanupIdentity(userId: string): Promise<void> {
  const residenceDelete = await admin
    .from("user_residences")
    .delete()
    .eq("user_id", userId);
  if (residenceDelete.error) throw residenceDelete.error;

  const addressDelete = await admin
    .from("addresses")
    .delete()
    .eq("owner_user_id", userId);
  if (addressDelete.error) throw addressDelete.error;

  await deleteOperationalUserWithOwnedProfiles(admin, userId);
}

describeRls("RLS Posts - authenticated runtime", () => {
  beforeAll(async () => {
    admin = createOperationalAdminClient();
    clientAnon = createOperationalAnonClient();
    locationId = await findActiveCommunityLocation();

    identityA = await createIdentity("a");
    identityB = await createIdentity("b");
    await Promise.all([
      seedVerifiedResidence(identityA.user.id),
      seedVerifiedResidence(identityB.user.id),
    ]);
    businessProfileBId = await createBusinessProfile(identityB.user.id);
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;

    if (createdPostIds.size > 0) {
      const postDelete = await admin
        .from("posts")
        .delete()
        .in("id", [...createdPostIds]);
      if (postDelete.error) throw postDelete.error;
    }

    await Promise.allSettled([
      identityA?.client.auth.signOut(),
      identityB?.client.auth.signOut(),
    ]);

    for (const userId of [...createdUserIds].reverse()) {
      await cleanupIdentity(userId);
    }
  }, 60_000);

  describe("create", () => {
    it("allows an active personal profile with verified residence", async () => {
      const { data, error } = await insertPost(identityA.client, {
        profileId: identityA.personalProfileId,
      });

      expect(error).toBeNull();
      expect(data?.author_profile_id).toBe(identityA.personalProfileId);
      createdPostIds.add(data!.id);
    });

    it("rejects another user's profile", async () => {
      const { data, error } = await insertPost(identityA.client, {
        profileId: identityB.personalProfileId,
      });

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("rejects an invalid territorial location", async () => {
      const { data, error } = await insertPost(identityA.client, {
        profileId: identityA.personalProfileId,
        targetLocationId: INVALID_LOCATION_ID,
      });

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("allows an owned business profile only when it is active", async () => {
      await setActiveProfile(identityB.user.id, businessProfileBId);
      const { data, error } = await insertPost(identityB.client, {
        profileId: businessProfileBId,
        content: "Operational business profile post for RLS validation.",
      });

      expect(error).toBeNull();
      expect(data?.author_profile_id).toBe(businessProfileBId);
      createdPostIds.add(data!.id);
    });
  });

  describe("read", () => {
    let publicPostId: string;
    let privatePostId: string;

    beforeAll(async () => {
      publicPostId = await seedPost({
        profileId: identityA.personalProfileId,
        content: "Published operational post available for public RLS read.",
        reach: "city",
      });
      privatePostId = await seedPost({
        profileId: identityA.personalProfileId,
        content: "Unpublished operational post visible only to its owner.",
        isPublished: false,
      });
    });

    it("allows authenticated and anonymous reads of a published post", async () => {
      const [authenticated, anonymous] = await Promise.all([
        identityB.client
          .from("posts")
          .select("id")
          .eq("id", publicPostId)
          .single(),
        clientAnon.from("posts").select("id").eq("id", publicPostId).single(),
      ]);

      expect(authenticated.error).toBeNull();
      expect(authenticated.data?.id).toBe(publicPostId);
      expect(anonymous.error).toBeNull();
      expect(anonymous.data?.id).toBe(publicPostId);
    });

    it("keeps an unpublished post private to its owner", async () => {
      const owner = await identityA.client
        .from("posts")
        .select("id")
        .eq("id", privatePostId)
        .single();
      const other = await identityB.client
        .from("posts")
        .select("id")
        .eq("id", privatePostId)
        .maybeSingle();

      expect(owner.error).toBeNull();
      expect(owner.data?.id).toBe(privatePostId);
      expect(other.error).toBeNull();
      expect(other.data).toBeNull();
    });
  });

  describe("update", () => {
    let postId: string;

    beforeAll(async () => {
      postId = await seedPost({
        profileId: identityA.personalProfileId,
        content: "Operational post awaiting an owner update.",
      });
    });

    it("allows the active owner and rejects another user", async () => {
      await setActiveProfile(identityA.user.id, identityA.personalProfileId);
      const ownerUpdate = await identityA.client
        .from("posts")
        .update({ content: "Operational content updated by its owner." })
        .eq("id", postId);
      expect(ownerUpdate.error).toBeNull();

      await identityB.client
        .from("posts")
        .update({ content: "Unauthorized operational content update." })
        .eq("id", postId);

      const persisted = await admin
        .from("posts")
        .select("content")
        .eq("id", postId)
        .single();
      expect(persisted.error).toBeNull();
      expect(persisted.data?.content).toBe(
        "Operational content updated by its owner.",
      );
    });
  });

  describe("delete", () => {
    let postAId: string;
    let postBId: string;

    beforeAll(async () => {
      [postAId, postBId] = await Promise.all([
        seedPost({
          profileId: identityA.personalProfileId,
          content: "Operational owner post scheduled for deletion.",
        }),
        seedPost({
          profileId: identityB.personalProfileId,
          content: "Operational foreign post protected from deletion.",
        }),
      ]);
    });

    it("keeps another user's post and lets the owner delete their own", async () => {
      await setActiveProfile(identityA.user.id, identityA.personalProfileId);
      await identityA.client.from("posts").delete().eq("id", postBId);

      const foreignPost = await admin
        .from("posts")
        .select("id")
        .eq("id", postBId)
        .maybeSingle();
      expect(foreignPost.data?.id).toBe(postBId);

      const ownerDelete = await identityA.client
        .from("posts")
        .delete()
        .eq("id", postAId);
      expect(ownerDelete.error).toBeNull();

      const deleted = await admin
        .from("posts")
        .select("id")
        .eq("id", postAId)
        .maybeSingle();
      expect(deleted.data).toBeNull();
      createdPostIds.delete(postAId);
    });
  });

  describe("multi-profile isolation", () => {
    it("requires the selected profile and never accepts another user's profile", async () => {
      await setActiveProfile(identityB.user.id, identityB.personalProfileId);
      const personal = await insertPost(identityB.client, {
        profileId: identityB.personalProfileId,
        content: "Operational personal profile post after an explicit switch.",
      });
      expect(personal.error).toBeNull();
      expect(personal.data?.author_profile_id).toBe(
        identityB.personalProfileId,
      );
      createdPostIds.add(personal.data!.id);

      await setActiveProfile(identityB.user.id, businessProfileBId);
      const business = await insertPost(identityB.client, {
        profileId: businessProfileBId,
        content: "Operational business profile post after an explicit switch.",
      });
      expect(business.error).toBeNull();
      expect(business.data?.author_profile_id).toBe(businessProfileBId);
      createdPostIds.add(business.data!.id);

      const foreign = await insertPost(identityB.client, {
        profileId: identityA.personalProfileId,
      });
      expect(foreign.error).not.toBeNull();
      expect(foreign.data).toBeNull();
    });
  });
});
