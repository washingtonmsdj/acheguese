import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { AuthService } from "@/core/auth/services/AuthService";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { useCadastro } from "./useCadastro";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: {
    signUp: vi.fn(),
  },
}));

vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: vi.fn(),
}));

vi.mock("@/core/auth/utils/passwordPolicy", () => ({
  validateAuthPassword: vi.fn(() => null),
}));

vi.mock("@/core/auth/utils/pendingSignup", () => ({
  setPendingSignupEmail: vi.fn(),
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

describe("useCadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
    vi.mocked(AuthService.signUp).mockResolvedValue(undefined);
  });

  function fillRequiredFields(
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useCadastro>, unknown>
    >["result"],
  ) {
    act(() => {
      result.current.updateField("name", "Ana Souza");
      result.current.updateField("username", "ana_souza");
      result.current.updateField("email", "ana@example.com");
      result.current.updateField("password", "SenhaSegura@2026");
      result.current.updateField("confirmPassword", "SenhaSegura@2026");
      result.current.selectState("state-ba", "Bahia");
      result.current.selectCity("city-salvador", "Salvador");
      result.current.selectNeighborhood("district-pituba", "Pituba");
    });
  }

  it("requires the explicit Terms acceptance on the confirmation step", () => {
    const { result } = renderHook(() => useCadastro());

    let valid = true;
    act(() => {
      valid = result.current.validateStep(2);
    });

    expect(valid).toBe(false);
    expect(result.current.errors.termsAccepted).toContain("aceitar");

    act(() => {
      result.current.setTermsAccepted(true);
    });

    act(() => {
      valid = result.current.validateStep(2);
    });

    expect(valid).toBe(true);
  });

  it("sends the current versioned acceptance to the auth boundary", async () => {
    const { result } = renderHook(() => useCadastro());
    fillRequiredFields(result);

    act(() => {
      result.current.setTermsAccepted(true);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(AuthService.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      }),
    );
  });
});
