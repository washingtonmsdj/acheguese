import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getActiveBusinessManagementNavigation } from "../../src/app/config/businessManagementSurfaceScope";
import BusinessDashboardShellPage from "../../src/modules/business/dashboard/pages/BusinessDashboardShellPage";
import BusinessDetailsPage from "../../src/modules/business/dashboard/pages/BusinessDetailsPage";
import BusinessSettingsPage from "../../src/modules/business/dashboard/pages/BusinessSettingsPage";
import { CentralHeader } from "../../src/modules/central/components/CentralHeader";

const fixture = vi.hoisted(() => ({
  business: {
    id: "real-id", profile_id: "real-id", name: "Empresa de teste",
    category: "educacao", status: "active", slug: "empresa-de-teste",
    business_city: "Cidade de teste", business_state: "BA",
  },
  profile: { id: "session-profile", displayName: "Perfil de teste" },
}));
vi.mock("@/core/business/hooks/useBusiness", () => ({
  useBusiness: () => ({ business: fixture.business, isLoading: false }),
}));
vi.mock("@/core/business/hooks/useResolvedBusinessPublicUrl", () => ({
  useResolvedBusinessPublicUrl: () => ({ url: "/ba/cidade/territorio/empresas/empresa-de-teste" }),
}));
vi.mock("@/core/session/hooks/useSessionContext", () => ({
  useSessionContext: () => ({ activeProfile: fixture.profile }),
}));
vi.mock("@/core/profiles/contexts/multi-profile-runtime-context", () => ({
  useMultiProfileContext: () => ({ setModuleContext: vi.fn() }),
}));
vi.mock("@/core/profiles/components/ProfileMembersManager", () => ({
  ProfileMembersManager: ({ profileId }: { profileId: string }) => <div data-testid="access-profile">{profileId}</div>,
}));
vi.mock("@/core/profiles/components/MultiProfileSwitcher", () => ({
  MultiProfileSwitcher: () => <button>Trocar perfil</button>,
}));
vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: { signOut: vi.fn() },
}));

function open(section: string) {
  render(
    <MemoryRouter initialEntries={[`/central/empresas/real-id/${section}`]}>
      <Routes>
        <Route path="/central/empresas/:businessId" element={<BusinessDashboardShellPage navigationItems={getActiveBusinessManagementNavigation()} />}>
          <Route path="dados" element={<BusinessDetailsPage />} />
          <Route path="configuracoes" element={<BusinessSettingsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Business Central shared presentation", () => {
  it("renders real identity, all eight sections and read-only data without fabricated contact", () => {
    open("dados");
    expect(screen.getAllByLabelText("Empresa em gestão")).toHaveLength(1);
    const sections = screen.getByRole("navigation", { name: "Seções da empresa" });
    expect(within(sections).getAllByRole("link")).toHaveLength(8);
    expect(within(sections).getByRole("link", { name: "Dados da empresa" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Dados da empresa" })).toBeInTheDocument();
    expect(screen.getAllByText("Não informado").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("Identificador")).toBeInTheDocument();
    expect(screen.getByText("/ba/cidade/territorio/empresas/empresa-de-teste")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar dados" })).toHaveAttribute("href", "/central/empresas/real-id/editar");
    expect(screen.queryByText("284")).not.toBeInTheDocument();
  });

  it("opens the mobile section menu and closes it after selection", () => {
    open("dados");
    const toggle = screen.getByRole("button", { name: "Dados da empresa" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Configurações" }));
    expect(screen.getByRole("button", { name: "Configurações" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("access-profile")).toHaveTextContent("real-id");
    expect(screen.queryByText("Preferências pessoais")).not.toBeInTheDocument();
  });

  it("uses the authenticated header with profile switching and horizontal account surfaces", () => {
    render(<MemoryRouter><CentralHeader billingEnabled={false} showNavigation={false} brand={<span>achegue-se</span>} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Trocar perfil" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair da conta" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notificações" })).toHaveAttribute("href", "/notificacoes");
    expect(screen.getByRole("link", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
    expect(screen.queryByText("Planos")).not.toBeInTheDocument();
  });
});
