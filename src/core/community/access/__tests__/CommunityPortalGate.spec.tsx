import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommunityPortalGate } from "../CommunityPortalGate";
import { useCommunityAccess } from "../useCommunityAccess";
import type { UseCommunityAccessResult } from "../useCommunityAccess";

vi.mock("../useCommunityAccess", () => ({
  useCommunityAccess: vi.fn(),
}));

vi.mock("@/core/routing/hooks", () => ({
  useAppUrls: vi.fn(() => ({
    auth: { login: "/login" },
    profile: {
      manage: "/conta/perfis",
      addresses: "/conta/enderecos",
    },
    community: { feed: "/comunidade/ba/salvador/feed" },
  })),
}));

const target = {
  kind: "location",
  location: {
    id: "loc-santa-cruz",
    name: "Santa Cruz",
  },
} as const;

function accessDecision(
  overrides: Partial<UseCommunityAccessResult>,
): UseCommunityAccessResult {
  return {
    level: "public_preview",
    isLoading: false,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
    residenceLocationId: null,
    isResidenceVerified: false,
    reason: "visitor",
    primaryAction: "login",
    targetLocationIds: ["loc-santa-cruz"],
    can: {
      view_public_preview: true,
      view_member_feed: false,
      create_post: false,
      create_issue: false,
      create_alert: false,
      comment: false,
      react: false,
      save: false,
      send_message: false,
      join_group: false,
      create_group: false,
      report: false,
      moderate: false,
      manage_portal: false,
    },
    ...overrides,
  };
}

describe("CommunityPortalGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a login CTA for visitors blocked from resident actions", () => {
    vi.mocked(useCommunityAccess).mockReturnValue(accessDecision({}));

    render(
      <MemoryRouter initialEntries={["/comunidade/ba/salvador/feed?tab=posts"]}>
        <CommunityPortalGate resolved={target} action="create_post" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Entre para participar da comunidade")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fcomunidade%2Fba%2Fsalvador%2Ffeed%3Ftab%3Dposts",
    );
  });

  it("shows an address CTA when the user has no local residence", () => {
    vi.mocked(useCommunityAccess).mockReturnValue(
      accessDecision({
        level: "authenticated",
        isAuthenticated: true,
        reason: "missing_residence",
        primaryAction: "add_address",
      }),
    );

    render(
      <MemoryRouter>
        <CommunityPortalGate resolved={target} action="join_group" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Confirme sua residencia neste territorio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cadastrar endereco" })).toHaveAttribute(
      "href",
      "/conta/enderecos",
    );
  });

  it("shows a verification CTA for unverified residents", () => {
    vi.mocked(useCommunityAccess).mockReturnValue(
      accessDecision({
        level: "resident",
        isAuthenticated: true,
        residenceLocationId: "loc-santa-cruz",
        reason: "unverified_residence",
        primaryAction: "verify_address",
        can: {
          ...accessDecision({}).can,
          view_member_feed: true,
          react: true,
          save: true,
          report: true,
        },
      }),
    );

    render(
      <MemoryRouter>
        <CommunityPortalGate resolved={target} action="create_alert" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Verifique sua residencia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Verificar residencia" })).toHaveAttribute(
      "href",
      "/conta/enderecos",
    );
  });
});
