import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CadastroPrimeiroAcessoPage from "./CadastroPrimeiroAcessoPage";
import { profileService } from "@/core/profiles/services/ProfileService";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  refreshUser: vi.fn(),
  clearPendingSignupContext: vi.fn(),
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
    user: {
      id: "user-1",
      email: "ana@example.com",
      emailConfirmed: true,
    },
    refreshUser: mocks.refreshUser,
  }),
}));

vi.mock("@/core/auth/utils/pendingSignup", () => ({
  getPendingSignupRedirect: () => "/mensagens/abc",
  clearPendingSignupContext: mocks.clearPendingSignupContext,
}));

vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: {
    getRequiredActiveProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
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
  username: "ana.oliveira",
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
    vi.mocked(profileService.getRequiredActiveProfile).mockResolvedValue(
      PROFILE as never,
    );
    vi.mocked(profileService.updateProfile).mockResolvedValue(PROFILE as never);
    mocks.refreshUser.mockResolvedValue(undefined);
  });

  it("preserva o retorno da conversa e permite adiar o perfil", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/Tudo pronto, Ana/i)).toBeInTheDocument();
    expect(screen.getByText(/Sua conversa está esperando/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Completar meu perfil depois/i }),
    );

    expect(mocks.clearPendingSignupContext).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith("/mensagens/abc", {
      replace: true,
    });
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
