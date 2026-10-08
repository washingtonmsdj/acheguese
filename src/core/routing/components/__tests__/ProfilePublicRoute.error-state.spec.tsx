import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getByUsername: vi.fn(),
  logPageNotFound: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: { getByUsername: mocks.getByUsername },
}));

vi.mock("@/core/profiles/pages/ProfilePublicPage", () => ({
  ProfilePublicPage: () => <div>Perfil público carregado</div>,
}));

vi.mock("@/core/public-identity/utils/identity-logger", () => ({
  logPageNotFound: mocks.logPageNotFound,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: mocks.info, warn: mocks.warn, error: mocks.error },
}));

import ProfilePublicRoute from "../ProfilePublicRoute";

function renderRoute() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/u/perfil-teste"]}>
        <Routes>
          <Route path="/u/:username" element={<ProfilePublicRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProfilePublicRoute: falha de leitura nao pode ser relatada como 404", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("exibe indisponibilidade com retry e nao registra falso perfil inexistente", async () => {
    mocks.getByUsername.mockRejectedValueOnce(new Error("PostgREST unavailable"));

    renderRoute();

    expect(
      await screen.findByText("Não foi possível carregar o perfil"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeEnabled();
    expect(screen.queryByText("Perfil não encontrado")).not.toBeInTheDocument();
    expect(mocks.logPageNotFound).not.toHaveBeenCalled();
  });

  it("uma repeticao bem-sucedida recupera o perfil sem atribuir 404 anterior", async () => {
    mocks.getByUsername
      .mockRejectedValueOnce(new Error("PostgREST unavailable"))
      .mockResolvedValueOnce({
        id: "profile-1",
        username: "perfil-teste",
        profile_type: "personal",
      });

    renderRoute();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("Perfil público carregado")).toBeInTheDocument();
    expect(mocks.getByUsername).toHaveBeenCalledTimes(2);
    expect(mocks.logPageNotFound).not.toHaveBeenCalled();
  });

  it("ausencia realmente confirmada continua exibindo 404", async () => {
    mocks.getByUsername.mockResolvedValueOnce(null);

    renderRoute();

    expect(await screen.findByText("Perfil não encontrado")).toBeInTheDocument();
    await waitFor(() => expect(mocks.logPageNotFound).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "perfil-teste", entityType: "profile" }),
    ));
    expect(screen.queryByText("Não foi possível carregar o perfil")).not.toBeInTheDocument();
  });

  it("perfil de tipo Business continua fora da rota exclusiva de pessoa", async () => {
    mocks.getByUsername.mockResolvedValueOnce({
      id: "business-1",
      username: "perfil-teste",
      profile_type: "business",
    });

    renderRoute();

    expect(await screen.findByText("Perfil não encontrado")).toBeInTheDocument();
    expect(mocks.logPageNotFound).toHaveBeenCalled();
  });
});
