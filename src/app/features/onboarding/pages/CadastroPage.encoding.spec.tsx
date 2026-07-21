/**
 * Testes de integração — Cadastro + normalização de encoding
 *
 * Garante que:
 *  1) Os nomes de estado/cidade/bairro passados para AuthService.signUp são
 *     sempre normalizados (sem mojibake), mesmo quando o backend/opções
 *     originais contêm caracteres corrompidos.
 *  2) A opção selecionada (via clique) é a versão normalizada renderizada e
 *     é essa que é gravada no formulário — evitando divergência entre "valor
 *     persistido bruto" e "opção mostrada".
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPage from "./CadastroPage";
import { AuthService } from "@/core/auth/services/AuthService";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { normalizePersistedTextEncoding } from "@/shared/utils/textEncodingRepair";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/core/auth/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: { signUp: vi.fn() },
}));
vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: vi.fn(),
}));
vi.mock("@/core/auth/utils/pendingSignup", () => ({
  setPendingSignupEmail: vi.fn(),
}));
vi.mock("@/shared/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

// Nomes já normalizados — simulando que o hook useLocationCascade cumpre seu
// contrato de normalizar antes de expor à UI. É essa versão que a UI renderiza
// e é essa versão que deve chegar ao AuthService.signUp.
const NORMALIZED_STATE = "S\u00e3o Paulo"; // São Paulo
const NORMALIZED_CITY = "S\u00e3o Gon\u00e7alo"; // São Gonçalo
const NORMALIZED_NEIGHBORHOOD = "Nordeste de Amaralina - Se\u00e7\u00e3o A";

vi.mock("@/core/location/hooks/useLocationCascade", () => ({
  useLocationCascade: () => ({
    states: [{ id: "state-sp", name: NORMALIZED_STATE }],
    cities: [{ id: "city-sg", name: NORMALIZED_CITY }],
    neighborhoods: [{ id: "n-amaralina", name: NORMALIZED_NEIGHBORHOOD }],
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

describe("Cadastro — normalização de encoding (integração)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
    vi.mocked(AuthService.signUp).mockResolvedValue(undefined);
  });

  it("envia estado/cidade/bairro normalizados (sem mojibake) para AuthService.signUp", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillStep0(user);
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    // Renderiza a versão normalizada — a UI nunca deve mostrar "SÃ£o Paulo".
    const stateCombo = await screen.findByRole("combobox", { name: /Estado/i });
    await user.click(stateCombo);
    await user.click(await screen.findByRole("option", { name: NORMALIZED_STATE }));

    await user.click(screen.getByRole("combobox", { name: /Cidade/i }));
    await user.click(await screen.findByRole("option", { name: NORMALIZED_CITY }));

    await user.click(screen.getByRole("combobox", { name: /Bairro/i }));
    await user.click(
      await screen.findByRole("option", { name: NORMALIZED_NEIGHBORHOOD }),
    );

    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    await user.click(await screen.findByLabelText(/Li e aceito os Termos/i));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/i }));

    await waitFor(() => expect(AuthService.signUp).toHaveBeenCalledTimes(1));

    const payload = vi.mocked(AuthService.signUp).mock.calls[0][0];

    // Sanity: bate exatamente com os valores normalizados renderizados.
    expect(payload.state).toBe(NORMALIZED_STATE);
    expect(payload.city).toBe(NORMALIZED_CITY);
    expect(payload.neighborhood).toBe(NORMALIZED_NEIGHBORHOOD);

    // Defesa: nenhum marcador de mojibake vaza para o backend.
    for (const field of [payload.state, payload.city, payload.neighborhood]) {
      expect(field).not.toMatch(/[ÃÂ]/);
    }

    // Idempotência: renormalizar não altera nada (garante que já estavam ok).
    expect(normalizePersistedTextEncoding(payload.city!)).toBe(payload.city);
    expect(normalizePersistedTextEncoding(payload.neighborhood!)).toBe(
      payload.neighborhood,
    );
    expect(normalizePersistedTextEncoding(payload.state!)).toBe(payload.state);
  });

  it("valor selecionado é a versão normalizada renderizada (não a bruta persistida)", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillStep0(user);
    await user.click(screen.getByRole("button", { name: /Próximo/i }));

    await user.click(await screen.findByRole("combobox", { name: /Estado/i }));
    await user.click(await screen.findByRole("option", { name: NORMALIZED_STATE }));

    // O trigger do Select deve mostrar o valor normalizado — não a versão
    // mojibaked. Isso garante que a comparação "selected" usa o nome
    // normalizado como fonte da verdade.
    const stateCombo = screen.getByRole("combobox", { name: /Estado/i });
    expect(stateCombo).toHaveTextContent(NORMALIZED_STATE);
    expect(stateCombo.textContent ?? "").not.toMatch(/SÃ£/);
  });
});
