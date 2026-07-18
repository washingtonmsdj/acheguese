import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CommunityOverviewSurface } from "./CommunityOverviewSurface";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@/core/community/hooks/feed/useCommunityFeed", () => ({
  useCommunityFeedSimple: () => ({
    posts: [],
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: vi.fn(),
  }),
}));

vi.mock("@/core/business/promotions", () => ({
  useAdDelivery: () => ({ campaign: null, isLoading: false }),
  SponsoredAdCard: () => null,
}));

vi.mock("@/core/business/hooks/useBusinessUrls", () => ({
  useBusinessUrls: () => ({ canonical: () => "/empresas/pituba/exemplo" }),
}));

vi.mock("@/core/routing/hooks/useFriendlyModuleUrls", () => ({
  useFriendlyModuleUrls: () => ({
    business: "/empresas",
    classifieds: "/classificados",
    gastronomy: "/gastronomia",
    services: "/servicos",
    events: "/eventos",
    map: "/mapa",
  }),
}));

vi.mock("@/core/routing/hooks/useCommunityUrls", () => ({
  useCommunityUrls: () => ({
    feed: "/comunidade/ba/salvador/pituba",
    groups: "/comunidade/ba/salvador/pituba/grupos",
    groupDetail: (id: string) => `/comunidade/ba/salvador/pituba/grupos/${id}`,
  }),
}));

vi.mock("@/core/session", () => ({
  useSessionContext: () => ({ activeProfile: null }),
}));

