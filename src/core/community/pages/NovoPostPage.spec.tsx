import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LocationStatus,
  LocationType,
  type Location,
} from "@/core/location/types";
import type { UseCommunityAccessResult } from "@/core/community/access";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import NovoPostPage from "./NovoPostPage";

interface MutableMocks {
  activeLocation: Location | null;
  useCommunityAccess: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted<MutableMocks>(() => ({
  activeLocation: null,
  useCommunityAccess: vi.fn(),
}));

vi.mock("@/core/session/hooks/useSessionContext", () => ({
  useSessionContext: () => ({
    user: { id: "user-123" },
    isLoading: false,
  }),
}));

vi.mock("@/core/location/hooks/useActiveTerritory", () => ({
  useActiveTerritory: () => ({ activeLocation: mocks.activeLocation }),
}));

vi.mock("@/core/community/access/useCommunityAccess", () => ({
  useCommunityAccess: mocks.useCommunityAccess,
}));

vi.mock("@/core/routing/hooks", () => ({
  useAppUrls: () => ({
    auth: { login: "/login" },
    profile: {
      manage: "/conta/perfis",
      addresses: "/conta/enderecos",
    },
    community: { feed: "/comunidade/pituba/feed" },
  }),
}));

vi.mock("@/core/community/components/composer/CreatePostModal", () => ({
  CreatePostModal: ({
    canCreatePost,
    resolvedTerritory,
  }: {
    canCreatePost: boolean;
    resolvedTerritory?: ResolvedTerritory;
  }) => (
    <div
      data-testid="create-post-modal"
      data-can-create={canCreatePost}
      data-location-id={
        resolvedTerritory?.kind === "location"
          ? resolvedTerritory.location.id
          : undefined
      }
    >
      Composer
    </div>
  ),
}));

const pituba: Location = {
  id: "location-pituba",
  parent_id: "location-salvador",
  type: LocationType.DISTRICT,
  slug: "pituba",
  name: "Pituba",
  full_name: "Pituba, Salvador",
  geographic_path: "/br/ba/salvador/pituba",
  status: LocationStatus.ACTIVE,
  metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function accessDecision(canCreatePost: boolean): UseCommunityAccessResult {
  return {
    level: canCreatePost ? "verified_resident" : "authenticated",
    isLoading: false,
    isAuthenticated: true,
    isAdmin: false,
    isModerator: false,
    residenceLocationId: canCreatePost ? pituba.id : null,
    isResidenceVerified: canCreatePost,
    communityId: null,
    membership: null,
    membershipStatus: null,
    canRequestMembership: false,
    isRequestingMembership: false,
    requestMembership: vi.fn(async () => null),
    reason: canCreatePost ? "allowed" : "missing_residence",
    primaryAction: canCreatePost ? "none" : "add_address",
    targetLocationIds: [pituba.id],
    can: {
      view_public_preview: true,
      view_member_feed: canCreatePost,
      create_post: canCreatePost,
      create_issue: canCreatePost,
      create_alert: canCreatePost,
      comment: canCreatePost,
      react: canCreatePost,
      save: canCreatePost,
      send_message: canCreatePost,
      join_group: canCreatePost,
      create_group: false,
      report: canCreatePost,
      moderate: false,
      manage_portal: false,
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/novo-post"]}>
      <Routes>
        <Route path="/novo-post" element={<NovoPostPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NovoPostPage community access", () => {
  beforeEach(() => {
    mocks.activeLocation = pituba;
    mocks.useCommunityAccess.mockReset();
  });

  it("does not grant creation to an authenticated user denied by CommunityAccessPolicy", () => {
    mocks.useCommunityAccess.mockReturnValue(accessDecision(false));

    renderPage();

    expect(screen.queryByTestId("create-post-modal")).not.toBeInTheDocument();
    expect(
      screen.getByText("Confirme sua residencia neste territorio"),
    ).toBeVisible();
  });

  it("allows creation when CommunityAccessPolicy grants it for the active territory", () => {
    mocks.useCommunityAccess.mockReturnValue(accessDecision(true));

    renderPage();

    expect(screen.getByTestId("create-post-modal")).toHaveAttribute(
      "data-can-create",
      "true",
    );
    expect(screen.getByTestId("create-post-modal")).toHaveAttribute(
      "data-location-id",
      pituba.id,
    );
    expect(mocks.useCommunityAccess).toHaveBeenCalledWith({
      resolved: { kind: "location", location: pituba },
      activeMemberIds: [],
    });
  });

  it("fails closed when there is no valid active territory", () => {
    mocks.activeLocation = null;
    mocks.useCommunityAccess.mockReturnValue(accessDecision(true));

    renderPage();

    expect(screen.queryByTestId("create-post-modal")).not.toBeInTheDocument();
    expect(
      screen.getByText("Selecione um territorio para publicar"),
    ).toBeVisible();
    expect(mocks.useCommunityAccess).not.toHaveBeenCalled();
  });
});
