import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessSettingsPage from "../../src/modules/business/dashboard/pages/BusinessSettingsPage";

const fixture = vi.hoisted(() => ({
  context: { businessId: "profile-id", business: { profile_id: "profile-id", name: "Empresa real", status: "active" }, publicUrl: "/ba/cidade/territorio/empresas/empresa-real" as string | null },
  access: { permissions: { role: "owner" }, loading: false, error: null as string | null, checkedProfileId: "profile-id" },
  remove: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock("@/modules/business/dashboard/businessDashboardContext", () => ({ useActiveBusinessDashboardContext: () => fixture.context }));
vi.mock("@/core/business/hooks/useDashboardAccess", () => ({ useDashboardAccess: () => fixture.access }));
vi.mock("@/core/business/services/BusinessService", () => ({ BusinessService: { deleteBusiness: fixture.remove } }));
vi.mock("@/core/profiles/components/ProfileMembersManager", () => ({ ProfileMembersManager: ({ profileId }: { profileId: string }) => <p>Equipe do perfil {profileId}</p> }));
vi.mock("sonner", () => ({ toast: { success: fixture.success, error: fixture.error } }));

function open() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(<QueryClientProvider client={client}><MemoryRouter><BusinessSettingsPage /></MemoryRouter></QueryClientProvider>);
  return invalidate;
}
beforeEach(() => {
  vi.clearAllMocks();
  fixture.access.permissions.role = "owner";
  fixture.access.loading = false;
  fixture.access.error = null;
  fixture.access.checkedProfileId = "profile-id";
  fixture.context.business.status = "active";
  fixture.context.publicUrl = "/ba/cidade/territorio/empresas/empresa-real";
});

describe("Business settings active contract", () => {
  it("renders settings without duplicate edit forms or fictitious tabs", () => {
    open();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Configurações da empresa");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText("Salvar alterações")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar dados" })).toHaveAttribute("href", "/central/empresas/profile-id/editar");
    expect(screen.getByRole("link", { name: "Editar localização" })).toHaveAttribute("href", "/central/empresas/profile-id/localizacao");
    expect(screen.getByText("Equipe do perfil profile-id")).toBeInTheDocument();
  });
  it("does not fabricate a public URL for pending businesses", () => {
    fixture.context.publicUrl = null;
    fixture.context.business.status = "pending";
    open();
    expect(screen.getByText("Em análise")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copiar link" })).not.toBeInTheDocument();
  });
  it("copies the resolved public URL as an absolute URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(new URL(fixture.context.publicUrl!, window.location.origin).href));
  });
  it("hides a stale public URL and risk action after soft deletion", () => {
    fixture.context.business.status = "deleted";
    open();
    expect(screen.getByText("Desativada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copiar link" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar empresa" })).not.toBeInTheDocument();
  });
  it.each(["admin", "member"])("hides the destructive action for %s", (role) => {
    fixture.access.permissions.role = role;
    open();
    expect(screen.queryByRole("button", { name: "Desativar empresa" })).not.toBeInTheDocument();
  });
  it("fails closed while access is loading or belongs to another business", () => {
    fixture.access.checkedProfileId = "another-profile";
    open();
    expect(screen.queryByRole("button", { name: "Desativar empresa" })).not.toBeInTheDocument();
  });
  it("cancels without invoking the lifecycle service", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Desativar empresa" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Empresa real");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fixture.remove).not.toHaveBeenCalled();
  });
  it("invokes the existing service only after confirmation and refreshes data", async () => {
    fixture.remove.mockResolvedValue(undefined);
    const invalidate = open();
    fireEvent.click(screen.getByRole("button", { name: "Desativar empresa" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Desativar empresa" }));
    await waitFor(() => expect(fixture.remove).toHaveBeenCalledWith("profile-id"));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["business", "profile-id"] });
  });
});
