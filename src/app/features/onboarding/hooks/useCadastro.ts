import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
import { setPendingSignupEmail } from "@/core/auth/utils/pendingSignup";
import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";
import { useToast } from "@/shared/hooks/use-toast";
import {
  RegisterAccountStepSchema,
  RegisterConfirmationStepSchema,
  RegisterLocationStepSchema,
} from "@/shared/validation/schemas/user.schema";

export interface CadastroFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  street: string;
  termsAccepted: boolean;
}

const initialFormData: CadastroFormData = {
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
  termsAccepted: false,
};

export function useCadastro() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CadastroFormData>(initialFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CadastroFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);

  const updateField = useCallback(
    <K extends keyof CadastroFormData>(
      field: K,
      value: CadastroFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const setTermsAccepted = useCallback(
    (accepted: boolean) => {
      updateField("termsAccepted", accepted);
    },
    [updateField],
  );

  const selectState = useCallback((id: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      stateId: id,
      stateName: name,
      cityId: "",
      cityName: "",
      neighborhoodId: "",
      neighborhoodName: "",
    }));
    setErrors((prev) => ({
      ...prev,
      stateId: undefined,
      cityId: undefined,
      neighborhoodId: undefined,
    }));
  }, []);

  const selectCity = useCallback((id: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      cityId: id,
      cityName: name,
      neighborhoodId: "",
      neighborhoodName: "",
    }));
    setErrors((prev) => ({
      ...prev,
      cityId: undefined,
      neighborhoodId: undefined,
    }));
  }, []);

  const selectNeighborhood = useCallback((id: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      neighborhoodId: id,
      neighborhoodName: name,
    }));
    setErrors((prev) => ({ ...prev, neighborhoodId: undefined }));
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Partial<Record<keyof CadastroFormData, string>> = {};

      const applyZodResult = (
        result: { success: true } | { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } },
      ) => {
        if (result.success) return;
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && !(field in newErrors)) {
            (newErrors as Record<string, string>)[field] = issue.message;
          }
        }
      };

      if (step === 0) {
        applyZodResult(
          RegisterAccountStepSchema.safeParse({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        );
      }

      if (step === 1) {
        applyZodResult(
          RegisterLocationStepSchema.safeParse({
            stateId: formData.stateId,
            cityId: formData.cityId,
            neighborhoodId: formData.neighborhoodId,
          }),
        );
      }

      if (step === 2) {
        applyZodResult(
          RegisterConfirmationStepSchema.safeParse({
            termsAccepted: formData.termsAccepted,
          }),
        );
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  const handleNext = useCallback(
    (totalSteps: number) => {
      if (!validateStep(currentStep)) return;
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    },
    [currentStep, validateStep],
  );

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      toast({
        title: "Preencha todos os campos obrigatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const compromise = await checkPasswordCompromise(formData.password);
      if (compromise.blocked) {
        toast({
          title: "Senha comprometida",
          description: compromise.message,
          variant: "destructive",
        });
        return;
      }

      await AuthService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        display_name: formData.name,
        handle: formData.username,
        city: formData.cityName,
        neighborhood: formData.neighborhoodName,
        state: formData.stateName,
        street: formData.street.trim(),
        neighborhood_id: formData.neighborhoodId || undefined,
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      });
      setPendingSignupEmail(formData.email);
      navigate("/cadastro/confirmacao", { state: { email: formData.email } });
    } catch (error: unknown) {
      toast({
        title: "Erro ao criar conta",
        description: getAuthErrorMessage(error, "Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, validateStep, toast, navigate]);

  return {
    currentStep,
    formData,
    errors,
    loading,
    updateField,
    setTermsAccepted,
    selectState,
    selectCity,
    selectNeighborhood,
    validateStep,
    handleNext,
    handleBack,
    handleSubmit,
  };
}
