import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthBrandHeader } from "./AuthBrandHeader";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
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

describe("AuthBrandHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa a ação secundária como retorno seguro quando a tela foi aberta diretamente", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/login", key: "default" },
        ]}
      >
        <AuthBrandHeader
          secondaryHref="/cadastro"
          secondaryLabel="Criar conta"
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/cadastro");
  });

  it("preserva o voltar real quando existe histórico interno da jornada", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/login", key: "auth-history" },
        ]}
      >
        <AuthBrandHeader
          secondaryHref="/cadastro"
          secondaryLabel="Criar conta"
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });
});
