import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refreshWorkspace: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/core/profiles/hooks/useProfileHub", () => ({
  useProfileHub: () => ({
    loading: false,
    error: new Error("profile data plane unavailable"),
    businessModules: [],
    showBusinessOnboarding: false,
    refreshWorkspace: mocks.refreshWorkspace,
    copyToClipboard: vi.fn(),
  }),
}));

vi.mock("@/core/routing/hooks/useAppUrls", () => ({
  useAppUrls: () => ({
    business: {
      create: "/central/empresas/nova",
    },
  }),
}));

vi.mock("@/core/profiles/components/hub/BusinessModulesSection", () => ({
  BusinessModulesSection: () => null,
}));

vi.mock("@/shared/utils/safeRedirect", () => ({
  navigateToSafeRedirect: vi.fn(),
}));

import CentralEmpresasPage from "../CentralEmpresasPage";

describe("Central empresas read truthfulness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an explicit retryable error instead of an infinite spinner or fake empty state", () => {
    render(<CentralEmpresasPage billingEnabled={false} />);

    expect(
      screen.getByRole("heading", { name: "Minhas empresas", exact: true }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Não foi possível carregar suas empresas",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("status", { name: "Carregando suas empresas" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Seu negócio começa aqui")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mocks.refreshWorkspace).toHaveBeenCalledTimes(1);
  });
});
