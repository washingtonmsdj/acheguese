import { useState } from "react";
import { createBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { toast } from "sonner";

// Extrair o schema para uso local
export const businessSchema = createBusinessSchema;

export interface BusinessFormState {
  // Etapa 1
  name: string;
  description: string;
  category: string;

  // Etapa 2
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  schedules: string;
  selectedModos: string[];

  // Etapa 3
  website: string;
  instagram: string;
  facebook: string;
  selectedPagamentos: string[];
  especialidades: string;
  facilidades: string;
}

export function useBusinessFormSteps() {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BusinessFormState>({
    name: "",
    description: "",
    category: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    schedules: "",
    selectedModos: ["presencial"],
    website: "",
    instagram: "",
    facebook: "",
    selectedPagamentos: [],
    especialidades: "",
    facilidades: "",
  });

  const hasErrorForField = (field: keyof BusinessFormState): boolean =>
    Object.entries(errors).some(([key]) => key === field);

  const removeErrorForField = (
    currentErrors: Record<string, string>,
    field: keyof BusinessFormState,
  ): Record<string, string> =>
    Object.fromEntries(
      Object.entries(currentErrors).filter(([key]) => key !== field),
    );

  const updateField = <K extends keyof BusinessFormState>(
    field: K,
    value: BusinessFormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (hasErrorForField(field)) {
      setErrors((prev) => removeErrorForField(prev, field));
    }
  };

  const validateStep1 = (): boolean => {
    const validation = businessSchema
      .pick({ name: true, description: true, category: true })
      .safeParse({
        name: formData.name,
        description: formData.description,
        category: formData.category,
      });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const validateAllFields = (): boolean => {
    const validation = businessSchema.safeParse({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      email: formData.email,
      address: formData.address,
      schedules: formData.schedules,
      website: formData.website,
      instagram: formData.instagram,
      facebook: formData.facebook,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      toast.error("Verifique os campos obrigatórios");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const skipStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  return {
    currentStep,
    formData,
    errors,
    updateField,
    validateAllFields,
    nextStep,
    previousStep,
    skipStep,
  };
}
