import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPage from "./CadastroPage";
import { AuthService } from "@/core/auth/services/AuthService";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setEmail: vi.fn(),
  setRedirect: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock("@/core/auth/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/core/auth/services/AuthService", () => ({ AuthService: { signUp: vi.fn() } }));
vi.mock("@/core/auth/utils/compromisedPassword", () => ({ checkPasswordCompromise: vi.fn() }));
vi.mock("@/core/auth/utils/pendingSignup", () => ({
  setPendingSignupEmail: mocks.setEmail,
  setPendingSignupRedirect: mocks.setRedirect,
}));
vi.mock("@/shared/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/cadastro"]}>
        <CadastroPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("Cadastro — encoding e texto pt-BR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPasswordCompromise).mockResolvedValue({ blocked: false, count: 0, unavailable: false });
    vi.mocked(AuthService.signUp).mockResolvedValue(undefined);
  });

  it("preserva nome Unicode sem mojibake e não persiste território fictício", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Nome$/i), "Ana Conceição");
    await user.type(screen.getByLabelText(/Nome de usuário/i), "ana_conceicao");
    await user.type(screen.getByLabelText(/^E-mail$/i), "ana@example.com");
    await user.type(screen.getByLabelText(/^Senha$/i), "SenhaSegura@2026");
    await user.click(screen.getByLabelText(/Aceito os Termos/i));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/i }));

    await waitFor(() => expect(AuthService.signUp).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(AuthService.signUp).mock.calls[0][0];
    expect(payload.name).toBe("Ana Conceição");
    expect(payload.display_name).toBe("Ana Conceição");
    expect(payload.name).not.toMatch(/[ÃÂ]/);
    expect(payload).not.toHaveProperty("city");
    expect(payload).not.toHaveProperty("neighborhood");
    expect(payload).not.toHaveProperty("state");
  });

  it("renderiza o texto brasileiro do conceito sem corrupção", () => {
    renderPage();
    expect(screen.getByText(/Comece pelo seu perfil pessoal/i)).toBeInTheDocument();
    expect(screen.getByText(/Você pode se cadastrar de qualquer lugar/i)).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/[ÃÂ][\x80-\xBF]?/);
  });
});
