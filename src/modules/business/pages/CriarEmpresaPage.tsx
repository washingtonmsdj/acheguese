/**
 * CriarEmpresaPage - fluxo alinhado ao SSOT de business
 */

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { ArrowLeft, AlertCircle, ArrowRight, Camera, CheckCircle2, ImagePlus, MapPin, Store, Upload } from "lucide-react";
import {
  createBusinessSchema,
  createBusinessStep1Schema,
  createBusinessStep2Schema,
} from "@/shared/schemas/business/businessSchemas";
import { PublicIdentityService } from "@/core/public-identity";
import {
  evaluateBusinessSlugSafety,
  isBusinessSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/businessSlugSafety";
import { useBusinessCreateMultiProfile } from "@/modules/business/hooks/useBusinessCreateMultiProfile";
import type { CreateBusinessInput, BusinessCategory } from "@/core/business/types";
import { StepIndicator } from "@/modules/business/components/create/StepIndicator";
import { BasicInfoStep } from "@/modules/business/components/create/BasicInfoStep";
import { ContactLocationStep } from "@/modules/business/components/create/ContactLocationStep";
import { BusinessSlugSection } from "@/modules/business/components/identity/BusinessSlugSection";
import { Button } from "@/shared/components/ui/button";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import {
  getEligibleVerticals,
  getVerticalByCreateSlug,
  type VerticalKey,
} from "@/core/verticals/config";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { EntityStatus } from "@/shared/types/enums";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import "./CriarEmpresaPage.css";

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

function getEnabledVerticals(
  category: BusinessCategory,
  enabledVerticalKeys: ReadonlySet<VerticalKey>,
) {
  return getEligibleVerticals(category).filter((vertical) =>
    enabledVerticalKeys.has(vertical.key),
  );
}

interface CriarEmpresaPageProps {
  enabledVerticalKeys?: readonly VerticalKey[];
}

function getStepErrorMessages(
  errors: Record<string, string>,
  fields: readonly string[],
): string[] {
  const collected = fields
    .map((field) => getRecordValue(errors, field))
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

export default function CriarEmpresaPage({
  enabledVerticalKeys = [],
}: CriarEmpresaPageProps) {
  const navigate = useNavigate();
  const pageLocation = useLocation();
  const { verticalSlug } = useParams<{ verticalSlug?: string }>();
  const [searchParams] = useSearchParams();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [slugManualMode, setSlugManualMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [locationData, setLocationData] = useState<SelectedLocationData | null>(null);
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  const logoPreview = useObjectUrl(logoFile);
  const bannerPreview = useObjectUrl(bannerFile);
  const enabledVerticalKeySet = useMemo(
    () => new Set(enabledVerticalKeys),
    [enabledVerticalKeys],
  );
  const activeLocation = locationContextStore.getActiveLocation();
  const territoryLabel = searchParams.get("territory") || activeLocation?.full_name;
  const territorySlugCandidate = searchParams.get("territorySlug") || activeLocation?.slug;
  const territorySlug = territorySlugCandidate && /^[a-z0-9-]+$/.test(territorySlugCandidate) ? territorySlugCandidate : null;
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

  const createVertical = useMemo(() => {
    const vertical = getVerticalByCreateSlug(
      verticalSlug ?? searchParams.get("vertical"),
    );
    return vertical && enabledVerticalKeySet.has(vertical.key) ? vertical : null;
  }, [enabledVerticalKeySet, searchParams, verticalSlug]);

  useEffect(() => {
    setModuleContext("business");
    return () => setModuleContext(null);
  }, [setModuleContext]);

  useEffect(() => {
    if (!pendingFocus) return;
    if (pendingFocus === "slug") {
      const advanced = document.querySelector<HTMLDetailsElement>(".bcr-advanced");
      advanced?.setAttribute("open", "");
      advanced?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    focusFieldById(pendingFocus);
    setPendingFocus(null);
  }, [currentStep, pendingFocus]);

  const { createBusinessAsync, isLoading: isCreating, isError, error } = useBusinessCreateMultiProfile({
    onSuccess: (result) => {
      const category = form.getValues("category");
      const eligibleVerticals = createVertical
        ? [createVertical]
        : getEnabledVerticals(category, enabledVerticalKeySet);

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
      category: createVertical?.defaultCategory ?? ("" as BusinessCategory),
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
      location_id: searchParams.get("locationId") || undefined,
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
    () => getEnabledVerticals(selectedCategory, enabledVerticalKeySet),
    [enabledVerticalKeySet, selectedCategory],
  );

  useEffect(() => {
    if (!createVertical) return;

    form.setValue("category", createVertical.defaultCategory, {
      shouldDirty: false,
    });
  }, [createVertical, form]);

  const getErrors = (): Record<string, string> => {
    const formErrors = form.formState.errors;

    return Object.fromEntries(
      Object.entries(formErrors).flatMap(([key, fieldError]) =>
        fieldError?.message ? [[key, fieldError.message as string]] : [],
      ),
    );
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
    if (["location_id", "address_street", "address_number", "address_complement", "postal_code"].includes(field)) return 2;
    if ((STEP2_FIELDS as readonly string[]).includes(field)) return 3;
    return 5;
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
      !isBusinessSlugSafetyBypassAllowed({ isVerifiedOfficial: false })
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
        setPendingFocus("slug");
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

  const handleNextLocation = () => {
    if (!form.getValues("location_id") || !locationData) {
      form.setError("location_id", { message: "Selecione o território principal da empresa" });
      focusFieldById("location_id");
      return;
    }
    form.clearErrors("location_id");
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextStep2 = () => {
    form.clearErrors(STEP2_FIELDS);

    const result = createBusinessStep2Schema.safeParse(form.getValues());
    if (!result.success) {
      setSchemaErrors(result.error.issues);
      const firstInvalidField = String(result.error.issues[0]?.path[0] ?? "");
      setCurrentStep(getFirstInvalidStep(firstInvalidField));
      setPendingFocus(firstInvalidField);
      return;
    }

    form.clearErrors(["phone", "location_id"]);
    setCurrentStep(4);
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
      setPendingFocus(firstInvalidField);
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
    if (currentStep === 1) handleNextStep1();
    else if (currentStep === 2) handleNextLocation();
    else if (currentStep === 3) handleNextStep2();
    else if (currentStep === 4) setCurrentStep(5);
    else if (!isCreating) void handleCreate();
  };

  const handleCancel = () => {
    if (pageLocation.key === "default") navigate("/empresas");
    else navigate(-1);
  };

  return (
    <div className="bcr-page">
      <Helmet><title>Cadastrar empresa | Achegue-se</title><meta name="description" content="Cadastre sua empresa no Achegue-se em etapas simples." /></Helmet>
      <header className="bcr-hero">
        {territorySlug ? <div className="bcr-hero__territory-image" style={{ backgroundImage: `url(/territory/heroes/${territorySlug}.jpg)` }} aria-hidden="true" /> : null}
        <div className="bcr-hero__inner">
          <button type="button" className="bcr-back" onClick={handleCancel}><ArrowLeft aria-hidden="true" /> Voltar</button>
          <p className="bcr-hero__eyebrow"><Store aria-hidden="true" /> Para quem empreende no bairro</p>
          <h1>{createVertical?.createCopy.title ?? "Cadastrar empresa"}</h1>
          <p>Divulgue seu negócio{territoryLabel ? ` em ${territoryLabel}` : " no Achegue-se"} e conecte-se com mais pessoas da sua comunidade.</p>
        </div>
      </header>

      <div className="bcr-layout">
        <StepIndicator currentStep={currentStep} totalSteps={5} />
        <div className="bcr-main">
        <div className="bcr-form-column">

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
                showLogo={false}
                simpleMode
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

              <details className="bcr-advanced">
                <summary>Personalizar link público (opcional)</summary>
              <BusinessSlugSection
                slug={form.watch("slug") || ""}
                onSlugChange={handleSlugChange}
                category={selectedCategory}
                businessName={form.watch("name") || ""}
                isVerifiedOfficial={false}
                stateName={locationData?.stateName || fallbackTerritory?.state}
                cityName={locationData?.cityName || fallbackTerritory?.city}
                districtName={locationData?.neighborhoodName || fallbackTerritory?.district}
                manualMode={slugManualMode}
                onManualModeChange={setSlugManualMode}
                onResetToAuto={handleResetSlugToAuto}
              />
              </details>

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

              <div className="bcr-actions">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
                <Button type="button" onClick={handleNextStep1}>Continuar <ArrowRight aria-hidden="true" /></Button>
              </div>
            </>
          )}

          {(currentStep === 2 || currentStep === 3) && (
            <ContactLocationStep
              mode={currentStep === 2 ? "location" : "contact"}
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
              onBack={() => setCurrentStep(currentStep === 2 ? 1 : 2)}
              onNext={currentStep === 2 ? handleNextLocation : handleNextStep2}
            />
          )}

          {currentStep === 4 && (
            <section className="bcr-card" aria-labelledby="bcr-photos-title">
              <div className="bcr-card__heading"><span><Camera aria-hidden="true" /></span><div><h2 id="bcr-photos-title">4. Fotos</h2><p>Escolha imagens reais que ajudem as pessoas a reconhecer sua empresa. Você pode adicioná-las depois.</p></div></div>
              <div className="bcr-photo-grid">
                <label className="bcr-photo-field">
                  <span>Logo da empresa <small>Opcional · imagem quadrada</small></span>
                  <span className="bcr-photo-preview">{logoPreview ? <img src={logoPreview} alt="Prévia do logo" /> : <Store aria-hidden="true" />}</span>
                  <span className="bcr-photo-button"><Upload aria-hidden="true" /> {logoPreview ? "Trocar logo" : "Adicionar logo"}</span>
                  <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                </label>
                <label className="bcr-photo-field">
                  <span>Imagem de capa <small>Opcional · imagem horizontal</small></span>
                  <span className="bcr-photo-preview">{bannerPreview ? <img src={bannerPreview} alt="Prévia da capa" /> : <ImagePlus aria-hidden="true" />}</span>
                  <span className="bcr-photo-button"><Upload aria-hidden="true" /> {bannerPreview ? "Trocar capa" : "Adicionar capa"}</span>
                  <input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="bcr-actions"><Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>Voltar</Button><Button type="button" onClick={() => setCurrentStep(5)}>Revisar <ArrowRight aria-hidden="true" /></Button></div>
            </section>
          )}
          {currentStep === 5 && (
            <section className="bcr-card" aria-labelledby="bcr-review-title">
              <div className="bcr-card__heading"><span><CheckCircle2 aria-hidden="true" /></span><div><h2 id="bcr-review-title">5. Revisar e publicar</h2><p>Confira as informações antes de cadastrar sua empresa.</p></div></div>
              <dl className="bcr-review">
                <div><dt>Empresa</dt><dd>{form.watch("name")}</dd></div>
                <div><dt>Categoria</dt><dd>{getBusinessCategoryLabel(selectedCategory)}</dd></div>
                <div><dt>Descrição</dt><dd>{form.watch("description") || "Não informada"}</dd></div>
                <div><dt>Território</dt><dd>{locationData ? `${locationData.neighborhoodName}, ${locationData.cityName}` : "Território selecionado"}</dd></div>
                <div><dt>Contato</dt><dd>{form.watch("whatsapp") || form.watch("phone") || form.watch("email")}</dd></div>
                <div><dt>Endereço</dt><dd>{[form.watch("address_street"), form.watch("address_number")].filter(Boolean).join(", ") || "Não informado"}</dd></div>
                <div><dt>Fotos</dt><dd>{[logoFile && "logo", bannerFile && "capa"].filter(Boolean).join(" e ") || "Nenhuma adicionada"}</dd></div>
              </dl>
              <p className="bcr-review-note">Após a publicação, você poderá atualizar os dados pela Central da empresa.</p>
              <div className="bcr-actions"><Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>Voltar</Button><Button type="button" disabled={isCreating} onClick={() => void handleCreate()}>{isCreating ? "Publicando..." : "Publicar empresa"} <ArrowRight aria-hidden="true" /></Button></div>
            </section>
          )}
        </form>
        </div>
        <aside className="bcr-aside" aria-label="Sobre o cadastro">
          <div className="bcr-aside-card"><MapPin aria-hidden="true" /><h2>Seu negócio no território</h2><p>Depois de publicado, seu perfil poderá aparecer na busca, no mapa e na lista de empresas do território selecionado.</p></div>
          <div className="bcr-aside-card"><CheckCircle2 aria-hidden="true" /><h2>Cadastro gratuito</h2><p>Preencha o essencial agora e complemente sua página depois na Central.</p></div>
        </aside>
        </div>
      </div>
    </div>
  );
}

