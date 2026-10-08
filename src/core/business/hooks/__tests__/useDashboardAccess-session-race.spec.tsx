import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: { id: "user-old" } as { id: string } | null,
  isLoading: false,
  getBusinessDataId: vi.fn(),
  getManagementRole: vi.fn(),
}));

vi.mock("@/core/session", () => ({
  useSessionContext: () => ({
    user: mocks.currentUser,
    isLoading: mocks.isLoading,
  }),
}));
vi.mock("@/core/business/services/BusinessService", () => ({
  BusinessService: {
    getBusinessDataIdByProfileId: mocks.getBusinessDataId,
  },
}));
vi.mock("@/core/business/services/BusinessOwnershipService", () => ({
  BusinessOwnershipService: {
    resolveManagementRole: mocks.getManagementRole,
  },
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn() },
}));

import { useDashboardAccess } from "../useDashboardAccess";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { resolve, promise };
}

describe("Business access identity isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser = { id: "user-old" };
    mocks.isLoading = false;
    mocks.getBusinessDataId.mockResolvedValue("business-1");
    mocks.getManagementRole.mockResolvedValue(null);
  });

  it("never applies an old user's late permission result to a new session", async () => {
    const previousCheck = deferred<"owner">();
    const currentCheck = deferred<null>();
    mocks.getManagementRole.mockImplementation(
      (_businessId: string, userId: string) =>
        userId === "user-old" ? previousCheck.promise : currentCheck.promise,
    );
    const { result, rerender } = renderHook(() => useDashboardAccess("profile-1"));
    await waitFor(() =>
      expect(mocks.getManagementRole).toHaveBeenCalledWith("business-1", "user-old"),
    );

    mocks.currentUser = { id: "user-new" };
    rerender();
    expect(result.current.permissions.hasAccess).toBe(false);
    expect(result.current.checkedProfileId).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      currentCheck.resolve(null);
      await currentCheck.promise;
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.checkedProfileId).toBe("profile-1");
    });

    await act(async () => {
      previousCheck.resolve("owner");
      await previousCheck.promise;
    });
    expect(result.current.permissions.hasAccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("keeps access denied during an outage and retries only on explicit request", async () => {
    mocks.getBusinessDataId
      .mockRejectedValueOnce(new Error("Identity service unavailable"))
      .mockResolvedValue("business-1");
    mocks.getManagementRole.mockResolvedValue("admin");

    const { result } = renderHook(() => useDashboardAccess("profile-1"));
    await waitFor(() =>
      expect(result.current.error).toContain("Identity service unavailable"),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.permissions.hasAccess).toBe(false);

    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBeNull();
    expect(result.current.permissions.hasAccess).toBe(true);
    expect(result.current.permissions.role).toBe("admin");
  });
});
