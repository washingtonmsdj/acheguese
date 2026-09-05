import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useComunidadePage } from "./useComunidadePage";

const mocks = vi.hoisted(() => ({
  usePostById: vi.fn(),
}));

vi.mock("@/core/community/hooks/useCommunityFiltersAAA", () => ({
  useCommunityFiltersAAA: () => ({
    setTagFilter: vi.fn(),
    immediateFilters: { locationScope: "neighborhood" },
    setLocationScope: vi.fn(),
  }),
}));

vi.mock("@/core/posts/hooks", () => ({
  usePostActions: () => ({
    likePost: vi.fn(),
    savePost: vi.fn(),
    sharePost: vi.fn(),
    deletePost: vi.fn(),
    isDeleting: false,
  }),
}));

vi.mock("@/core/community/hooks/useModeration", () => ({
  useModeration: () => ({ reportPostAsync: vi.fn() }),
}));

vi.mock("@/core/session", () => ({
  useSessionContext: () => ({ activeProfile: null }),
}));

vi.mock("@/core/profiles/contexts/multi-profile-runtime-context", () => ({
  useMultiProfileContext: () => ({ effectiveProfile: null }),
}));

vi.mock("@/core/community/hooks/usePostById", () => ({
  usePostById: mocks.usePostById,
}));

vi.mock("@/core/community/hooks/useCommunityLocation", () => ({
  useCommunityLocation: () => ({ hasActiveLocation: true }),
}));

let currentSearch = "";

function LocationProbe() {
  currentSearch = useLocation().search;
  return null;
}

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        {children}
        <LocationProbe />
      </MemoryRouter>
    );
  };
}

describe("useComunidadePage post query parameter", () => {
  beforeEach(() => {
    currentSearch = "";
    mocks.usePostById.mockReset();
    mocks.usePostById.mockReturnValue({ data: null, isLoading: false });
  });

  it("reads an existing post deep-link and requests its detail", () => {
    const { result } = renderHook(() => useComunidadePage(), {
      wrapper: createWrapper("/comunidade/pituba/feed?post=post-123"),
    });

    expect(result.current.postId).toBe("post-123");
    expect(mocks.usePostById).toHaveBeenCalledWith("post-123");
  });

  it("adds and removes only post while preserving unrelated query state", async () => {
    const { result } = renderHook(() => useComunidadePage(), {
      wrapper: createWrapper("/comunidade/pituba/feed?view=popular&tab=geral"),
    });

    await act(async () => {
      await result.current.handlePostClick("post-123");
    });

    await waitFor(() => {
      expect(new URLSearchParams(currentSearch).get("view")).toBe("popular");
      expect(new URLSearchParams(currentSearch).get("tab")).toBe("geral");
      expect(new URLSearchParams(currentSearch).get("post")).toBe("post-123");
    });

    act(() => {
      result.current.handleClosePostDetail();
    });

    await waitFor(() => {
      const searchParams = new URLSearchParams(currentSearch);
      expect(searchParams.get("view")).toBe("popular");
      expect(searchParams.get("tab")).toBe("geral");
      expect(searchParams.has("post")).toBe(false);
    });
  });
});
