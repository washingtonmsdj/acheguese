import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("alterna entre mostrar e ocultar a senha", () => {
    render(<PasswordInput defaultValue="secret123" />);
    const input = screen.getByDisplayValue("secret123") as HTMLInputElement;
    expect(input.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(input.type).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: /ocultar senha/i }));
    expect(input.type).toBe("password");
  });

  it("nao renderiza medidor de forca quando showStrength=false", () => {
    render(<PasswordInput defaultValue="abc" />);
    // checklist de requisitos so aparece com showStrength ligado
    expect(screen.queryByText(/caracteres/i)).not.toBeInTheDocument();
  });

  it("mostra checklist de requisitos quando showStrength e strengthValue estao definidos", () => {
    render(<PasswordInput showStrength strengthValue="SenhaForte@2026" />);
    // pelo menos um item da checklist deve estar visivel
    const listItems = document.querySelectorAll("ul li");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("aplica classe de invalid quando invalid=true", () => {
    render(<PasswordInput invalid defaultValue="x" />);
    const input = screen.getByDisplayValue("x");
    expect(input.className).toMatch(/border-destructive/);
  });
});
