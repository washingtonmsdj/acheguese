import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import {
  setPendingSignupEmail,
  setPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";
import {
  RegisterInitialSchema,
  type RegisterInitialInput,
} from "@/app/features/onboarding/validation/registerInitial.schema";

export type CadastroFormValues = RegisterInitialInput;

const defaultValues: CadastroFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  termsAccepted: false as unknown as true,
};

/**
 * SSOT do cadastro inicial.
 *
 * A conta nasce com o perfil pessoal. Cidade/bairro deixam de bloquear a criação
 * da conta e passam a ser uma melhoria opcional de primeiro acesso.
 */
export function useCadastroForm(requestedRedirect = "/") {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CadastroFormValues>({
    resolver: zodResolver(RegisterInitialSchema),
    mode: "onBlur",
    defaultValues,
    shouldFocusError: true,
  });

  const redirectTo = resolveSafeInternalPath(requestedRedirect, "/");

  const submit = form.handleSubmit(async (values) => {
    if (loading) return;
    setLoading(true);
    form.clearErrors("root.serverError");

    try {
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

      await AuthService.signUp({
        email: values.email,
        password: values.password,
        name: values.name,
        display_name: values.name,
        handle: values.username,
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      });

      setPendingSignupEmail(values.email);
      setPendingSignupRedirect(redirectTo);
      navigate("/cadastro/confirmacao", {
        state: { email: values.email, redirectTo },
      });
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error, "Tente novamente.");
      const raw =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

      if (/already registered|already exists|já cadastrado/i.test(raw)) {
        form.setError("email", { type: "server", message });
      } else if (/username|handle|nome de usu[aá]rio/i.test(raw)) {
        form.setError("username", { type: "server", message });
      } else if (/password|senha/i.test(raw)) {
        form.setError("password", { type: "server", message });
      } else if (/email|e-?mail/i.test(raw)) {
        form.setError("email", { type: "server", message });
      }

      form.setError("root.serverError", { type: "server", message });
      toast({
        title: "Não foi possível criar a conta",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  });

  return { form, loading, submit };
}

export const useCadastro = useCadastroForm;
