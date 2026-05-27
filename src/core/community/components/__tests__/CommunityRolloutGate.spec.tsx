import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityRolloutGate } from "@/core/community/components/CommunityRolloutGate";

const useCommunityRolloutMock = vi.fn();
const useCommunityLocationMock = vi.fn();
const useTerritoryResolutionLevelMock = vi.fn();

vi.mock("@/core/community/hooks/useCommunityRollout", () => ({
  useCommunityRollout: () => useCommunityRolloutMock(),
}));

vi.mock("@/core/community/hooks/useCommunityLocation", () => ({
  useCommunityLocation: () => useCommunityLocationMock(),
}));

vi.mock("@/core/location/hooks/useTerritoryResolutionLevel", () => ({
  useTerritoryResolutionLevel: () => useTerritoryResolutionLevelMock(),
}));

vi.mock("@/core/routing/hooks/useAppUrls", () => ({
  useAppUrls: () => ({ profile: { addresses: "/perfil/enderecos" } }),
}));

describe("CommunityRolloutGate", () => {
  beforeEach(() => {
    useCommunityRolloutMock.mockReset();
    useCommunityLocationMock.mockReset();
    useTerritoryResolutionLevelMock.mockReset();
    useTerritoryResolutionLevelMock.mockReturnValue({
      level: "neighborhood",
      loading: false,
    });
  });

  it("bloqueia apenas no gate do módulo community quando o rollout estiver restrito", () => {
    useCommunityLocationMock.mockReturnValue({
      hasActiveLocation: true,
      locationName: "Pituba",
    });
    useCommunityRolloutMock.mockReturnValue({
      isBlocked: true,
      blockReason: "Community não está disponível nesta localização",
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <CommunityRolloutGate>
          <div>conteudo da comunidade</div>
        </CommunityRolloutGate>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Community não está disponível nesta localização/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("conteudo da comunidade"),
    ).not.toBeInTheDocument();
  });
});
