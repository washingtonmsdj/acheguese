// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./postDraftCrypto", () => ({
  decryptString: vi.fn(async (_scope: string, raw: string) => raw),
  encryptString: vi.fn(async (_scope: string, plaintext: string) => plaintext),
  isEncryptedEnvelope: vi.fn(() => false),
  purgeCryptoKey: vi.fn(async () => undefined),
}));

import {
  loadPostDraft,
  savePostDraft,
  type PostDraftPayload,
} from "./postDraft";

const PROFILE_ID = "profile-draft-test";
const STORAGE_KEY = `community:post-draft:v1:${PROFILE_ID}`;

const payload: PostDraftPayload = {
  intent: "discussao",
  distributionLevel: "neighborhood",
  genericDescription: "Rascunho territorial de teste",
  pollQuestion: "",
  pollOptions: ["", ""],
  problemLocation: "",
  problemCategory: "",
  problemSeverity: "media",
  problemRecurrence: "pontual",
  problemDescription: "",
  eventDate: "",
  eventTime: "",
  eventPlace: "",
  eventLimit: "",
  eventDescription: "",
};

describe("post draft timestamp contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("writes only the canonical updatedAt timestamp", async () => {
    const saved = await savePostDraft(PROFILE_ID, payload);

    expect(saved).not.toBeNull();
    expect(saved?.updatedAt).toEqual(expect.any(Number));
    expect(saved).not.toHaveProperty("savedAt");

    const persisted = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    expect(persisted.updatedAt).toEqual(expect.any(Number));
    expect(persisted).not.toHaveProperty("savedAt");
  });

  it("migrates legacy savedAt snapshots and rewrites canonical storage", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...payload,
        savedAt: 123456789,
      }),
    );

    const loaded = await loadPostDraft(PROFILE_ID);

    expect(loaded?.updatedAt).toBe(123456789);
    expect(loaded).not.toHaveProperty("savedAt");

    const rewritten = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    expect(rewritten.updatedAt).toBe(123456789);
    expect(rewritten).not.toHaveProperty("savedAt");
  });
});