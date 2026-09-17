import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  session: { user: { email: "resident@example.com" } as { email: string } | null },
  profileHub: {
    businessModules: [] as unknown[],
    profile: null as Record<string, unknown> | null,
    allProfiles: [] as Array<{ profile_type: string }>,
    identity: null as Record<string, unknown> | null,
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => state.navigate };
});

vi.mock("@/core/session", () => ({
  useSessionContext: () => state.session,
}));

vi.mock("@/core/profiles/hooks/useProfileHub", () => ({
  useProfileHub: () => state.profileHub,
}));

import CentralHubPage from "./CentralHubPage";

describe("CentralHubPage", () => {
  beforeEach(() => {
    state.navigate.mockReset();
    state.session.user = { email: "resident@example.com" };
    state.profileHub.businessModules = [];
    state.profileHub.profile = null;
    state.profileHub.allProfiles = [];
    state.profileHub.identity = null;
  });

  it("renders the responsive getting-started state for an empty profile", () => {
    render(<CentralHubPage />);

    expect(screen.getByRole("heading", { name: "Central" })).toBeVisible();
    expect(screen.getByText("Comece a gerenciar")).toBeVisible();
    expect(screen.getByText("Cadastre sua empresa")).toBeVisible();
    expect(screen.getByText("Area profissional")).toBeVisible();
    expect(screen.getByText("Motorista")).toBeVisible();

    const pageFrame = screen
      .getByText("Comece a gerenciar")
      .closest('[data-responsive-page-frame="standard"]');
    expect(pageFrame).not.toBeNull();
  });

  it("routes the company onboarding action through the canonical URL owner", () => {
    render(<CentralHubPage />);

    fireEvent.click(screen.getByRole("button", { name: "Criar empresa" }));

    expect(state.navigate).toHaveBeenCalledWith("/central/empresas/nova");
  });
});
