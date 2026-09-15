import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  requestAccountDeletion: vi.fn(),
  cancelAccountDeletion: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {},
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    getAccessToken: mocks.getAccessToken,
  },
}));

vi.mock("./PrivacyRpcService", () => ({
  PrivacyRpcService: {
    getDeletionStatus: vi.fn(),
    recordConsent: vi.fn(),
    requestAccountDeletion: mocks.requestAccountDeletion,
    cancelAccountDeletion: mocks.cancelAccountDeletion,
  },
}));

vi.mock("@/shared/config/publicSupabase", () => ({
  buildSupabaseFunctionUrl: (name: string) =>
    `https://privacy-contract.invalid/functions/v1/${name}`,
}));

import { PrivacySettingsService } from "./PrivacySettingsService";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("PrivacySettingsService concurrency ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAccessToken.mockReturnValue("token-a");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares one deletion request for the same session and normalized reason", async () => {
    const pending = deferred<{ daysUntilPurge: number }>();
    mocks.requestAccountDeletion.mockReturnValue(pending.promise);

    const first = PrivacySettingsService.requestAccountDeletion({
      accessToken: "token-a",
      reason: "  encerrar conta  ",
    });
    const second = PrivacySettingsService.requestAccountDeletion({
      accessToken: "token-a",
      reason: "encerrar conta",
    });

    expect(mocks.requestAccountDeletion).toHaveBeenCalledTimes(1);
    expect(mocks.requestAccountDeletion).toHaveBeenCalledWith({
      reason: "encerrar conta",
      exportRequested: false,
    });

    pending.resolve({ daysUntilPurge: 30 });

    await expect(first).resolves.toEqual({ days_until_purge: 30 });
    await expect(second).resolves.toEqual({ days_until_purge: 30 });
  });

  it("fails closed when cancellation competes with an active deletion request", async () => {
    const pending = deferred<{ daysUntilPurge: number }>();
    mocks.requestAccountDeletion.mockReturnValue(pending.promise);

    const request = PrivacySettingsService.requestAccountDeletion({
      accessToken: "token-a",
      reason: "encerrar conta",
    });

    await expect(
      PrivacySettingsService.cancelAccountDeletion(),
    ).rejects.toThrow("Ja existe uma operacao de exclusao em andamento");
    expect(mocks.cancelAccountDeletion).not.toHaveBeenCalled();

    pending.resolve({ daysUntilPurge: 30 });
    await request;
  });

  it("shares one export only for the same current session", async () => {
    const pending = deferred<Response>();
    const blob = new Blob(["{}"], { type: "application/json" });
    const fetchMock = vi.fn(() => pending.promise);
    vi.stubGlobal("fetch", fetchMock);

    const first = PrivacySettingsService.exportUserData("token-a");
    const second = PrivacySettingsService.exportUserData("token-a");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    pending.resolve({
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
    } as unknown as Response);

    await expect(first).resolves.toBe(blob);
    await expect(second).resolves.toBe(blob);
  });

  it("rejects stale session tokens before export or deletion reaches the backend", async () => {
    mocks.getAccessToken.mockReturnValue("token-b");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      PrivacySettingsService.exportUserData("token-a"),
    ).rejects.toThrow("Sessao alterada. Tente novamente.");
    await expect(
      PrivacySettingsService.requestAccountDeletion({
        accessToken: "token-a",
        reason: "encerrar conta",
      }),
    ).rejects.toThrow("Sessao alterada. Tente novamente.");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.requestAccountDeletion).not.toHaveBeenCalled();
  });
});
