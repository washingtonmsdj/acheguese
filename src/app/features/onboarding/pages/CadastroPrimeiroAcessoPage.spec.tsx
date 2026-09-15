import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPrimeiroAcessoPage from "./CadastroPrimeiroAcessoPage";
import { profileService } from "@/core/profiles/services/ProfileService";

const AUTH_USER = {
  id: "user-1",
  email: "ana@example.com",
  emailConfirmed: true,
};

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  refreshUser: vi.fn(),
  completeFirstAccessJourney: vi.fn(),
  usernameCheck: vi.fn(),
  usernameCheckDebounced: vi.fn(),
  usernameReset: vi.fn(),
  session: {
    user: null as typeof AUTH_USER | null,
    isLoading: false,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/core/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    refreshUser: mocks.refreshUser,
  }),
}));

vi.mock("@/core/session/hooks/useSessionContext", () => ({
  useSessionContext: () => mocks.session,
}));

vi.mock("@/core/auth/utils/authJourney", () => ({
  getSignupJourneyReturnTarget: () => "/mensagens/abc",
  completeFirstAccessJourney: mocks.completeFirstAccessJourney,
}));

vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: {
    getRequiredActiveProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock("@/core/public-identity/hooks/useIdentityAvailability", () => ({
  useIdentityAvailability: () => ({
    result: null,
    isChecking: false,
    check: mocks.usernameCheck,
    checkDebounced: mocks.usernameCheckDebounced,
    reset: mocks.usernameReset,
  }),
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

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const PROFILE = {
  id: "profile-1",
  user_id: "user-1",
  profile_type: "personal",
  name: "Ana Oliveira",
  display_name: "Ana Oliveira",
  username: "ana_oliveira",
  city: "",
  verified: false,
  reputation: 0,
  is_active: true,
  created_at: "2026-09-14T00:00:00Z",
  updated_at: "2026-09-14T00:00:00Z",
};

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/cadastro/primeiro-acesso"]}>
        <CadastroPrimeiroAcessoPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("CadastroPrimeiroAcessoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.user = AUTH_USER;
    mocks.session.isLoading = false;
    vi.mocked(profileService.getRequiredActiveProfile).mockResolvedValue(
      PROFILE as never,
    );
    vi.mocked(profileService.updateProfile).mockResolvedValue(PROFILE as never);
    mocks.refreshUser.mockResolvedValue(undefined);
    mocks.usernameCheck.mockResolvedValue({
      identifier: "ana_oliveira",
      status: "available",
    });
  });

  it("aguarda a hidratação da sessão sem expulsar o usuário do primeiro acesso", () => {
    mocks.session.user = null;
    mocks.session.isLoading = true;

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Preparando sua conta");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(profileService.getRequiredActiveProfile).not.toHaveBeenCalled();
  });

  it("redireciona ao fluxo de confirmação somente depois de concluir a hidratação sem usuário", async () => {
    mocks.session.user = null;
    mocks.session.isLoading = false;

    renderPage();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/login?confirmed=1", {
        replace: true,
      });
    });
    expect(profileService.getRequiredActiveProfile).not.toHaveBeenCalled();
  });

  it("preserva o retorno da conversa e encerra a jornada ao adiar o perfil", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/Tudo pronto, Ana/i)).toBeInTheDocument();
    expect(screen.getByText(/Sua conversa está esperando/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Completar meu perfil depois/i }),
    );

    expect(mocks.completeFirstAccessJourney).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith("/mensagens/abc", {
      replace: true,
    });
  });

  it("oferece @usuário amigável quando OAuth criou um identificador automático", async () => {
    const user = userEvent.setup();
    const generatedProfile = {
      ...PROFILE,
      username: "ana_1a2b3c4d",
    };
    const friendlyProfile = {
      ...PROFILE,
      username: "ana_oliveira",
    };
    vi.mocked(profileService.getRequiredActiveProfile).mockResolvedValue(
      generatedProfile as never,
    );
    vi.mocked(profileService.updateProfile).mockResolvedValue(
      friendlyProfile as never,
    );

    renderPage();

    expect(await screen.findByText("@ana_1a2b3c4d")).toBeInTheDocument();
    expect(
      screen.getByText(/identificador atual foi criado automaticamente/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Escolher meu @usuário/i }),
    );

    const usernameInput = screen.getByLabelText("Seu @usuário");
    await user.clear(usernameInput);
    await user.type(usernameInput, "Ana_Oliveira");

    expect(usernameInput).toHaveValue("ana_oliveira");
    expect(mocks.usernameCheckDebounced).toHaveBeenLastCalledWith("ana_oliveira");

    await user.click(
      screen.getByRole("button", { name: /Salvar @usuário/i }),
    );

    await waitFor(() => {
      expect(mocks.usernameCheck).toHaveBeenCalledWith("ana_oliveira");
      expect(profileService.updateProfile).toHaveBeenCalledWith("profile-1", {
        username: "ana_oliveira",
      });
    });
    expect(mocks.refreshUser).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("@ana_oliveira")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Escolher meu @usuário/i }),
    ).not.toBeInTheDocument();
  });

  it("não oferece troca obrigatória quando o @usuário já é amigável", async () => {
    renderPage();

    expect(await screen.findByText("@ana_oliveira")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Escolher meu @usuário/i }),
    ).not.toBeInTheDocument();
  });

  it("salva território real depois da criação e mantém localização pública oculta", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/Tudo pronto, Ana/i);
    await user.click(
      screen.getByRole("button", { name: /Informar cidade e bairro/i }),
    );

    await user.selectOptions(screen.getByLabelText("Estado"), "state-ba");
    await user.selectOptions(screen.getByLabelText("Cidade"), "city-salvador");
    await user.selectOptions(screen.getByLabelText("Bairro"), "district-pituba");
    await user.click(
      screen.getByRole("button", { name: /Salvar cidade e bairro/i }),
    );

    await waitFor(() =>
      expect(profileService.updateProfile).toHaveBeenCalledWith("profile-1", {
        state: "Bahia",
        city: "Salvador",
        neighborhood: "Pituba",
        location_id: "district-pituba",
        main_territory_location_id: "district-pituba",
        public_location_visibility: "hidden",
      }),
    );
    expect(mocks.refreshUser).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/Cidade e bairro salvos/i),
    ).toBeInTheDocument();
  });
});
