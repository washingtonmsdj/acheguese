/**
 * useCadastroForm — SSOT do wizard de cadastro (react-hook-form + Zod).
 *
 * Substitui a antiga versão baseada em `useState` manual. Todo o estado do
 * formulário passa a viver dentro do `useForm`, e a validação por step usa
 * `form.trigger([...campos])` contra o `RegisterFullSchema`.
 *
 * O nome `useCadastro` é mantido como alias para compatibilidade com o
 * barrel `@/app/features/onboarding` e testes existentes.
 */

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { setPendingSignupEmail } from "@/core/auth/utils/pendingSignup";
import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { useToast } from "@/shared/hooks/use-toast";
import {
  RegisterFullSchema,
  type RegisterFullInput,
} from "@/shared/validation/schemas/user.schema";

export type CadastroFormValues = RegisterFullInput;

const defaultValues: CadastroFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  stateId: "",
  stateName: "",
  cityId: "",
  cityName: "",
  neighborhoodId: "",
  neighborhoodName: "",
  street: "",
  // literal(true) — o RHF só permite avançar quando marcado
  termsAccepted: false as unknown as true,
};

const STEP_FIELDS: Record<number, FieldPath<CadastroFormValues>[]> = {
  0: ["name", "username", "email", "password", "confirmPassword"],
  1: ["stateId", "cityId", "neighborhoodId"],
  2: ["termsAccepted"],
};

export function useCadastroForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CadastroFormValues>({
    resolver: zodResolver(RegisterFullSchema),
    mode: "onBlur",
    defaultValues,
    shouldFocusError: true,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const validateStep = useCallback(
    async (step: number) => form.trigger(STEP_FIELDS[step] ?? []),
    [form],
  );

  const handleNext = useCallback(
    async (totalSteps: number) => {
      if (loading) return;
      const ok = await validateStep(currentStep);
      if (!ok) return;
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    },
    [currentStep, validateStep, loading],
  );

  const handleBack = useCallback(() => {
    if (loading) return;
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, [loading]);

  const selectState = useCallback(
    (id: string, name: string) => {
      form.setValue("stateId", id, { shouldValidate: true, shouldDirty: true });
      form.setValue("stateName", name);
      form.setValue("cityId", "", { shouldValidate: false });
      form.setValue("cityName", "");
      form.setValue("neighborhoodId", "", { shouldValidate: false });
      form.setValue("neighborhoodName", "");
    },
    [form],
  );

  const selectCity = useCallback(
    (id: string, name: string) => {
      form.setValue("cityId", id, { shouldValidate: true, shouldDirty: true });
      form.setValue("cityName", name);
      form.setValue("neighborhoodId", "", { shouldValidate: false });
      form.setValue("neighborhoodName", "");
    },
    [form],
  );

  const selectNeighborhood = useCallback(
    (id: string, name: string) => {
      form.setValue("neighborhoodId", id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      form.setValue("neighborhoodName", name);
    },
    [form],
  );

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const compromise = await checkPasswordCompromise(values.password);
      if (compromise.blocked) {
        form.setError("password", {
          type: "compromised",
          message: compromise.message,
        });
        toast({
          title: "Senha comprometida",
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
        city: values.cityName,
        neighborhood: values.neighborhoodName,
        state: values.stateName,
        street: values.street.trim(),
        neighborhood_id: values.neighborhoodId || undefined,
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      });

      setPendingSignupEmail(values.email);
      navigate("/cadastro/confirmacao", {
        state: { email: values.email },
      });
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error, "Tente novamente.");
      const raw =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

      // Mapeia erros de backend para o campo do shadcn correspondente e
      // sempre exibe um banner amigável (root.serverError) — o usuário pode
      // estar em qualquer step quando o submit final falha.
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
        title: "Erro ao criar conta",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  });

  return {
    form,
    currentStep,
    loading,
    validateStep,
    handleNext,
    handleBack,
    selectState,
    selectCity,
    selectNeighborhood,
    submit,
  };
}

/** Alias legado — mantido para compat com barrel/tests. */
export const useCadastro = useCadastroForm;
