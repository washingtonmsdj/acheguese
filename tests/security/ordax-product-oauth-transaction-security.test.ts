import { describe, expect, it } from "vitest";

import {
  type OrdaxOAuthPendingTransactionRecord,
  type OrdaxOAuthPendingTransactionStore,
  ORDAX_OAUTH_PENDING_TRANSACTION_TTL_MS,
  consumeOrdaxOAuthPendingCallback,
  createOrdaxOAuthPendingTransaction,
} from "../../supabase/functions/_shared/ordaxProductOAuthTransaction";
import { resolveOrdaxProductOAuthServerConfig } from "../../supabase/functions/_shared/ordaxProductOAuth";

const ownerUserId = "11111111-1111-4111-8111-111111111111";
const profileId = "22222222-2222-4222-8222-222222222222";

function config() {
  const value = resolveOrdaxProductOAuthServerConfig({
    enabled: "true",
    issuer: "https://id.ordax.example",
    redirectUri: "https://acheguese.com.br/integracoes/ordax/callback",
  });
  expect(value).not.toBeNull();
  if (!value) throw new Error("test config unavailable");
  return value;
}

class MemoryConsumeOnceStore implements OrdaxOAuthPendingTransactionStore {
  private readonly records = new Map<string, OrdaxOAuthPendingTransactionRecord>();

  private key(input: {
    stateDigest: string;
    ownerUserId: string;
    profileId: string;
  }): string {
    return `${input.stateDigest}:${input.ownerUserId}:${input.profileId}`;
  }

  async create(record: OrdaxOAuthPendingTransactionRecord): Promise<void> {
    this.records.set(
      this.key({
        stateDigest: record.stateDigest,
        ownerUserId: record.ownerUserId,
        profileId: record.profileId,
      }),
      record,
    );
  }

  async consumeOnce(input: {
    stateDigest: string;
    ownerUserId: string;
    profileId: string;
  }): Promise<OrdaxOAuthPendingTransactionRecord | null> {
    const key = this.key(input);
    const record = this.records.get(key) ?? null;
    if (record) this.records.delete(key);
    return record;
  }
}

describe("OrdaX Product OAuth pending transaction foundation", () => {
  it("keeps raw state out of persistence and PKCE verifier out of the consent envelope", async () => {
    const created = await createOrdaxOAuthPendingTransaction({
      config: config(),
      ownerUserId,
      profileId,
      nowMs: 1_000,
    });

    expect(created.consent.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.consent.codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.consent.codeChallengeMethod).toBe("S256");
    expect(created.consent.scope).toBe(
      "network.space.read network.directory.read network.communities.read",
    );

    expect(created.record.stateDigest).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.record.stateDigest).not.toBe(created.consent.state);
    expect(created.record.pkceVerifier).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(JSON.stringify(created.consent)).not.toContain(
      created.record.pkceVerifier,
    );
    expect(created.record).not.toHaveProperty("state");
    expect(created.record).not.toHaveProperty("accessToken");
    expect(created.record).not.toHaveProperty("refreshToken");
  });

  it("binds the pending transaction to User + Profile with a bounded five-minute TTL", async () => {
    const created = await createOrdaxOAuthPendingTransaction({
      config: config(),
      ownerUserId,
      profileId,
      nowMs: 10_000,
    });

    expect(created.record.ownerUserId).toBe(ownerUserId);
    expect(created.record.profileId).toBe(profileId);
    expect(
      Date.parse(created.record.expiresAt) - Date.parse(created.record.createdAt),
    ).toBe(ORDAX_OAUTH_PENDING_TRANSACTION_TTL_MS);
    expect(ORDAX_OAUTH_PENDING_TRANSACTION_TTL_MS).toBe(300_000);
  });

  it("requires atomic consume-once semantics and rejects callback replay", async () => {
    const store = new MemoryConsumeOnceStore();
    const oauthConfig = config();
    const created = await createOrdaxOAuthPendingTransaction({
      config: oauthConfig,
      ownerUserId,
      profileId,
      nowMs: 20_000,
    });
    await store.create(created.record);

    await expect(
      consumeOrdaxOAuthPendingCallback({
        store,
        config: oauthConfig,
        ownerUserId,
        profileId,
        state: created.consent.state,
        code: "authorization_code_001",
        nowMs: 21_000,
      }),
    ).resolves.toMatchObject({
      record: {
        ownerUserId,
        profileId,
      },
      code: "authorization_code_001",
    });

    await expect(
      consumeOrdaxOAuthPendingCallback({
        store,
        config: oauthConfig,
        ownerUserId,
        profileId,
        state: created.consent.state,
        code: "authorization_code_001",
        nowMs: 22_000,
      }),
    ).rejects.toThrow(/already consumed/);
  });

  it("does not let another User or Profile consume the pending transaction", async () => {
    const store = new MemoryConsumeOnceStore();
    const oauthConfig = config();
    const created = await createOrdaxOAuthPendingTransaction({
      config: oauthConfig,
      ownerUserId,
      profileId,
      nowMs: 30_000,
    });
    await store.create(created.record);

    await expect(
      consumeOrdaxOAuthPendingCallback({
        store,
        config: oauthConfig,
        ownerUserId: "33333333-3333-4333-8333-333333333333",
        profileId,
        state: created.consent.state,
        code: "authorization_code_001",
        nowMs: 31_000,
      }),
    ).rejects.toThrow(/missing, mismatched or already consumed/);

    await expect(
      consumeOrdaxOAuthPendingCallback({
        store,
        config: oauthConfig,
        ownerUserId,
        profileId,
        state: created.consent.state,
        code: "authorization_code_001",
        nowMs: 32_000,
      }),
    ).resolves.toMatchObject({ code: "authorization_code_001" });
  });

  it("consumes and rejects an expired transaction instead of permitting delayed replay", async () => {
    const store = new MemoryConsumeOnceStore();
    const oauthConfig = config();
    const created = await createOrdaxOAuthPendingTransaction({
      config: oauthConfig,
      ownerUserId,
      profileId,
      nowMs: 40_000,
    });
    await store.create(created.record);

    await expect(
      consumeOrdaxOAuthPendingCallback({
        store,
        config: oauthConfig,
        ownerUserId,
        profileId,
        state: created.consent.state,
        code: "authorization_code_001",
        nowMs: 40_000 + ORDAX_OAUTH_PENDING_TRANSACTION_TTL_MS + 1,
      }),
    ).rejects.toThrow(/expired/);

    await expect(
      consumeOrdaxOAuthPendingCallback({
        store,
        config: oauthConfig,
        ownerUserId,
        profileId,
        state: created.consent.state,
        code: "authorization_code_001",
        nowMs: 40_001,
      }),
    ).rejects.toThrow(/already consumed/);
  });
});
