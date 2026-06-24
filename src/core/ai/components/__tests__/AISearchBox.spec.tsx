import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AISearchBox } from "../AISearchBox";

describe("AISearchBox", () => {
  it("hydrates the input from initialQuery and submits the same query", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<AISearchBox initialQuery="pizzaria" onSearch={onSearch} />);

    const input = screen.getByLabelText("Busca inteligente");
    expect(input).toHaveValue("pizzaria");

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSearch).toHaveBeenCalledWith("pizzaria");
  });
});
