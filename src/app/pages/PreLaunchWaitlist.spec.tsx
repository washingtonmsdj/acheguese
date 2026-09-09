import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PreLaunchWaitlist from "./PreLaunchWaitlist";
import { registerCommunityInterest } from "@/core/routing/services";

vi.mock("@/core/routing/services", () => ({
  registerCommunityInterest: vi.fn(),
}));
vi.mock("@/shared/components/security/TurnstileWidget", () => ({
  TurnstileWidget: () => null,
}));
vi.mock("@/shared/config/security.config", () => ({
  COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG: {
    minimumFillMs: 0,
    turnstileRequiredInProduction: false,
  },
}));

function fillForm(contact = "ana@example.com") {
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Ana Santos" },
  });
  fireEvent.change(screen.getByLabelText("Email ou WhatsApp"), {
    target: { value: contact },
  });
  fireEvent.change(screen.getByLabelText("Bairro"), {
    target: { value: "Santa Cruz" },
  });
}

describe("PreLaunchWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a valid contact and neighborhood before enabling registration", () => {
    render(<PreLaunchWaitlist />);
    expect(
      screen.getByRole("button", { name: "Quero ser avisado" }),
    ).toBeDisabled();
    fillForm("contato-invalido");
    expect(
      screen.getByRole("button", { name: "Quero ser avisado" }),
    ).toBeDisabled();
    expect(registerCommunityInterest).not.toHaveBeenCalled();
  });

  it("registers the selected launch neighborhood through the existing service", async () => {
    vi.mocked(registerCommunityInterest).mockResolvedValue({
      status: "registered",
    });
    render(<PreLaunchWaitlist />);
    fillForm();
    fireEvent.submit(screen.getByRole("form", { name: "Lista de espera" }));
    await waitFor(() =>
      expect(registerCommunityInterest).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ana Santos",
          email: "ana@example.com",
          territoryPath: "/ba/salvador/santa-cruz",
          source: "prelaunch-home",
          role: "morador",
          wantsUpdates: true,
        }),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Cadastro recebido",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("keeps the WhatsApp contact contract and reports an existing registration", async () => {
    vi.mocked(registerCommunityInterest).mockResolvedValue({
      status: "already_registered",
    });
    render(<PreLaunchWaitlist />);
    fillForm("71999998888");
    fireEvent.submit(screen.getByRole("form", { name: "Lista de espera" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Você já está na lista",
    );
    expect(registerCommunityInterest).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "whatsapp+71999998888@waitlist.acheguese.local",
        phone: "71999998888",
      }),
    );
  });

  it("preserves the entered data after a failed request so registration can be retried", async () => {
    vi.mocked(registerCommunityInterest).mockRejectedValue(
      new Error("Não foi possível enviar agora."),
    );
    render(<PreLaunchWaitlist />);
    fillForm();
    fireEvent.submit(screen.getByRole("form", { name: "Lista de espera" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Não foi possível enviar agora",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Ana Santos");
    expect(
      screen.getByRole("button", { name: "Quero ser avisado" }),
    ).toBeEnabled();
  });
});
