import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadMediaAsset: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/core/media/services/MediaService", () => ({
  mediaService: { uploadMediaAsset: mocks.uploadMediaAsset },
}));
vi.mock("@/core/session", () => ({
  useSessionContext: () => ({
    activeProfile: { id: "other-active-profile" },
  }),
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));

import { useBusinessEditImageUpload } from "../useBusinessEdit";

function renderUploadHook(businessProfileId: string) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useBusinessEditImageUpload(businessProfileId), { wrapper });
}

describe("Business edit media ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uploadMediaAsset.mockResolvedValue({ reference: "media://test" });
  });

  it("uses the business being edited, not the actor's active profile", async () => {
    const { result } = renderUploadHook("business-route-profile");
    const file = new File(["image"], "logo.png", { type: "image/png" });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ file, folder: "logos" }),
      ).resolves.toBe("media://test");
    });

    expect(mocks.uploadMediaAsset).toHaveBeenCalledExactlyOnceWith(
      "business-route-profile",
      file,
      "business_logo",
    );
    expect(mocks.uploadMediaAsset).not.toHaveBeenCalledWith(
      "other-active-profile",
      file,
      "business_logo",
    );
  });

  it("uses the same business profile for banners", async () => {
    const { result } = renderUploadHook("business-route-profile");
    const file = new File(["image"], "banner.png", { type: "image/png" });
    await act(async () => {
      await result.current.mutateAsync({ file, folder: "banners" });
    });
    expect(mocks.uploadMediaAsset).toHaveBeenCalledWith(
      "business-route-profile",
      file,
      "business_banner",
    );
  });

  it("fails closed if the edited business profile ID is unavailable", async () => {
    const { result } = renderUploadHook("");
    const file = new File(["image"], "logo.png", { type: "image/png" });
    await act(async () => {
      await expect(result.current.mutateAsync({ file, folder: "logos" }))
        .rejects.toThrow("Identidade da empresa nao encontrada");
    });
    expect(mocks.uploadMediaAsset).not.toHaveBeenCalled();
  });
});
