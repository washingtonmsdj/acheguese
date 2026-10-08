import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateBusiness: vi.fn(),
  actor: { user: { id: "manager-user" } as { id: string } | null },
}));

vi.mock("@/core/business/services/BusinessService", () => ({
  BusinessService: { updateBusiness: mocks.updateBusiness },
}));
vi.mock("@/core/session", () => ({
  useSessionContext: () => ({ user: mocks.actor.user, activeProfile: null }),
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
    mocks.actor.user = { id: "manager-user" };
    mocks.updateBusiness.mockResolvedValue({
      id: "business-profile",
      name: "Nome atualizado",
      slug: "novo-slug",
    });
  });

  it("requires an authenticated actor, not a matching active profile", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(() => useBusinessEdit(), { wrapper });

    // A delegated manager can edit the route-owned business even without an
    // active Business profile; the canonical service enforces authorization.
    await act(async () => {
      await expect(result.current.updateBusiness({
        id: "business-profile", data: { name: "Nome atualizado" },
      })).resolves.toBeDefined();
    });
    expect(mocks.updateBusiness).toHaveBeenCalledOnce();

    mocks.actor.user = null;
    rerender();
    await act(async () => {
      await expect(result.current.updateBusiness({
        id: "business-profile", data: { name: "Nao salvar" },
      })).rejects.toThrow("Sessão não autenticada");
    });
    expect(mocks.updateBusiness).toHaveBeenCalledOnce();
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
