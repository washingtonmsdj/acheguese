/**
 * Testes de integração — CadastroPage
 *
 * Cobre:
 *  1) Erros de Zod exibidos por campo ao tentar avançar com dados inválidos.
 *  2) Botão "Criar minha conta" desabilitado sem aceite dos Termos e liberado
 *     quando o checkbox é marcado.
 *  3) Submit final chama AuthService.signUp com os dados do formulário e
 *     exibe erro amigável no banner quando a API rejeita o cadastro.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPage from "./CadastroPage";
import { AuthService } from "@/core/auth/services/AuthService";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
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
  setPendingSignupEmail: vi.fn(),
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/core/location/hooks/useLocationCascade", () => ({
  useLocationCascade: () => ({
    states: [{ id: "state-ba", name: "Bahia" }],
    cities: [{ id: "city-salvador", name: "Salvador" }],
    neighborhoods: [{ id: "district-pituba", name: "Pituba" }],
    loadingStates: false,
    loadingCities: false,
    loadingNeighborhoods: false,
  }),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/cadastro"]}>
        <CadastroPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

async function fillStep0(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/Seu nome/i), "Ana Souza");
  await user.type(screen.getByPlaceholderText(/^seunome/i), "ana_souza");
  await user.type(
    screen.getByPlaceholderText(/seu@email\.com/i),
    "ana@example.com",
  );
  await user.type(
    screen.getByPlaceholderText(/M[íi]nimo .* caracteres/i),
    "SenhaSegura@2026",
  );
  await user.type(
    screen.getByPlaceholderText(/Repita a senha/i),
    "SenhaSegura@2026",
  );
}

describe("CadastroPage (integração)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
    vi.mocked(AuthService.signUp).mockResolvedValue(undefined);
  });

  it("mostra erros do Zod nos campos ao tentar avançar com dados inválidos", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    expect(
      await screen.findByText(/Nome deve ter pelo menos 3 caracteres/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deve comecar com letra e ter 3-30/i),
    ).toBeInTheDocument();
    // signUp não deve ser chamado enquanto houver erros
    expect(AuthService.signUp).not.toHaveBeenCalled();
  });

  it("bloqueia o submit sem aceite dos Termos e libera quando marcado", async () => {
    const user = userEvent.setup();
    renderPage();

    // Step 0
    await fillStep0(user);
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    // Step 1 — seleciona território
    await user.click(
      await screen.findByRole("combobox", { name: /Estado/i }),
    );
    await user.click(await screen.findByRole("option", { name: "Bahia" }));
    await user.click(screen.getByRole("combobox", { name: /Cidade/i }));
    await user.click(await screen.findByRole("option", { name: "Salvador" }));
    await user.click(screen.getByRole("combobox", { name: /Bairro/i }));
    await user.click(await screen.findByRole("option", { name: "Pituba" }));
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    // Step 2 — botão desabilitado sem aceite
    const submit = await screen.findByRole("button", {
      name: /Criar minha conta/i,
    });
    expect(submit).toBeDisabled();

    // Aceita termos
    await user.click(screen.getByLabelText(/Li e aceito os Termos/i));

    await waitFor(() => expect(submit).toBeEnabled());

    // Submit chama AuthService.signUp
    await user.click(submit);

    await waitFor(() =>
      expect(AuthService.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "ana@example.com",
          handle: "ana_souza",
          city: "Salvador",
          neighborhood: "Pituba",
          state: "Bahia",
        }),
      ),
    );
  });

  it("exibe banner de erro quando a API rejeita o cadastro", async () => {
    const user = userEvent.setup();
    vi.mocked(AuthService.signUp).mockRejectedValueOnce(
      new Error("User already registered"),
    );
    renderPage();

    await fillStep0(user);
    await user.click(screen.getByRole("button", { name: /Próximo/i }));
    await user.click(
      await screen.findByRole("combobox", { name: /Estado/i }),
    );
    await user.click(await screen.findByRole("option", { name: "Bahia" }));
    await user.click(screen.getByRole("combobox", { name: /Cidade/i }));
    await user.click(await screen.findByRole("option", { name: "Salvador" }));
    await user.click(screen.getByRole("combobox", { name: /Bairro/i }));
    await user.click(await screen.findByRole("option", { name: "Pituba" }));
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    await user.click(await screen.findByLabelText(/Li e aceito os Termos/i));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/i }));

    // Erro amigável exibido em algum lugar do formulário
    await waitFor(() =>
      expect(screen.getByText(/já está cadastrado/i)).toBeInTheDocument(),
    );
  });

  it("desabilita o formulário e exibe spinner no submit enquanto a requisição está em andamento", async () => {
    const user = userEvent.setup();
    let resolveSignUp: (value: void) => void = () => {};
    vi.mocked(AuthService.signUp).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve;
        }),
    );

    renderPage();

    await fillStep0(user);
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    await user.click(await screen.findByRole("combobox", { name: /Estado/i }));
    await user.click(await screen.findByRole("option", { name: "Bahia" }));
    await user.click(screen.getByRole("combobox", { name: /Cidade/i }));
    await user.click(await screen.findByRole("option", { name: "Salvador" }));
    await user.click(screen.getByRole("combobox", { name: /Bairro/i }));
    await user.click(await screen.findByRole("option", { name: "Pituba" }));
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    await user.click(await screen.findByLabelText(/Li e aceito os Termos/i));

    const submit = screen.getByRole("button", { name: /Criar minha conta/i });
    await waitFor(() => expect(submit).toBeEnabled());

    await user.click(submit);

    // Botão de submit desabilitado e com spinner
    await waitFor(() => expect(submit).toBeDisabled());
    expect(submit.querySelector("svg.animate-spin")).toBeInTheDocument();

    // Campos do step de confirmação também devem estar desabilitados
    expect(screen.getByLabelText(/Li e aceito os Termos/i)).toBeDisabled();

    // Voltar e Próximo (neste step não existe Próximo) devem estar desabilitados
    expect(screen.getByRole("button", { name: /Voltar/i })).toBeDisabled();

    resolveSignUp();

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
  });
});
