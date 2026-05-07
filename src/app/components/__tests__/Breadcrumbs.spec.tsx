import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "@/app/components/Breadcrumbs";

describe("Breadcrumbs", () => {
  it("usa a rota canonica de empresas no breadcrumb", () => {
    render(
      <MemoryRouter initialEntries={["/empresas"]}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText("Empresas")).toBeInTheDocument();
    expect(screen.queryByText("Businesss")).not.toBeInTheDocument();
  });

  it("nao trata o typo historico businesss como rota canonica", () => {
    render(
      <MemoryRouter initialEntries={["/businesss"]}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Empresas")).not.toBeInTheDocument();
    expect(screen.getByText("Businesss")).toBeInTheDocument();
  });
});