describe("CommunityOverviewSurface navigation", () => {
  it("keeps the primary mobile controls aligned with one typography contract", () => {
    const { container } = render(
      <MemoryRouter>
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
        />
      </MemoryRouter>,
    );

    const mobileNavigation = container.querySelector(
      '[data-community-mobile-primary-nav="true"]',
    );
    expect(mobileNavigation).not.toBeNull();

    for (const key of ["feed", "business", "services"]) {
      const item = mobileNavigation?.querySelector(
        `[data-community-nav-item="${key}"]`,
      );
      expect(item).not.toBeNull();
      expect(item?.className).toContain("flex-col");
      expect(item?.className).toContain("overflow-hidden");
      expect(item?.className).toContain("text-[0.625rem]");
      expect(item?.className).toContain("min-[360px]:text-[0.6875rem]");
      expect(item?.className).toContain("font-semibold");
      expect(item?.querySelector("svg")?.classList.contains("shrink-0")).toBe(
        true,
      );
      expect(item?.querySelector("span")?.className).toContain(
        "whitespace-nowrap",
      );
      expect(item?.querySelector("span")?.className).not.toContain("truncate");
    }
  });

  it("keeps posts, groups and discussions as separate in-place feed contexts", () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
          onViewChange={onViewChange}
        />
      </MemoryRouter>,
    );

    const primaryContent = container.querySelector(
      "#community-primary-content",
    );
    expect(primaryContent).not.toBeNull();
    const primary = within(primaryContent as HTMLElement);

    expect(
      primary.getByRole("textbox", { name: /criar publicação em pituba/i }),
    ).toBeVisible();

    expect(primary.getByRole("button", { name: "Posts" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      primary.getByRole("group", { name: "Ordenação dos posts" }),
    ).toBeVisible();
    expect(
      within(
        primary.getByRole("group", { name: "Ordenação dos posts" }),
      ).getByRole("button", { name: "Melhores" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      container.querySelector('[data-community-feed-discovery="true"]'),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Grupos da comunidade" }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Discussões em alta" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sobre Pituba" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Álbuns da comunidade" }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Regras da comunidade" }),
    ).toBeNull();

    fireEvent.click(primary.getByRole("button", { name: "Grupos" }));
    expect(
      container.querySelector('[data-community-feed-context-panel="groups"]'),
    ).toBeVisible();
    expect(
      primary.getByRole("textbox", { name: /criar publicação em pituba/i }),
    ).toBeVisible();
    expect(
      within(
        container.querySelector(
          '[data-community-feed-context-panel="groups"]',
        ) as HTMLElement,
      ).getByRole("link", { name: "Ver todos" }),
    ).toHaveAttribute("href", "/comunidade/ba/salvador/pituba/grupos");
    expect(onViewChange).not.toHaveBeenCalled();

    fireEvent.click(primary.getByRole("button", { name: "Discussões" }));
    expect(
      container.querySelector(
        '[data-community-feed-context-panel="discussions"]',
      ),
    ).toBeVisible();
    expect(
      primary.getByRole("textbox", { name: /criar publicação em pituba/i }),
    ).toBeVisible();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("uses posts, groups and discussions as contextual feed tabs instead of route destinations", () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          "/comunidade/ba/salvador/pituba?visualMock=community-concept",
        ]}
      >
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
          onViewChange={onViewChange}
        />
      </MemoryRouter>,
    );

    const primaryContent = container.querySelector(
      "#community-primary-content",
    );
    expect(primaryContent).not.toBeNull();
    const primary = within(primaryContent as HTMLElement);

    expect(primary.getByRole("button", { name: "Posts" })).toHaveAttribute(
      "aria-controls",
      "community-feed-context-panel",
    );
    expect(primary.queryByRole("button", { name: "Para você" })).toBeNull();
    expect(primary.queryByRole("button", { name: "Perguntas" })).toBeNull();
    expect(primary.getByRole("button", { name: "Grupos" })).toHaveAttribute(
      "aria-controls",
      "community-feed-context-panel",
    );
    expect(primary.getByRole("button", { name: "Discussões" })).toHaveAttribute(
      "aria-controls",
      "community-feed-context-panel",
    );

    fireEvent.click(primary.getByRole("button", { name: "Grupos" }));
    expect(primary.getByRole("button", { name: "Grupos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      container.querySelector('[data-community-feed-context-panel="groups"]'),
    ).toBeVisible();
    expect(onViewChange).not.toHaveBeenCalled();

    fireEvent.click(primary.getByRole("button", { name: "Discussões" }));
    expect(primary.getByRole("button", { name: "Discussões" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      container.querySelector(
        '[data-community-feed-context-panel="discussions"]',
      ),
    ).toBeVisible();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("exposes every enabled community section and keeps paused lost-and-found hidden", () => {
    render(
      <MemoryRouter>
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
        />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Navegacao da comunidade",
    });
    expect(
      within(navigation).getByRole("link", { name: "Mapa" }),
    ).toHaveAttribute("href", "/mapa");
    expect(
      within(navigation).getByRole("link", { name: "Eventos" }),
    ).toHaveAttribute("href", "#eventos");
    expect(screen.queryByText("Achados")).toBeNull();
  });

  it("focuses the events panel after leaving an embedded community module", () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();

    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });

    const surface = (embedded: boolean) => (
      <MemoryRouter
        initialEntries={["/comunidade/ba/salvador/pituba#eventos"]}
      >
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
          activeSection={embedded ? "business" : undefined}
        >
          {embedded ? <div>Empresas da comunidade</div> : undefined}
        </CommunityOverviewSurface>
      </MemoryRouter>
    );

    try {
      const { rerender } = render(surface(true));
      expect(document.getElementById("eventos")).toBeNull();

      rerender(surface(false));

      const eventsPanel = document.getElementById("eventos");
      expect(eventsPanel).not.toBeNull();
      expect(eventsPanel).toHaveFocus();
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    } finally {
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        writable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, "cancelAnimationFrame", {
        configurable: true,
        writable: true,
        value: originalCancelAnimationFrame,
      });
      Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        writable: true,
        value: originalScrollIntoView,
      });
    }
  });

  it("closes the mobile sections menu after navigating to a module", () => {
    render(
      <MemoryRouter
        initialEntries={["/comunidade/ba/salvador/pituba/empresas"]}
      >
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
          activeSection="business"
        >
          <div>Empresas da comunidade</div>
        </CommunityOverviewSurface>
      </MemoryRouter>,
    );

    const sectionsTrigger = document.querySelector(
      '[data-community-sections-trigger="true"]',
    );
    expect(sectionsTrigger).not.toBeNull();
    fireEvent.click(sectionsTrigger as HTMLElement);
    const sectionsMenu = document.querySelector(
      '[data-community-sections-menu="true"]',
    );
    expect(sectionsMenu).not.toBeNull();
    expect(sectionsMenu).toBeVisible();

    const classifiedsLink = sectionsMenu?.querySelector(
      '[data-community-nav-item="classifieds"]',
    );
    expect(classifiedsLink).not.toBeNull();
    fireEvent.click(classifiedsLink as HTMLElement);
    expect(
      document.querySelector('[data-community-sections-menu="true"]'),
    ).toBeNull();
  });

  it("shows a limited business preview before the complete module", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/comunidade/ba/salvador/pituba?view=business&visualMock=community-concept",
        ]}
      >
        <CommunityOverviewSurface
          territoryName="Pituba"
          territoryFilter={{
            scope: "location",
            location_id: "location-pituba",
          }}
          onRequireLogin={vi.fn()}
          loginHref="/login"
          publishHref="/login"
          activeView="business"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Empresas da comunidade" }),
    ).toBeVisible();
    expect(screen.getAllByText("Negócio local")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: /ver todas as empresas/i }),
    ).toHaveAttribute("href", "/empresas");
    expect(screen.queryByRole("button", { name: /^grupos$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^discussões$/i })).toBeNull();
  });
});
