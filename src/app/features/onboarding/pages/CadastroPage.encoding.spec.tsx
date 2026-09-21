import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { AuthService } from "@/core/auth/services/AuthService";
import { prepareEmailSignupConfirmation } from "@/core/auth/utils/authJourney";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { PublicIdentityService } from "@/core/public-identity";
import CadastroPage from "./CadastroPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  prepareEmailSignupConfirmation: vi.fn(),
  prepareGoogleSignup: vi.fn(),
  cancelGoogleSignup: vi.fn(),
  completeStandardLoginJourney: vi.fn(),
  checkDebounced: vi.fn(),
  resetAvailability: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock("@/core/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    signInWithGoogle: vi.fn(),
    googleAuthAvailable: false,
  }),
}));
vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: { signUp: vi.fn() },
}));
vi.mock("@/core/auth/utils/authJourney", () => ({
  prepareEmailSignupConfirmation: mocks.prepareEmailSignupConfirmation,
  prepareGoogleSignup: mocks.prepareGoogleSignup,
  cancelGoogleSignup: mocks.cancelGoogleSignup,
  completeStandardLoginJourney: mocks.completeStandardLoginJourney,
}));
vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: vi.fn(),
}));
vi.mock("@/core/public-identity/hooks/useIdentityAvailability", () => ({
  useIdentityAvailability: () => ({
    result: null,
    isChecking: false,
    check: vi.fn(),
    checkDebounced: mocks.checkDebounced,
    reset: mocks.resetAvailability,
  }),
}));
vi.mock("@/core/public-identity", () => ({
  PublicIdentityService: { checkAvailability: vi.fn() },
}));
vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[AUTH_PATHS.signup]}>
        <CadastroPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("Cadastro — encoding e texto pt-BR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PublicIdentityService.checkAvailability).mockResolvedValue({
      status: "available",
      identifier: "ana_conceicao",
    });
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
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
    expect(payload.handle).toBe("ana_conceicao");
    expect(payload.name).not.toMatch(/[ÃÂ]/);
    expect(payload).not.toHaveProperty("display_name");
    expect(payload).not.toHaveProperty("city");
    expect(payload).not.toHaveProperty("neighborhood");
    expect(payload).not.toHaveProperty("state");
    expect(prepareEmailSignupConfirmation).toHaveBeenCalledWith(
      "ana@example.com",
      "/",
    );
  });

  it("renderiza o texto brasileiro do conceito sem corrupção", () => {
    renderPage();
    expect(screen.getByText(/Comece pelo seu perfil pessoal/i)).toBeInTheDocument();
    expect(screen.getByText(/Você pode se cadastrar de qualquer lugar/i)).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/[ÃÂ][\x80-\xBF]?/);
  });
});
