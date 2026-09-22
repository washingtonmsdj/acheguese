import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { AuthService } from "@/core/auth/services/AuthService";
import {
  prepareAuthenticatedEmailSignup,
  prepareEmailSignupConfirmation,
} from "@/core/auth/utils/authJourney";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { PublicIdentityService } from "@/core/public-identity";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";
import {
  RegisterInitialSchema,
  type RegisterInitialInput,
} from "@/app/features/onboarding/validation/registerInitial.schema";

export type CadastroFormValues = RegisterInitialInput;

type CadastroServerErrorField = "email" | "username" | "password";

const defaultValues: CadastroFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  termsAccepted: false,
};

function getUsernameAvailabilityMessage(
  status: string,
  message?: string,
): string {
  if (message) return message;
  switch (status) {
    case "taken":
      return "Este nome de usuário já está em uso.";
    case "reserved":
      return "Este nome de usuário é reservado.";
    case "invalid":
      return "Escolha outro nome de usuário.";
    default:
      return "Este nome de usuário não está disponível.";
  }
}

function resolveCadastroServerErrorField(raw: string): CadastroServerErrorField | null {
  if (/already registered|already exists|já cadastrado/i.test(raw)) {
    return "email";
  }
  if (/username|handle|nome de usu[aá]rio/i.test(raw)) {
    return "username";
  }
  if (/password|senha/i.test(raw)) {
    return "password";
  }
  if (/email|e-?mail/i.test(raw)) {
    return "email";
  }
  return null;
}

/**
 * SSOT do cadastro inicial.
 *
 * A conta nasce com o perfil pessoal. Cidade/bairro não pertencem a esta
 * fronteira: são melhoria opcional do primeiro acesso/ProfileService.
 */
export function useCadastroForm(requestedRedirect = "/") {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const submitInFlightRef = useRef(false);

  const form = useForm<CadastroFormValues>({
    resolver: zodResolver(RegisterInitialSchema),
    mode: "onBlur",
    defaultValues,
    shouldFocusError: true,
  });

  const redirectTo = resolveSafeInternalPath(requestedRedirect, "/");

  const submit = (captchaToken?: string, onCaptchaConsumed?: () => void) =>
    form.handleSubmit(async (values) => {
      // React state disables the UI after render, but it is not a synchronous
      // mutex. Guard the command itself so two submits in the same tick cannot
      // run availability/password checks and create two Auth requests.
      if (submitInFlightRef.current) return;
      submitInFlightRef.current = true;
      setLoading(true);
      form.clearErrors("root.serverError");

      try {
        // A checagem visual melhora a UX; esta checagem autoritativa no submit
        // protege qualquer consumidor futuro deste hook.
        const availability = await PublicIdentityService.checkAvailability({
          identifier: values.username,
          entityType: "profile",
        });
        if (availability.status !== "available") {
          const message = getUsernameAvailabilityMessage(
            availability.status,
            availability.message,
          );
          form.setError("username", { type: "availability", message });
          toast({
            title: "Escolha outro nome de usuário",
            description: availability.suggestion
              ? `${message} Sugestão: @${availability.suggestion}`
              : message,
            variant: "destructive",
          });
          return;
        }

        const compromise = await checkPasswordCompromise(values.password);
        if (compromise.blocked) {
          form.setError("password", {
            type: "compromised",
            message: compromise.message,
          });
          toast({
            title: "Escolha outra senha",
            description: compromise.message,
            variant: "destructive",
          });
          return;
        }

        const signupResult = await (async () => {
          try {
            return await AuthService.signUp({
              email: values.email,
              password: values.password,
              name: values.name,
              handle: values.username,
              termsAcceptance: {
                // Reaching handleSubmit means RegisterInitialSchema already
                // proved the required checkbox. Preserve the stricter domain
                // contract (`accepted: true`) instead of widening it to boolean.
                accepted: true,
                version: TERMS_OF_SERVICE_VERSION,
              },
              captchaToken,
            });
          } finally {
            // Turnstile tokens are single-use. Reset only after the Auth request
            // actually consumed the token; local validation errors keep it valid.
            onCaptchaConsumed?.();
          }
        })();

        if (signupResult.requiresEmailConfirmation) {
          prepareEmailSignupConfirmation(values.email, redirectTo);
          navigate(AUTH_PATHS.signupConfirmation, {
            state: { email: values.email, redirectTo },
          });
          return;
        }

        prepareAuthenticatedEmailSignup(redirectTo);
        navigate(AUTH_PATHS.firstAccess, { replace: true });
      } catch (error: unknown) {
        const message = getAuthErrorMessage(error, "Tente novamente.");
        const raw =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: unknown }).message ?? "")
            : "";
        const field = resolveCadastroServerErrorField(raw);

        // Uma falha deve ter um único owner visual. Erros que pertencem a um
        // campo ficam junto ao campo; a faixa geral é reservada a falhas sem
        // destino específico. Isso evita repetir a mesma mensagem no formulário.
        if (field) {
          form.setError(field, { type: "server", message });
        } else {
          form.setError("root.serverError", { type: "server", message });
          toast({
            title: "Não foi possível criar a conta",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        submitInFlightRef.current = false;
        setLoading(false);
      }
    })();

  return { form, loading, submit };
}

export const useCadastro = useCadastroForm;