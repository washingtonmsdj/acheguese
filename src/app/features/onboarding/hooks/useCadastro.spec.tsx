import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { AuthService } from "@/core/auth/services/AuthService";
import {
  prepareAuthenticatedEmailSignup,
  prepareEmailSignupConfirmation,
} from "@/core/auth/utils/authJourney";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { PublicIdentityService } from "@/core/public-identity/services/PublicIdentityService";
import { useCadastroForm } from "./useCadastro";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  prepareAuthenticatedEmailSignup: vi.fn(),
  prepareEmailSignupConfirmation: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/core/auth/services/AuthService", () => ({
  AuthService: { signUp: vi.fn() },
}));

vi.mock("@/core/auth/utils/authJourney", () => ({
  prepareAuthenticatedEmailSignup: mocks.prepareAuthenticatedEmailSignup,
  prepareEmailSignupConfirmation: mocks.prepareEmailSignupConfirmation,
}));

vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: vi.fn(),
}));

vi.mock("@/core/public-identity/services/PublicIdentityService", () => ({
  PublicIdentityService: { checkAvailability: vi.fn() },
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

function acceptTerms(
  result: ReturnType<typeof renderHook<ReturnType<typeof useCadastroForm>, unknown>>["result"],
) {
  act(() => {
    result.current.form.setValue("termsAccepted", true, {
      shouldValidate: true,
    });
  });
}

describe("useCadastroForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PublicIdentityService.checkAvailability).mockResolvedValue({
      status: "available",
      identifier: "ana_souza",
    });
    vi.mocked(checkPasswordCompromise).mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
    vi.mocked(AuthService.signUp).mockResolvedValue({
      requiresEmailConfirmation: true,
    });
  });

  it("não cria a conta sem aceite dos Termos", async () => {
    const { result } = renderHook(() => useCadastroForm());
    fillAccount(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(AuthService.signUp).not.toHaveBeenCalled();
    expect(prepareEmailSignupConfirmation).not.toHaveBeenCalled();
    expect(prepareAuthenticatedEmailSignup).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.termsAccepted).toBeDefined();
  });

  it("serializa submits concorrentes antes de consumir o mesmo desafio Auth", async () => {
    let resolveSignup!: (value: { requiresEmailConfirmation: boolean }) => void;
    vi.mocked(AuthService.signUp).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignup = resolve;
        }),
    );
    const onCaptchaConsumed = vi.fn();
    const { result } = renderHook(() => useCadastroForm("/mensagens/abc"));
    fillAccount(result);
    acceptTerms(result);

    const firstSubmit = result.current.submit("captcha-once", onCaptchaConsumed);
    const secondSubmit = result.current.submit("captcha-once", onCaptchaConsumed);

    await waitFor(() => {
      expect(AuthService.signUp).toHaveBeenCalledTimes(1);
    });

    expect(PublicIdentityService.checkAvailability).toHaveBeenCalledTimes(1);
    expect(checkPasswordCompromise).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSignup({ requiresEmailConfirmation: true });
      await Promise.all([firstSubmit, secondSubmit]);
    });

    expect(AuthService.signUp).toHaveBeenCalledTimes(1);
    expect(onCaptchaConsumed).toHaveBeenCalledTimes(1);
    expect(prepareEmailSignupConfirmation).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
  });

  it("envia para confirmação somente quando o Auth informa que ela é necessária", async () => {
    const { result } = renderHook(() => useCadastroForm("/mensagens/abc"));
    fillAccount(result);
    acceptTerms(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(PublicIdentityService.checkAvailability).toHaveBeenCalledWith({
      identifier: "ana_souza",
      entityType: "profile",
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
    expect(prepareEmailSignupConfirmation).toHaveBeenCalledWith(
      "ana@example.com",
      "/mensagens/abc",
    );
    expect(prepareAuthenticatedEmailSignup).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith(AUTH_PATHS.signupConfirmation, {
      state: { email: "ana@example.com", redirectTo: "/mensagens/abc" },
    });
  });

  it("segue direto ao primeiro acesso quando o signup já devolve uma sessão", async () => {
    vi.mocked(AuthService.signUp).mockResolvedValueOnce({
      requiresEmailConfirmation: false,
    });
    const { result } = renderHook(() => useCadastroForm("/mensagens/abc"));
    fillAccount(result);
    acceptTerms(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(prepareEmailSignupConfirmation).not.toHaveBeenCalled();
    expect(prepareAuthenticatedEmailSignup).toHaveBeenCalledWith(
      "/mensagens/abc",
    );
    expect(mocks.navigate).toHaveBeenCalledWith(AUTH_PATHS.firstAccess, {
      replace: true,
    });
  });
});
