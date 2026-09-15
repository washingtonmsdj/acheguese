import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { AuthService } from "@/core/auth/services/AuthService";
import { PublicIdentityService } from "@/core/public-identity/services/PublicIdentityService";
import CadastroPage from "./CadastroPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  prepareEmailSignupConfirmation: vi.fn(),
  prepareGoogleSignup: vi.fn(),
  cancelGoogleSignup: vi.fn(),
  completeStandardLoginJourney: vi.fn(),
  checkDebounced: vi.fn(),
  resetAvailability: vi.fn(),
  signInWithGoogle: vi.fn(),
  session: {
    user: null as {
      id: string;
      email: string;
      emailConfirmed: boolean;
    } | null,
    isLoading: false,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock("@/core/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    signInWithGoogle: mocks.signInWithGoogle,
    googleAuthAvailable: false,
  }),
}));

vi.mock("@/core/session/hooks/useSessionContext", () => ({
  useSessionContext: () => mocks.session,
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

vi.mock("@/core/public-identity/services/PublicIdentityService", () => ({
  PublicIdentityService: { checkAvailability: vi.fn() },
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderPage(path = AUTH_PATHS.signup) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <CadastroPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("CadastroPage — conceito account-first", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.user = null;
    mocks.session.isLoading = false;
    vi.mocked(PublicIdentityService.checkAvailability).mockResolvedValue({
      status: "available",
      identifier: "available_user",
    });
  });

  it("é uma única tela e não exige território nem confirmação de senha", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /Comece pelo seu perfil pessoal/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /Estado|Cidade|Bairro/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Confirmar senha/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar minha conta/i })).toBeDisabled();
  });

  it("normaliza maiúsculas do @usuário sem apagar caracteres válidos", async () => {
    const user = userEvent.setup();
    renderPage();

    const usernameInput = screen.getByLabelText(/Nome de usuário/i);
    await user.type(usernameInput, "Ana_Silva");

    expect(usernameInput).toHaveValue("ana_silva");
    expect(mocks.checkDebounced).toHaveBeenLastCalledWith("ana_silva");
  });

  it("mantém a tela inerte enquanto a sessão inicial está sendo hidratada", () => {
    mocks.session.isLoading = true;
    renderPage();

    expect(screen.getByRole("button", { name: /Criar minha conta/i })).toBeDisabled();
    expect(screen.getByLabelText(/^E-mail$/i)).toBeDisabled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(AuthService.signUp).not.toHaveBeenCalled();
  });

  it("redireciona uma sessão já autenticada somente após a hidratação", async () => {
    mocks.session.user = {
      id: "user-1",
      email: "person@example.test",
      emailConfirmed: true,
    };
    renderPage(`${AUTH_PATHS.signup}?redirect=%2Fmensagens%2Fabc`);

    await waitFor(() => {
      expect(mocks.completeStandardLoginJourney).toHaveBeenCalledTimes(1);
      expect(mocks.navigate).toHaveBeenCalledWith("/mensagens/abc", {
        replace: true,
      });
    });
    expect(screen.getByRole("button", { name: /Criar minha conta/i })).toBeDisabled();
  });

  it("mostra validação junto aos campos e mantém termos obrigatórios", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText(/Aceito os Termos/i));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/i }));

    expect(
      await screen.findByText(/Nome deve ter pelo menos 3 caracteres/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Deve começar com letra e ter 3-30/i)).toBeInTheDocument();
    expect(AuthService.signUp).not.toHaveBeenCalled();
  });
});
