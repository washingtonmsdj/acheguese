import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityAliasRoute } from "../CommunityAliasRoute";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";

vi.mock("@/core/routing/services/CommunityPublicAliasService", () => ({
  CommunityPublicAliasService: {
    resolve: vi.fn(),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("CommunityAliasRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona alias legado em /comunidade para a URL curta raiz preservando sufixo e query", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas?origem=zap#topo"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug/*" element={<CommunityAliasRoute />} />
          <Route path="/santa-cruz/empresas" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/empresas?origem=zap#topo"),
      ).toBeInTheDocument(),
    );
    expect(CommunityPublicAliasService.resolve).toHaveBeenCalledWith("santa-cruz");
  });

  it("redireciona rotas explicitas de modulo sem depender do wildcard", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug/empresas" element={<CommunityAliasRoute />} />
          <Route path="/santa-cruz/empresas" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/empresas"),
      ).toBeInTheDocument(),
    );
  });

  it("redireciona subrotas profundas de prefixos conhecidos", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/grupos/grupo-123"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug/grupos/*" element={<CommunityAliasRoute />} />
          <Route
            path="/santa-cruz/grupos/grupo-123"
            element={<LocationProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/grupos/grupo-123"),
      ).toBeInTheDocument(),
    );
  });

  it("exibe 404 territorial quando o alias nao e resolvido", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "not-found",
      alias: "duplicado",
      reason: "Comunidade nao encontrada para este alias.",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/duplicado"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug/*" element={<CommunityAliasRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Comunidade nao encontrada para este alias."),
      ).toBeInTheDocument(),
    );
  });
});
