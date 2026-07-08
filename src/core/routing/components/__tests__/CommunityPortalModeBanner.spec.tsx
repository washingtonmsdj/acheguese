import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CommunityPortalModeBanner } from "../CommunityPortalModeBanner";

describe("CommunityPortalModeBanner", () => {
  it("identifies community mode and links back to the public territory", () => {
    render(
      <MemoryRouter>
        <CommunityPortalModeBanner
          territoryName="Santa Cruz"
          publicHref="/ba/salvador/santa-cruz"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Portal comunitario de Santa Cruz")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver no site publico" })).toHaveAttribute(
      "href",
      "/ba/salvador/santa-cruz",
    );
  });
});
