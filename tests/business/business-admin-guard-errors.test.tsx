import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const state = vi.hoisted(() => ({
  business: {
    business: { id: "profile-1", profile_id: "profile-1" } as { id: string; profile_id: string } | null,
    isLoading: false,
    error: null as Error | null,
    notFound: false,
    retry: vi.fn(),
  },
  access: {
    permissions: { hasAccess: false, role: undefined as string | undefined },
    loading: true,
    checkedProfileId: null as string | null,
    error: null as string | null,
    refetch: vi.fn(),
  },
  toast: vi.fn(),
}));

vi.mock("@/core/business/hooks/useBusiness", () => ({
  useBusiness: () => state.business,
}));
vi.mock("@/core/business/hooks/useDashboardAccess", () => ({
  useDashboardAccess: () => state.access,
}));
vi.mock("sonner", () => ({
  toast: { error: state.toast },
}));

import { BusinessAdminGuard } from "@/modules/central/guards/BusinessAdminGuard";

function open() {
  return render(
    <MemoryRouter initialEntries={["/central/empresas/profile-1/editar"]}>
      <Routes>
        <Route path="/central/empresas" element={<p>Lista de empresas</p>} />
        <Route path="/central/empresas/:businessId" element={<BusinessAdminGuard />}>
          <Route path="editar" element={<p>Gestão autorizada</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Business Central management guard error states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.business.business = { id: "profile-1", profile_id: "profile-1" };
    state.business.isLoading = false;
    state.business.error = null;
    state.business.notFound = false;
    state.access.permissions = { hasAccess: false, role: undefined };
    state.access.loading = true;
    state.access.checkedProfileId = null;
    state.access.error = null;
  });

  it("shows retry instead of a permanent spinner when cached business lookup failed", () => {
    state.business.error = new Error("Network unavailable");
    open();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível verificar");
    expect(screen.queryByText("Verificando permissões...")).not.toBeInTheDocument();
    expect(screen.queryByText("Gestão autorizada")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(state.business.retry).toHaveBeenCalledOnce();
  });

  it("preserves denial while authorization service is unavailable", () => {
    state.access.loading = false;
    state.access.error = "Falha ao verificar o gestor";
    open();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Gestão autorizada")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(state.access.refetch).toHaveBeenCalledOnce();
  });

  it("renders the protected outlet only after a current matching authorization result", () => {
    state.access.loading = false;
    state.access.checkedProfileId = "profile-1";
    state.access.permissions = { hasAccess: true, role: "admin" };
    open();
    expect(screen.getByText("Gestão autorizada")).toBeInTheDocument();
  });
});
