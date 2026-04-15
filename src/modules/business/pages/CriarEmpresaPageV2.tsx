/**
 * CRIAR EMPRESA PAGE V2 - fluxo alinhado ao SSOT de business
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { createBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { PublicIdentityService } from "@/core/public-identity/services/PublicIdentityService";
import { useBusinessCreateMultiProfile } from "@/modules/business/hooks/useBusinessCreateMultiProfile";
import type { CreateBusinessInput, BusinessCategory } from "@/modules/business/types";
import { StepIndicator } from "@/modules/business/components/create/StepIndicator";
import { BasicInfoStep } from "@/modules/business/components/create/BasicInfoStep";
import { ContactLocationStep } from "@/modules/business/components/create/ContactLocationStep";
import { ExtrasStep } from "@/modules/business/components/create/ExtrasStep";
import { BusinessSlugSection } from "@/modules/business/components/identity/BusinessSlugSection";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { getEligibleVerticals } from "@/core/verticals/config";

interface DayHoursValue {
  open: string;
  close: string;
  closed?: boolean;
}

interface SelectedLocationData {
  stateId: string;
  cityId: string;
  neighborhoodId: string;
  stateName: string;
  cityName: string;
  neighborhoodName: string;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
}

export default function CriarEmpresaPageV2() {
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [locationData, setLocationData] = useState<SelectedLocationData | null>(null);

  const logoPreview = useObjectUrl(logoFile);
  const bannerPreview = useObjectUrl(bannerFile);

  useEffect(() => {
    setModuleContext("business");
    return () => setModuleContext(null);
  }, [setModuleContext]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  const { createBusinessAsync, isLoading: isCreating, isError, error } = useBusinessCreateMultiProfile({
    onSuccess: (result) => {
      const category = form.getValues("category");
      const eligibleVerticals = getEligibleVerticals(category);

      if (eligibleVerticals.length > 0 && result.business_data_id) {
        navigate(eligibleVerticals[0].setupRoute(result.business_data_id));
        return;
      }

      navigate(`/dashboard/business/${result.profile_id}`);
    },
  });

  const form = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      legal_name: "",
      cnpj: "",
      description: "",
      category: "outros",
      subcategoria: "",
      industry: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      instagram: "",
      facebook: "",
      neighborhood: "",
      city: "",
      state: "",
      address_street: "",
      address_number: "",
      address_complement: "",
      postal_code: "",
      horario_funcionamento: {},
      formas_pagamento: [],
      especialidades: [],
      facilidades: [],
      modos_atendimento: ["presencial"],
      status: "active",
    },
  });

  const selectedCategory = form.watch("category");
  const eligibleVerticals = useMemo(
    () => getEligibleVerticals(selectedCategory),
    [selectedCategory],
  );

  const getErrors = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const formErrors = form.formState.errors;

    for (const key of Object.keys(formErrors)) {
      const fieldError = formErrors[key as keyof typeof formErrors];
      if (fieldError?.message) {
        errors[key] = fieldError.message;
      }
    }

    return errors;
  };

  const handleNameChange = (value: string) => {
    form.setValue("name", value, { shouldDirty: true, shouldValidate: true });

    if (!slugManuallyEdited) {
      form.setValue("slug", PublicIdentityService.normalize(value, "business"), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    form.setValue("slug", value, { shouldDirty: true, shouldValidate: true });
  };

  const handleLocationChange = (locationId: string | null, nextLocationData: SelectedLocationData | null) => {
    setLocationData(nextLocationData);
    form.setValue("location_id", locationId ?? undefined, { shouldDirty: true, shouldValidate: true });
    form.setValue("city", nextLocationData?.cityName || "", { shouldDirty: true });
    form.setValue("state", nextLocationData?.stateName || "", { shouldDirty: true });
    form.setValue("neighborhood", nextLocationData?.neighborhoodName || "", { shouldDirty: true });
  };

  const handleNextStep1 = async () => {
    const isValid = await form.trigger([
      "name",
      "legal_name",
      "cnpj",
      "category",
      "subcategoria",
      "company_type",
      "employee_count",
      "founded_year",
      "industry",
      "description",
      "slug",
    ]);

    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handleNextStep2 = async () => {
    const values = form.getValues();
    const isValid = await form.trigger([
      "phone",
      "whatsapp",
      "email",
      "location_id",
      "address_street",
      "postal_code",
      "horario_funcionamento",
      "modos_atendimento",
    ]);

    const hasContactChannel = Boolean(values.phone || values.whatsapp || values.email);
    if (!hasContactChannel) {
      form.setError("phone", {
        message: "Informe pelo menos um canal de contato comercial",
      });
      return;
    }

    if (!values.location_id) {
      form.setError("location_id", {
        message: "Selecione o territorio principal da empresa",
      });
      return;
    }

    form.clearErrors(["phone", "location_id"]);

    if (isValid) {
      setCurrentStep(3);
    }
  };

  const handleCreate = form.handleSubmit(async (data) => {
    await createBusinessAsync({
      data,
      logoFile,
      bannerFile,
    });
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold font-display">Criar empresa</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {effectiveProfile && (
          <ActiveProfileBadge profile={effectiveProfile} action="criando empresa como" />
        )}

        {eligibleVerticals.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            Esta categoria ja e elegivel para extensao vertical em
            <span className="font-medium text-foreground"> {eligibleVerticals.map((vertical) => vertical.label).join(", ")}</span>.
            O cadastro base sera reutilizado sem duplicar dados.
          </div>
        )}

        {isError && error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Nao foi possivel criar a empresa.</p>
              <p>{error.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {currentStep === 1 && (
            <>
              <BasicInfoStep
                name={form.watch("name") || ""}
                legalName={form.watch("legal_name") || ""}
                cnpj={form.watch("cnpj") || ""}
                category={form.watch("category") || ""}
                subcategory={form.watch("subcategoria") || ""}
                companyType={form.watch("company_type") || ""}
                employeeCount={form.watch("employee_count") || ""}
                foundedYear={form.watch("founded_year")?.toString() || ""}
                industry={form.watch("industry") || ""}
                description={form.watch("description") || ""}
                logoPreview={logoPreview}
                errors={getErrors()}
                onNameChange={handleNameChange}
                onLegalNameChange={(value) => form.setValue("legal_name", value, { shouldDirty: true, shouldValidate: true })}
                onCnpjChange={(value) => form.setValue("cnpj", value, { shouldDirty: true, shouldValidate: true })}
                onCategoryChange={(value) => form.setValue("category", value as BusinessCategory, { shouldDirty: true, shouldValidate: true })}
                onSubcategoryChange={(value) => form.setValue("subcategoria", value, { shouldDirty: true, shouldValidate: true })}
                onCompanyTypeChange={(value) =>
                  form.setValue("company_type", value ? (value as CreateBusinessInput["company_type"]) : undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onEmployeeCountChange={(value) =>
                  form.setValue("employee_count", value ? (value as CreateBusinessInput["employee_count"]) : undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onFoundedYearChange={(value) =>
                  form.setValue("founded_year", value ? Number(value) : undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onIndustryChange={(value) => form.setValue("industry", value, { shouldDirty: true, shouldValidate: true })}
                onDescriptionChange={(value) => form.setValue("description", value, { shouldDirty: true, shouldValidate: true })}
                onLogoChange={setLogoFile}
                onNext={handleNextStep1}
              />

              <BusinessSlugSection
                slug={form.watch("slug") || ""}
                onSlugChange={handleSlugChange}
              />
            </>
          )}

          {currentStep === 2 && (
            <ContactLocationStep
              phone={form.watch("phone") || ""}
              whatsapp={form.watch("whatsapp") || ""}
              email={form.watch("email") || ""}
              locationId={form.watch("location_id") || null}
              locationData={locationData}
              addressStreet={form.watch("address_street") || ""}
              addressNumber={form.watch("address_number") || ""}
              addressComplement={form.watch("address_complement") || ""}
              postalCode={form.watch("postal_code") || ""}
              hours={(form.watch("horario_funcionamento") as Record<string, DayHoursValue>) || {}}
              selectedModos={form.watch("modos_atendimento") || ["presencial"]}
              errors={getErrors()}
              onPhoneChange={(value) => form.setValue("phone", value, { shouldDirty: true, shouldValidate: true })}
              onWhatsappChange={(value) => form.setValue("whatsapp", value, { shouldDirty: true, shouldValidate: true })}
              onEmailChange={(value) => form.setValue("email", value, { shouldDirty: true, shouldValidate: true })}
              onLocationChange={handleLocationChange}
              onAddressStreetChange={(value) => form.setValue("address_street", value, { shouldDirty: true, shouldValidate: true })}
              onAddressNumberChange={(value) => form.setValue("address_number", value, { shouldDirty: true })}
              onAddressComplementChange={(value) => form.setValue("address_complement", value, { shouldDirty: true })}
              onPostalCodeChange={(value) => form.setValue("postal_code", value, { shouldDirty: true, shouldValidate: true })}
              onHoursChange={(value) => form.setValue("horario_funcionamento", value, { shouldDirty: true, shouldValidate: true })}
              onModosChange={(value) => form.setValue("modos_atendimento", value, { shouldDirty: true, shouldValidate: true })}
              onBack={() => setCurrentStep(1)}
              onNext={handleNextStep2}
            />
          )}

          {currentStep === 3 && (
            <ExtrasStep
              capaPreview={bannerPreview}
              website={form.watch("website") || ""}
              instagram={form.watch("instagram") || ""}
              facebook={form.watch("facebook") || ""}
              selectedPagamentos={form.watch("formas_pagamento") || []}
              especialidades={(form.watch("especialidades") || []).join(", ")}
              facilidades={(form.watch("facilidades") || []).join(", ")}
              status={form.watch("status") || "active"}
              errors={getErrors()}
              isCreating={isCreating}
              onCapaChange={setBannerFile}
              onWebsiteChange={(value) => form.setValue("website", value, { shouldDirty: true, shouldValidate: true })}
              onInstagramChange={(value) => form.setValue("instagram", value, { shouldDirty: true, shouldValidate: true })}
              onFacebookChange={(value) => form.setValue("facebook", value, { shouldDirty: true, shouldValidate: true })}
              onPagamentosChange={(value) => form.setValue("formas_pagamento", value, { shouldDirty: true, shouldValidate: true })}
              onEspecialidadesChange={(value) =>
                form.setValue(
                  "especialidades",
                  value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  { shouldDirty: true, shouldValidate: true },
                )
              }
              onFacilidadesChange={(value) =>
                form.setValue(
                  "facilidades",
                  value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  { shouldDirty: true, shouldValidate: true },
                )
              }
              onStatusChange={(value) => form.setValue("status", value as CreateBusinessInput["status"], { shouldDirty: true })}
              onBack={() => setCurrentStep(2)}
              onCreate={handleCreate}
            />
          )}
        </form>
      </div>
    </div>
  );
}
