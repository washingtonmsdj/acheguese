import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ItemForm } from "./ItemForm";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock("@/core/session", () => ({
  useSessionContext: () => ({
    user: { id: "user-1" },
  }),
}));

describe("ItemForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  it("fecha o dialogo apos submit bem-sucedido", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(true);

    render(
      <ItemForm
        open
        onClose={onClose}
        onSubmit={onSubmit}
        categories={[]}
        allowCategorySelection={false}
        allowImage={false}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Refrigerante E2E");
    await user.clear(screen.getByLabelText(/Pre[cç]o \(R\$\)/i));
    await user.type(screen.getByLabelText(/Pre[cç]o \(R\$\)/i), "12.5");
    await user.click(screen.getByRole("button", { name: /^Criar$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("mantem o dialogo aberto quando o submit retorna false", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(false);

    render(
      <ItemForm
        open
        onClose={onClose}
        onSubmit={onSubmit}
        categories={[]}
        allowCategorySelection={false}
        allowImage={false}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Refrigerante E2E");
    await user.clear(screen.getByLabelText(/Pre[cç]o \(R\$\)/i));
    await user.type(screen.getByLabelText(/Pre[cç]o \(R\$\)/i), "12.5");
    await user.click(screen.getByRole("button", { name: /^Criar$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
