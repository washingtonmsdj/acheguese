import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { AuthService } from "@/core/auth/services/AuthService";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { useCadastroForm } from "./useCadastro";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
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
  setPendingSignupEmail: vi.fn(),
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

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

  function fillAllFields(
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useCadastroForm>, unknown>
    >["result"],
  ) {
    const { form, selectState, selectCity, selectNeighborhood } = result.current;
    act(() => {
      form.setValue("name", "Ana Souza");
      form.setValue("username", "ana_souza");
      form.setValue("email", "ana@example.com");
      form.setValue("password", "SenhaSegura@2026");
      form.setValue("confirmPassword", "SenhaSegura@2026");
      selectState("state-ba", "Bahia");
      selectCity("city-salvador", "Salvador");
      selectNeighborhood("district-pituba", "Pituba");
    });
  }

  it("bloqueia avanço do step de confirmação sem aceite dos Termos", async () => {
    const { result } = renderHook(() => useCadastroForm());

    let valid = true;
    await act(async () => {
      valid = await result.current.validateStep(2);
    });
    expect(valid).toBe(false);

    act(() => {
      result.current.form.setValue("termsAccepted", true as never, {
        shouldValidate: true,
      });
    });

    await act(async () => {
      valid = await result.current.validateStep(2);
    });
    expect(valid).toBe(true);
  });

  it("envia o aceite versionado dos Termos para o AuthService", async () => {
    const { result } = renderHook(() => useCadastroForm());
    fillAllFields(result);
    act(() => {
      result.current.form.setValue("termsAccepted", true as never, {
        shouldValidate: true,
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(AuthService.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ana@example.com",
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      }),
    );
  });
});
