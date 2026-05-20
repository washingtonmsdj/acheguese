/**
 * CriarEmpresaPage - fluxo alinhado ao SSOT de business
 */

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, AlertCircle, ArrowRight } from "lucide-react";
import { useSessionContext } from "@/core/session";
import {
  createBusinessSchema,
  createBusinessStep1Schema,
  createBusinessStep2Schema,
} from "@/shared/schemas/business/businessSchemas";
import { PublicIdentityService } from "@/core/public-identity/services/PublicIdentityService";
import {
  evaluateBusinessSlugSafety,
  isBusinessSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/businessSlugSafety";
import { useBusinessCreateMultiProfile } from "@/modules/business/hooks/useBusinessCreateMultiProfile";
import type { CreateBusinessInput, BusinessCategory } from "@/modules/business/types";
import { StepIndicator } from "@/modules/business/components/create/StepIndicator";
import { BasicInfoStep } from "@/modules/business/components/create/BasicInfoStep";
import { ContactLocationStep } from "@/modules/business/components/create/ContactLocationStep";
import { ExtrasStep } from "@/modules/business/components/create/ExtrasStep";
import { BusinessSlugSection } from "@/modules/business/components/identity/BusinessSlugSection";
import { Button } from "@/shared/components/ui/button";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { getEligibleVerticals, getVerticalByCreateSlug } from "@/core/verticals/config";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { EntityStatus } from "@/shared/types/enums";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";

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

interface TerritoryFallback {
  state: string;
  city: string;
  district: string;
}

const STEP1_FIELDS = [
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
] as const;

const STEP2_FIELDS = [
  "phone",
  "whatsapp",
  "email",
  "location_id",
  "address_street",
  "postal_code",
  "horario_funcionamento",
  "modos_atendimento",
] as const;

function getStepErrorMessages(
  errors: Record<string, string>,
  fields: readonly string[],
): string[] {
  const collected = fields
    .map((field) => errors[field])
    .filter((message): message is string => Boolean(message));

  return Array.from(new Set(collected));
}

function focusFieldById(field?: string) {
  if (!field) return;

  const el = document.getElementById(field);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (typeof (el as HTMLElement).focus === "function") {
    (el as HTMLElement).focus();
  }
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

export default function CriarEmpresaPage() {
  const navigate = useNavigate();
  const { verticalSlug } = useParams<{ verticalSlug?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useSessionContext();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [slugManualMode, setSlugManualMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [locationData, setLocationData] = useState<SelectedLocationData | null>(null);
  const [step1Attempted, setStep1Attempted] = useState(false);

  const logoPreview = useObjectUrl(logoFile);
  const bannerPreview = useObjectUrl(bannerFile);
  const activeLocation = locationContextStore.getActiveLocation();
  const fallbackTerritory = useMemo<TerritoryFallback | null>(() => {
    const path = activeLocation?.geographic_path;
    if (!path) return null;

    const parts = path.replace(/^\//, "").split("/");
    if (parts.length < 4) return null;

    return {
      state: parts[1] || "",
      city: parts[2] || "",
      district: parts[3] || "",
    };
  }, [activeLocation?.geographic_path]);

  const createVertical = useMemo(
    () => getVerticalByCreateSlug(verticalSlug ?? searchParams.get("vertical")),
    [searchParams, verticalSlug],
  );

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
      const eligibleVerticals = createVertical ? [createVertical] : getEligibleVerticals(category);

      if (eligibleVerticals.length > 0) {
        navigate(eligibleVerticals[0].setupRoute(result.profile_id));
        return;
      }

      navigate(businessManagementRoutes.overview(result.profile_id));
    },
  });

  const form = useForm<CreateBusinessInput>({
    defaultValues: {
      name: "",
      legal_name: "",
      cnpj: "",
      description: "",
      category: createVertical?.defaultCategory ?? "outros",
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
      status: EntityStatus.ACTIVE,
    },
  });

  const selectedCategory = form.watch("category");
  const eligibleVerticals = useMemo(
    () => getEligibleVerticals(selectedCategory),
    [selectedCategory],
  );

  useEffect(() => {
    if (!createVertical) return;

    form.setValue("category", createVertical.defaultCategory, {
      shouldDirty: false,
    });
  }, [createVertical, form]);

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
    form.setValue("name", value, { shouldDirty: true });

    if (!slugManualMode) {
      form.setValue("slug", PublicIdentityService.normalize(value, "business"), {
        shouldDirty: true,
      });
    }
  };

  const handleSlugChange = (value: string) => {
    form.setValue("slug", PublicIdentityService.normalize(value, "business"), { shouldDirty: true });
  };

  const handleResetSlugToAuto = () => {
    const currentName = form.getValues("name") || "";
    form.setValue("slug", PublicIdentityService.normalize(currentName, "business"), {
      shouldDirty: true,
    });
  };

  const handleLocationChange = (locationId: string | null, nextLocationData: SelectedLocationData | null) => {
    setLocationData(nextLocationData);
    form.setValue("location_id", locationId ?? undefined, { shouldDirty: true });
    form.setValue("city", nextLocationData?.cityName || "", { shouldDirty: true });
    form.setValue("state", nextLocationData?.stateName || "", { shouldDirty: true });
    form.setValue("neighborhood", nextLocationData?.neighborhoodName || "", { shouldDirty: true });
  };

  const setSchemaErrors = (issues: Array<{ path: Array<string | number>; message: string }>) => {
    issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field !== "string") return;
      form.setError(field as keyof CreateBusinessInput, { message: issue.message });
    });
  };

  const getFirstInvalidStep = (field?: string) => {
    if (!field) return 1;
    if ((STEP1_FIELDS as readonly string[]).includes(field)) return 1;
    if ((STEP2_FIELDS as readonly string[]).includes(field)) return 2;
    return 3;
  };

  const handleNextStep1 = () => {
    setStep1Attempted(true);
    form.clearErrors(STEP1_FIELDS);

    const result = createBusinessStep1Schema.safeParse(form.getValues());

    if (!result.success) {
      setSchemaErrors(result.error.issues);
      focusFieldById(String(result.error.issues[0]?.path[0] ?? ""));
      return;
    }

    const parsed = result.data as CreateBusinessInput;
    if (
      slugManualMode &&
      parsed.slug &&
      !isBusinessSlugSafetyBypassAllowed({ isVerifiedOfficial: parsed.is_verified })
    ) {
      const slugSafety = evaluateBusinessSlugSafety({
        businessName: parsed.name,
        slug: parsed.slug,
      });
      if (slugSafety.status === "review") {
        form.setError("slug", {
          message:
            "O link público está muito diferente do nome informado. Para segurança, ajuste o link ou use o modo automático.",
        });
        return;
      }
    }

    form.clearErrors(["phone", "location_id", "address_street", "postal_code"]);
    setStep1Attempted(false);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const step1ErrorMessages = [
    ...getStepErrorMessages(getErrors(), STEP1_FIELDS),
  ];

  const handleNextStep2 = () => {
    form.clearErrors(STEP2_FIELDS);

    const result = createBusinessStep2Schema.safeParse(form.getValues());
    if (!result.success) {
      setSchemaErrors(result.error.issues);
      focusFieldById(String(result.error.issues[0]?.path[0] ?? ""));
      return;
    }

    form.clearErrors(["phone", "location_id"]);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async () => {
    form.clearErrors();

    const result = createBusinessSchema.safeParse(form.getValues());
    if (!result.success) {
      setSchemaErrors(result.error.issues);
      setStep1Attempted(true);
      const firstInvalidField = String(result.error.issues[0]?.path[0] ?? "");
      setCurrentStep(getFirstInvalidStep(firstInvalidField));
      focusFieldById(firstInvalidField);
      return;
    }

    await createBusinessAsync({
      data: result.data as CreateBusinessInput,
      logoFile,
      bannerFile,
    });
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleCreate();
  };

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
          <h1 className="text-sm font-semibold font-display">
            {createVertical?.createCopy.title ?? "Criar empresa"}
          </h1>
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
            {createVertical
              ? createVertical.createCopy.subtitle
              : "Esta categoria ja e elegivel para extensao vertical em"}
            {!createVertical && (
              <>
                <span className="font-medium text-foreground"> {eligibleVerticals.map((vertical) => vertical.label).join(", ")}</span>.
                {" "}O cadastro base sera reutilizado sem duplicar dados.
              </>
            )}
          </div>
        )}

        {isError && error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Não foi possível criar a empresa.</p>
              <p>{error.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {currentStep === 1 && (
            <>
              <BasicInfoStep
                contextTitle={createVertical ? "Identidade da instituicao" : undefined}
                contextDescription={createVertical?.createCopy.subtitle}
                categoryLocked={Boolean(createVertical)}
                categoryLockedHelp={createVertical?.createCopy.categoryLockedHelp}
                nameLabel={createVertical?.createCopy.nameLabel}
                namePlaceholder={createVertical?.createCopy.namePlaceholder}
                descriptionPlaceholder={createVertical?.createCopy.descriptionPlaceholder}
                showNextButton={false}
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
                onLegalNameChange={(value) => form.setValue("legal_name", value, { shouldDirty: true })}
                onCnpjChange={(value) => form.setValue("cnpj", value, { shouldDirty: true })}
                onCategoryChange={(value) => {
                  if (createVertical) return;
                  form.setValue("category", value as BusinessCategory, { shouldDirty: true });
                }}
                onSubcategoryChange={(value) => form.setValue("subcategoria", value, { shouldDirty: true })}
                onCompanyTypeChange={(value) =>
                  form.setValue("company_type", value ? (value as CreateBusinessInput["company_type"]) : undefined, {
                    shouldDirty: true,
                  })
                }
                onEmployeeCountChange={(value) =>
                  form.setValue("employee_count", value ? (value as CreateBusinessInput["employee_count"]) : undefined, {
                    shouldDirty: true,
                  })
                }
                onFoundedYearChange={(value) =>
                  form.setValue("founded_year", value ? Number(value) : undefined, {
                    shouldDirty: true,
                  })
                }
                onIndustryChange={(value) => form.setValue("industry", value, { shouldDirty: true })}
                onDescriptionChange={(value) => form.setValue("description", value, { shouldDirty: true })}
                onLogoChange={setLogoFile}
                onNext={handleNextStep1}
              />

              <BusinessSlugSection
                slug={form.watch("slug") || ""}
                onSlugChange={handleSlugChange}
                category={selectedCategory}
                businessName={form.watch("name") || ""}
                isVerifiedOfficial={Boolean(form.watch("is_verified"))}
                stateName={locationData?.stateName || fallbackTerritory?.state}
                cityName={locationData?.cityName || fallbackTerritory?.city}
                districtName={locationData?.neighborhoodName || fallbackTerritory?.district}
                manualMode={slugManualMode}
                onManualModeChange={setSlugManualMode}
                onResetToAuto={handleResetSlugToAuto}
              />

              {step1Attempted && step1ErrorMessages.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <p className="font-medium">Não foi possível continuar.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {step1ErrorMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button type="button" onClick={handleNextStep1} className="w-full gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {currentStep === 2 && (
            <ContactLocationStep
              category={selectedCategory}
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
              onPhoneChange={(value) => form.setValue("phone", value, { shouldDirty: true })}
              onWhatsappChange={(value) => form.setValue("whatsapp", value, { shouldDirty: true })}
              onEmailChange={(value) => form.setValue("email", value, { shouldDirty: true })}
              onLocationChange={handleLocationChange}
              onAddressStreetChange={(value) => form.setValue("address_street", value, { shouldDirty: true })}
              onAddressNumberChange={(value) => form.setValue("address_number", value, { shouldDirty: true })}
              onAddressComplementChange={(value) => form.setValue("address_complement", value, { shouldDirty: true })}
              onPostalCodeChange={(value) => form.setValue("postal_code", value, { shouldDirty: true })}
              onHoursChange={(value) => form.setValue("horario_funcionamento", value, { shouldDirty: true })}
              onModosChange={(value) => form.setValue("modos_atendimento", value, { shouldDirty: true })}
              onBack={() => setCurrentStep(1)}
              onNext={handleNextStep2}
            />
          )}

          {currentStep === 3 && (
            <ExtrasStep
              category={selectedCategory}
              capaPreview={bannerPreview}
              website={form.watch("website") || ""}
              instagram={form.watch("instagram") || ""}
              facebook={form.watch("facebook") || ""}
              selectedPagamentos={form.watch("formas_pagamento") || []}
              especialidades={(form.watch("especialidades") || []).join(", ")}
              facilidades={(form.watch("facilidades") || []).join(", ")}
              status={form.watch("status") || EntityStatus.ACTIVE}
              errors={getErrors()}
              isCreating={isCreating}
              onCapaChange={setBannerFile}
              onWebsiteChange={(value) => form.setValue("website", value, { shouldDirty: true })}
              onInstagramChange={(value) => form.setValue("instagram", value, { shouldDirty: true })}
              onFacebookChange={(value) => form.setValue("facebook", value, { shouldDirty: true })}
              onPagamentosChange={(value) => form.setValue("formas_pagamento", value, { shouldDirty: true })}
              onEspecialidadesChange={(value) =>
                form.setValue(
                  "especialidades",
                  value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  { shouldDirty: true },
                )
              }
              onFacilidadesChange={(value) =>
                form.setValue(
                  "facilidades",
                  value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  { shouldDirty: true },
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

