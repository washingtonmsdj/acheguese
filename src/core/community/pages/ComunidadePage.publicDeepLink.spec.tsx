import { Suspense } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocationStatus, LocationType } from "@/core/location/types";
import ComunidadePage from "./ComunidadePage";

const mocks = vi.hoisted(() => ({
  useComunidadePage: vi.fn(),
  useCommunityAccess: vi.fn(),
  likePost: vi.fn(),
  savePost: vi.fn(),
  sharePost: vi.fn(),
  handleReportPost: vi.fn(),
  handleClosePostDetail: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock("sonner", () => ({
  toast: { info: mocks.toastInfo },
}));

vi.mock("@/core/routing/hooks", () => ({
  useAppUrls: () => ({
    auth: { login: "/login" },
    profile: {
      addresses: "/conta/enderecos",
      manage: "/conta/perfis",
    },
    community: { feed: "/comunidade/ba/salvador/feed" },
  }),
}));

vi.mock("@/core/location/hooks/useUserTerritory", () => ({
  useUserTerritory: () => ({
    homeDistrict: null,
    homeCity: { id: "salvador", name: "Salvador" },
    loading: false,
  }),
}));

vi.mock("@/core/location/hooks/useModuleTerritoryFilter", () => ({
  useModuleTerritoryFilter: () => ({
    territoryFilter: { scope: "location", location_id: "salvador" },
  }),
}));

vi.mock("@/core/residence/services/ResidenceService", () => ({
  residenceService: {
    getPrimaryResidenceWithRelations: vi.fn(),
  },
}));

vi.mock("@/core/community/access", () => ({
  CommunityPortalGate: () => <div data-testid="community-portal-gate" />,
  useCommunityAccess: mocks.useCommunityAccess,
}));

vi.mock("@/core/community/hooks/page/useComunidadePage", () => ({
  useComunidadePage: mocks.useComunidadePage,
}));

vi.mock("@/core/community/components/feed/CommunityFeed", () => ({
  CommunityFeed: () => <div data-testid="member-feed" />,
}));

vi.mock("@/core/community/components/page/LocationScopeCards", () => ({
  LocationScopeCards: () => null,
}));

vi.mock("@/core/community/components/page/CommunityFloatingButtons", () => ({
  CommunityFloatingButtons: () => null,
}));

vi.mock("@/core/community/components/page/CommunityOverviewSurface", () => ({
  CommunityOverviewSurface: ({
    mode,
    children,
  }: {
    mode: string;
    children?: React.ReactNode;
  }) => (
    <section data-testid={`${mode}-overview`}>
      {mode} overview
      {children}
    </section>
  ),
}));

vi.mock("@/core/community/components/composer/CreatePostModal", () => ({
  CreatePostModal: () => null,
}));

vi.mock("@/core/verification", () => ({
  VerificationBanner: () => null,
}));

vi.mock("@/shared/components/ConfirmActionDialog", () => ({
  ConfirmActionDialog: () => null,
}));

vi.mock("@/core/community-experience/hooks/useCommunityProfile", () => ({
  useCommunityProfile: () => ({ data: null }),
}));

vi.mock("@/core/community-experience/types", () => ({
  isPersistedCommunityId: () => false,
}));

vi.mock("@/core/community/utils/resolveCommunityFeedTerritoryFilter", () => ({
  resolveCommunityFeedTerritoryFilter: ({
    baseFilter,
  }: {
    baseFilter: unknown;
  }) => baseFilter,
}));

vi.mock("@/core/moderation", () => ({
  COMMUNITY_REPORT_REASON_OPTIONS: [],
  ReportReasonDialog: () => null,
}));

vi.mock("@/core/community/components/CommentsModal", () => ({
  CommentsModal: () => null,
}));

vi.mock("@/core/community/components/modals/PostDetailModal", () => ({
  PostDetailModal: ({
    post,
    onClose,
    onLike,
    onSave,
    onShare,
    onReport,
    canComment,
  }: {
    post: { id: string; content: string };
    onClose: () => void;
    onLike: (postId: string) => void;
    onSave: (postId: string) => void;
    onShare: (postId: string) => void;
    onReport: (postId: string) => void;
    canComment: boolean;
  }) => (
    <div role="dialog" aria-label="Post do bairro">
      <span>{post.content}</span>
      <span data-testid="comment-permission">{String(canComment)}</span>
      <button type="button" onClick={() => onLike(post.id)}>
        Curtir
      </button>
      <button type="button" onClick={() => onSave(post.id)}>
        Salvar
      </button>
      <button type="button" onClick={() => onShare(post.id)}>
        Compartilhar
      </button>
      <button type="button" onClick={() => onReport(post.id)}>
        Denunciar
      </button>
      <button type="button" onClick={onClose}>
        Fechar
      </button>
    </div>
  ),
}));

const resolved = {
  kind: "location" as const,
  location: {
    id: "salvador",
    parent_id: null,
    type: LocationType.CITY,
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, Bahia",
    geographic_path: "br/ba/salvador",
    status: LocationStatus.ACTIVE,
    metadata: { state_code: "BA" },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
};

const publicPost = {
  id: "post-publico",
  author_profile_id: "autor-1",
  author_name: "Morador",
  type: "discussao",
  content: "Conteudo publico do post",
  images: [],
  tags: ["salvador"],
  location: "Salvador",
  created_at: "2026-08-12T12:00:00.000Z",
  likes_count: 0,
  comments_count: 0,
};

let currentLocation = "";

function LocationProbe() {
  const location = useLocation();
  currentLocation = `${location.pathname}${location.search}`;
  return null;
}

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Suspense fallback={null}>
        <ComunidadePage resolved={resolved} />
      </Suspense>
      <LocationProbe />
    </MemoryRouter>,
  );
}

function pageState(
  profile: object | null | undefined,
  postData: typeof publicPost | null = publicPost,
) {
  return {
    profile,
    postId: postData ? "post-publico" : "post-invisivel",
    postData,
    isLoadingPost: false,
    modalState: { type: null, data: null },
    immediateFilters: { locationScope: "city" },
    likePost: mocks.likePost,
    savePost: mocks.savePost,
    sharePost: mocks.sharePost,
    setLocationScope: vi.fn(),
    handleOpenCreatePost: vi.fn(),
    handlePostClick: vi.fn(),
    handleClosePostDetail: mocks.handleClosePostDetail,
    handleCommentClick: vi.fn(),
    handleTagClick: vi.fn(),
    handleReportPost: mocks.handleReportPost,
    handleSubmitPostReport: vi.fn(),
    handleDeletePost: vi.fn(),
    handleCancelDeletePost: vi.fn(),
    handleConfirmDeletePost: vi.fn(),
    handleEditPost: vi.fn(),
    handleCloseModal: vi.fn(),
    deletePostDialogOpen: false,
    isDeletingPost: false,
  };
}

function accessState(member = false) {
  return {
    communityId: null,
    primaryAction: member ? "open_feed" : "login",
    isLoading: false,
    isResidenceVerified: member,
    can: {
      view_member_feed: member,
      create_post: member,
      create_alert: false,
      create_issue: false,
      comment: member,
      react: member,
      save: member,
      report: member,
      send_message: member,
    },
  };
}

describe("ComunidadePage public Post deep-link boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentLocation = "";
    mocks.useCommunityAccess.mockReturnValue(accessState(false));
    mocks.useComunidadePage.mockReturnValue(pageState(null));
  });

  it("keeps the public overview and opens PostDetailModal after the Post loads", async () => {
    renderPage(
      "/comunidade/ba/salvador/feed?post=post-publico&tab=geral&view=popular",
    );

    expect(screen.getByTestId("public-overview")).toBeVisible();
    expect(
      await screen.findByRole("dialog", { name: "Post do bairro" }),
    ).toBeVisible();
    expect(screen.getByText("Conteudo publico do post")).toBeVisible();
    expect(screen.getByTestId("comment-permission")).toHaveTextContent("false");
  });

  it("does not crash or expose content for an absent or invisible Post", async () => {
    mocks.useComunidadePage.mockReturnValue(pageState(null, null));

    renderPage("/comunidade/ba/salvador/feed?post=post-invisivel");

    expect(screen.getByTestId("public-overview")).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(screen.queryByText("Conteudo publico do post")).toBeNull();
  });

  it("accepts an undefined profile without crashing", async () => {
    mocks.useComunidadePage.mockReturnValue(pageState(undefined));

    renderPage("/comunidade/ba/salvador/feed?post=post-publico");

    expect(
      await screen.findByRole("dialog", { name: "Post do bairro" }),
    ).toBeVisible();
  });

  it("keeps anonymous mutations gated while allowing share and close", async () => {
    renderPage(
      "/comunidade/ba/salvador/feed?post=post-publico&tab=geral&view=popular",
    );
    await screen.findByRole("dialog", { name: "Post do bairro" });

    fireEvent.click(screen.getByRole("button", { name: "Curtir" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    fireEvent.click(screen.getByRole("button", { name: "Denunciar" }));

    expect(mocks.likePost).not.toHaveBeenCalled();
    expect(mocks.savePost).not.toHaveBeenCalled();
    expect(mocks.handleReportPost).not.toHaveBeenCalled();
    expect(mocks.toastInfo).toHaveBeenCalledTimes(3);
    expect(currentLocation).toMatch(/^\/login\?redirect=/);

    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
    expect(mocks.sharePost).toHaveBeenCalledWith("post-publico");

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(mocks.handleClosePostDetail).toHaveBeenCalledTimes(1);
  });

  it("keeps the authenticated branch rendering the existing detail modal", async () => {
    mocks.useCommunityAccess.mockReturnValue(accessState(true));
    mocks.useComunidadePage.mockReturnValue(
      pageState({
        id: "perfil-1",
        user_id: "usuario-1",
        locationId: "salvador",
      }),
    );

    renderPage("/comunidade/ba/salvador/feed?post=post-publico");

    expect(screen.getByTestId("member-overview")).toBeVisible();
    expect(
      await screen.findByRole("dialog", { name: "Post do bairro" }),
    ).toBeVisible();
    expect(screen.getByTestId("comment-permission")).toHaveTextContent("true");
  });
});
