import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessPhotosPage from "@/modules/business/dashboard/pages/BusinessPhotosPage";

const fixture = vi.hoisted(() => ({ remove: vi.fn(), busy: false }));
vi.mock("@/modules/business/dashboard/businessDashboardContext", () => ({
  useActiveBusinessDashboardContext: () => ({ businessId: "business-test", publicUrl: null, business: { name: "Empresa de teste", category: "educacao", business_data_id: "data-test", profile_id: "profile-test" } }),
}));
vi.mock("@/modules/business/dashboard/hooks/useBusinessGallery", () => ({
  useBusinessGallery: () => ({
    query: { data: [{ id: "photo-test", image_url: null, caption: "Fachada", is_featured: false }], isSuccess: true, isPending: false, isError: false },
    upload: { isPending: fixture.busy }, remove: { isPending: false, mutate: fixture.remove },
    feature: { isPending: false }, reorder: { isPending: false }, maxPhotos: 20,
  }),
}));

beforeEach(() => { fixture.remove.mockClear(); fixture.busy = false; });
const open = () => render(<MemoryRouter><BusinessPhotosPage /></MemoryRouter>);

describe("Business photos removal confirmation", () => {
  it("requires confirmation and identifies the photo", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Remover foto 1" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Foto: Fachada");
    expect(fixture.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remover foto", exact: true }));
    expect(fixture.remove).toHaveBeenCalledExactlyOnceWith("photo-test");
  });

  it("cancels without deleting", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Remover foto 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Manter foto" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Remover foto 1" })).toHaveFocus();
    expect(fixture.remove).not.toHaveBeenCalled();
  });

  it("does not allow removal while another gallery mutation is pending", () => {
    fixture.busy = true;
    open();
    expect(screen.getByRole("button", { name: "Remover foto 1" })).toBeDisabled();
  });

  it("closes with Escape without deleting and restores focus", async () => {
    open();
    const trigger = screen.getByRole("button", { name: "Remover foto 1" });
    fireEvent.click(trigger);
    fireEvent.keyDown(await screen.findByRole("alertdialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fixture.remove).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });
});
