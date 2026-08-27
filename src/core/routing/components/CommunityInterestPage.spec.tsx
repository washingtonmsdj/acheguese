import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocationStatus, LocationType } from "@/core/location/types";
import type { TerritorialCommunityProfile } from "@/core/community-experience/types";
import type {
  ResolvedTerritory,
  TerritoryResolveResult,
} from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { CommunityInterestPage } from "./CommunityInterestPage";

const mocks = vi.hoisted(() => ({
  resolveResult: null as TerritoryResolveResult | null,
  profile: null as TerritorialCommunityProfile | null,
  profileLoading: false,
  registerCommunityInterest: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/core/routing/hooks/useResolveTerritoryFromUrl", () => ({
  TERRITORY_RESOLVE_STATUS: {
    IDLE: "idle",
    LOADING: "loading",
    RESOLVED_LOCATION: "resolved_location",
    RESOLVED_GROUP: "resolved_group",
    NOT_FOUND: "not_found",
    INACTIVE: "inactive",
    RESTRICTED: "restricted",
    ERROR: "error",
  },
  useResolveTerritoryFromUrl: () => mocks.resolveResult,
}));

vi.mock("@/core/community-experience/hooks/useCommunityProfile", () => ({
  usePersistedCommunityProfile: () => ({
    data: mocks.profile,
    isLoading: mocks.profileLoading,
  }),
}));

vi.mock("@/core/routing/services", () => ({
  registerCommunityInterest: mocks.registerCommunityInterest,
}));

vi.mock("@/shared/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/shared/config/security.config", () => ({
  COMMUNITY_INTEREST_ANTI_ABUSE_CONFIG: {
    minimumFillMs: 0,
    turnstileRequiredInProduction: true,
    turnstileAction: "community-interest",
  },
}));

vi.mock("@/shared/components/security/TurnstileWidget", () => ({
  TurnstileWidget: () => <div data-testid="turnstile-widget" />,
}));

const cityResolved: Exclude<ResolvedTerritory, null> = {
  kind: "location",
  location: {
    id: "63c41c29-adce-40f5-a552-e52d176123c3",
    parent_id: "location-ba",
    type: LocationType.CITY,
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, BA",
    geographic_path: "/br/ba/salvador",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
};

const pitubaResolved: Exclude<ResolvedTerritory, null> = {
  kind: "location",
  location: {
    id: "384add59-4e53-489d-a7b5-97dea2b3f442",
    parent_id: cityResolved.location.id,
    type: LocationType.NEIGHBORHOOD,
    slug: "pituba",
    name: "Pituba",
    full_name: "Pituba, Salvador, BA",
    geographic_path: "/br/ba/salvador/pituba",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
};

const persistedPitubaProfile: TerritorialCommunityProfile = {
  id: "df35fffd-e1b6-45b5-9597-a24e301c28e7",
  name: "Achegue-se Pituba",
  slug: "pituba",
  city_id: cityResolved.location.id,
  territory_type: "neighborhood",
  territory_id: pitubaResolved.location.id,
  status: "coming_soon",
  headline: null,
  description: null,
  launch_message: null,
  hero_title: null,
  hero_subtitle: null,
  primary_cta_label: null,
  secondary_cta_label: null,
  is_featured: false,
  sort_order: 0,
};

function PathProbe() {
  return <div data-testid="current-path">{useLocation().pathname}</div>;
}

function renderInterestPage(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/comunidade/:state/:city/interesse"
            element={<CommunityInterestPage />}
          />
          <Route
            path="/comunidade/:state/:city/:groupSlugOrDistrict/interesse"
            element={<CommunityInterestPage />}
          />
          <Route path="*" element={<PathProbe />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("CommunityInterestPage persisted write boundary", () => {
  beforeEach(() => {
    mocks.resolveResult = {
      status: "resolved_location",
      resolved: cityResolved,
      error: null,
    };
    mocks.profile = null;
    mocks.profileLoading = false;
    mocks.registerCommunityInterest.mockReset();
    mocks.registerCommunityInterest.mockResolvedValue({ status: "registered" });
    mocks.toast.mockReset();
  });

  it("fails closed for a city without a persisted Community and returns to its explorer", () => {
    renderInterestPage("/comunidade/ba/salvador/interesse");

    expect(screen.getByRole("heading", { name: "Escolha um bairro" })).toBeVisible();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("turnstile-widget")).not.toBeInTheDocument();
    expect(mocks.registerCommunityInterest).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Explorar bairros de Salvador" }),
    );
    expect(screen.getByTestId("current-path")).toHaveTextContent("/ba/salvador");
  });

  it("never exposes the form when a synthetic profile reaches the boundary", () => {
    mocks.profile = {
      ...persistedPitubaProfile,
      id: `community-city-${cityResolved.location.id}`,
      name: "Achegue-se Salvador",
      slug: "salvador",
      territory_type: "city",
      territory_id: cityResolved.location.id,
      status: "active",
    };

    renderInterestPage("/comunidade/ba/salvador/interesse");

    expect(screen.getByRole("heading", { name: "Escolha um bairro" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cadastrar interesse" })).not.toBeInTheDocument();
    expect(mocks.registerCommunityInterest).not.toHaveBeenCalled();
  });

  it("fails closed when the persisted profile disagrees with the resolved territory", () => {
    mocks.resolveResult = {
      status: "resolved_location",
      resolved: pitubaResolved,
      error: null,
    };
    mocks.profile = { ...persistedPitubaProfile, slug: "barra" };

    renderInterestPage("/comunidade/ba/salvador/pituba/interesse");

    expect(screen.getByRole("heading", { name: "Escolha um bairro" })).toBeVisible();
    expect(mocks.registerCommunityInterest).not.toHaveBeenCalled();
  });

  it("preserves the authorized coming-soon neighborhood payload with its real UUID", async () => {
    mocks.resolveResult = {
      status: "resolved_location",
      resolved: pitubaResolved,
      error: null,
    };
    mocks.profile = persistedPitubaProfile;

    renderInterestPage("/comunidade/ba/salvador/pituba/interesse");

    fireEvent.change(screen.getByLabelText("Nome completo *"), {
      target: { value: "Pessoa de Teste" },
    });
    fireEvent.change(screen.getByLabelText("E-mail *"), {
      target: { value: "pessoa@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar interesse" }));

    await waitFor(() => {
      expect(mocks.registerCommunityInterest).toHaveBeenCalledWith(
        expect.objectContaining({
          communityId: persistedPitubaProfile.id,
          communitySlug: "pituba",
          territoryPath: "/ba/salvador/pituba",
          honeypot: "",
          turnstileToken: null,
        }),
      );
    });
  });
});
