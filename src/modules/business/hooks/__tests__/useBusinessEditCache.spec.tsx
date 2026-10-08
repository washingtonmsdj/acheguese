import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateBusiness: vi.fn(),
}));

vi.mock("@/core/business/services/BusinessService", () => ({
  BusinessService: { updateBusiness: mocks.updateBusiness },
}));
vi.mock("@/core/session", () => ({
  useSessionContext: () => ({ activeProfile: { id: "acting-profile" } }),
}));
vi.mock("@/shared/schemas/business/businessSchemas", () => ({
  updateBusinessSchema: {
    safeParse: (data: unknown) => ({ success: true, data }),
  },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useBusinessEdit } from "../useBusinessEdit";

describe("Business edit detail cache consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateBusiness.mockResolvedValue({
      id: "business-profile",
      name: "Nome atualizado",
      slug: "novo-slug",
    });
  });

  it("invalidates ID and slug detail snapshots after a confirmed edit", async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    client.setQueryData(["business", "business-profile"], { name: "Nome antigo" });
    client.setQueryData(["business", "slug-antigo"], { name: "Nome antigo" });
    const invalidation = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useBusinessEdit(), { wrapper });

    await act(async () => {
      await result.current.updateBusiness({
        id: "business-profile",
        data: { name: "Nome atualizado" },
      });
    });

    expect(mocks.updateBusiness).toHaveBeenCalledWith("business-profile", {
      name: "Nome atualizado",
    });
    expect(invalidation).toHaveBeenCalledWith({ queryKey: ["businesses"] });
    expect(invalidation).toHaveBeenCalledWith({ queryKey: ["business"] });
    expect(client.getQueryState(["business", "slug-antigo"])?.isInvalidated).toBe(true);
    expect(client.getQueryData(["business", "business-profile"])).toEqual({
      id: "business-profile",
      name: "Nome atualizado",
      slug: "novo-slug",
    });
  });
});
