/// <reference types="vite/client" />

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TERMS_OF_SERVICE_VERSION } from "../../src/core/legal/termsOfService";
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

const RUN_ALPHA_ACCESS_REAL_TESTS =
  process.env.RUN_ALPHA_ACCESS_REAL_TESTS === "1";
const describeAlpha = RUN_ALPHA_ACCESS_REAL_TESTS
  ? (name: string, suite: () => void) =>
      describeOperational(
        name,
        { requireAnonKey: true, requireServiceRole: true },
        suite,
      )
  : describe.skip;

let admin: OperationalSupabaseClient;
let anonymous: OperationalSupabaseClient;
const createdUserIds = new Set<string>();
const invitedEmails = new Set<string>();

function uniqueEmail(label: string): string {
  return `alpha-${label}-${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
}

async function signup(email: string) {
  return anonymous.auth.signUp({
    email,
    password: `AlphaAccess@${Date.now()}!`,
    options: {
      data: {
        name: "Alpha Access Runtime",
        display_name: "Alpha Access Runtime",
        handle: `alpharuntime${Date.now()}`,
        terms_accepted: true,
        terms_version: TERMS_OF_SERVICE_VERSION,
      },
    },
  });
}

async function createConfirmedUserFromInvite(email: string) {
  return createConfirmedOperationalUser(admin, {
    alphaAccessMode: "invite",
    email,
    password: `AlphaAccess@${Date.now()}!`,
    name: "Alpha Access Runtime",
    handle: `alpharuntime${Date.now()}`,
  });
}

async function revokeInvite(email: string): Promise<void> {
  const { error } = await admin.rpc("alpha_access_revoke_invite", {
    p_email: email,
  });
  if (error) throw error;
}

describeAlpha("private alpha access runtime", () => {
  beforeAll(() => {
    admin = createOperationalAdminClient();
    anonymous = createOperationalAnonClient();
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await deleteOperationalUserWithOwnedProfiles(admin, userId);
    }
    for (const email of invitedEmails) {
      await revokeInvite(email);
    }
  }, 60_000);

  it("rejects a self-service signup without an invite", async () => {
    const result = await signup(uniqueEmail("uninvited"));

    if (result.data.user?.id) createdUserIds.add(result.data.user.id);
    expect(result.error).not.toBeNull();
    expect(result.data.user).toBeNull();
  });

  it("consumes a matching invite once and records server-owned access metadata", async () => {
    const email = uniqueEmail("invited");
    invitedEmails.add(email);

    const issued = await admin.rpc("alpha_access_issue_invite", {
      p_email: email,
      p_note: "operational_test",
    });
    expect(issued.error).toBeNull();
    expect(issued.data).toBeTruthy();

    const accepted = await createConfirmedUserFromInvite(email);
    expect(accepted.id).toBeTruthy();
    createdUserIds.add(accepted.id);

    const stored = await admin.auth.admin.getUserById(accepted.id);
    expect(stored.error).toBeNull();
    expect(stored.data.user?.app_metadata.private_alpha_access).toBe(true);

    await deleteOperationalUserWithOwnedProfiles(admin, accepted.id);
    createdUserIds.delete(accepted.id);

    await expect(createConfirmedUserFromInvite(email)).rejects.toThrow();
  });
});
