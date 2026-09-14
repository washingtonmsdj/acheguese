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

vi.mock("@/core/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: { signUp: vi.fn() },
}));

vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: vi.fn(),
}));

vi.mock("@/core/auth/utils/pendingSignup", () => ({
  setPendingSignupEmail: mocks.setEmail,
  setPendingSignupRedirect: mocks.setRedirect,
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderPage(path = "/cadastro") {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <CadastroPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

async function fillAccount(user: ReturnType<typeof userEvent.setup>) {
  const nameFields = screen.getAllByLabelText(/Nome/i);
  await user.type(nameFields[0], "Ana Souza");
  await user.type(screen.getByLabelText(/Nome de usuário/i), "ana_souza");
  await user.type(screen.getByLabelText(/^E-mail$/i), "ana@example.com");
  await user.type(screen.getByLabelText(/^Senha$/i), "SenhaSegura@2026");
}

describe("CadastroPage — conceito account-first", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
    vi.mocked(AuthService.signUp).mockResolvedValue(undefined);
  });

  it("é uma única tela e não exige território nem confirmação de senha", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /Comece pelo seu perfil pessoal/i })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Estado|Cidade|Bairro/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Confirmar senha/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar minha conta/i })).toBeDisabled();
  });

  it("mostra validação junto aos campos e mantém termos obrigatórios", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText(/Aceito os Termos/i));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/i }));

    expect(await screen.findByText(/Nome deve ter pelo menos 3 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/Deve começar com letra e ter 3-30/i)).toBeInTheDocument();
    expect(AuthService.signUp).not.toHaveBeenCalled();
  });

  it("cria a conta sem inventar cidade ou bairro e preserva o retorno", async () => {
    const user = userEvent.setup();
    renderPage("/cadastro?redirect=%2Fmensagens%2Fabc");
    await fillAccount(user);
    await user.click(screen.getByLabelText(/Aceito os Termos/i));
    const submit = screen.getByRole("button", { name: /Criar minha conta/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(AuthService.signUp).toHaveBeenCalledTimes(1));
    expect(AuthService.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ana@example.com",
        handle: "ana_souza",
        name: "Ana Souza",
      }),
    );
    expect(AuthService.signUp).toHaveBeenCalledWith(
      expect.not.objectContaining({ city: expect.anything() }),
    );
    expect(mocks.setRedirect).toHaveBeenCalledWith("/mensagens/abc");
  });

  it("exibe o erro do servidor sem avançar para falso sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(AuthService.signUp).mockRejectedValueOnce(new Error("User already registered"));
    renderPage();
    await fillAccount(user);
    await user.click(screen.getByLabelText(/Aceito os Termos/i));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalledWith("/cadastro/confirmacao", expect.anything());
  });
});
