import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { AuthService } from "@/core/auth/services/AuthService";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { useCadastroForm } from "./useCadastro";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  setEmail: vi.fn(),
  setRedirect: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: { signUp: vi.fn() },
}));

vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: vi.fn(),
}));

vi.mock("@/core/auth/utils/pendingSignup", () => ({
  setPendingSignupEmail: mocks.setEmail,
  setPendingSignupRedirect: mocks.setRedirect,
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

function fillAccount(
  result: ReturnType<typeof renderHook<ReturnType<typeof useCadastroForm>, unknown>>["result"],
) {
  act(() => {
    result.current.form.setValue("name", "Ana Souza");
    result.current.form.setValue("username", "ana_souza");
    result.current.form.setValue("email", "ana@example.com");
    result.current.form.setValue("password", "SenhaSegura@2026");
  });
}

describe("useCadastroForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
    vi.mocked(AuthService.signUp).mockResolvedValue(undefined);
  });

  it("não cria a conta sem aceite dos Termos", async () => {
    const { result } = renderHook(() => useCadastroForm());
    fillAccount(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(AuthService.signUp).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.termsAccepted).toBeDefined();
  });

  it("cria somente a conta/perfil pessoal inicial e preserva o destino seguro", async () => {
    const { result } = renderHook(() => useCadastroForm("/mensagens/abc"));
    fillAccount(result);
    act(() => {
      result.current.form.setValue("termsAccepted", true, {
        shouldValidate: true,
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(AuthService.signUp).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "SenhaSegura@2026",
      name: "Ana Souza",
      handle: "ana_souza",
      termsAcceptance: {
        accepted: true,
        version: TERMS_OF_SERVICE_VERSION,
      },
    });
    expect(mocks.setEmail).toHaveBeenCalledWith("ana@example.com");
    expect(mocks.setRedirect).toHaveBeenCalledWith("/mensagens/abc");
    expect(mocks.navigate).toHaveBeenCalledWith("/cadastro/confirmacao", {
      state: { email: "ana@example.com", redirectTo: "/mensagens/abc" },
    });
  });
});
