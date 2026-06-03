import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "@/app/components/Breadcrumbs";

describe("Breadcrumbs", () => {
  it("usa a rota publica do modulo empresas no breadcrumb", () => {
    render(
      <MemoryRouter initialEntries={["/empresas"]}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText("Empresas")).toBeInTheDocument();
  });
});
