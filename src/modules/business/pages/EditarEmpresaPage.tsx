/**
 * EDITAR EMPRESA PAGE - SSOT completo
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useBusinessEdit, useBusinessEditImageUpload } from "@/modules/business/hooks/useBusinessEdit";
import { updateBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import type {
  UpdateBusinessInput,
  BusinessCategory,
} from "@/core/business/types";
import { StepProgress } from "@/modules/business/components/edit/StepProgress";
import { BasicInfoStep } from "@/modules/business/components/edit/BasicInfoStep";
import { ContactStep } from "@/modules/business/components/edit/ContactStep";
import { ExtrasStep } from "@/modules/business/components/edit/ExtrasStep";
import { BusinessSlugSection } from "@/modules/business/components/identity/BusinessSlugSection";
import { useBusinessSlugSaveGuard } from "@/modules/business/components/identity/useBusinessSlugSaveGuard";
import { IdentityChangeConfirmDialog } from "@/core/public-identity/components/IdentityChangeConfirmDialog";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { useIdentitySaveLogger } from "@/core/public-identity/hooks/useIdentitySaveLogger";
import { BusinessCoverageSettings } from "@/modules/business/components/coverage";
import { CATEGORY_CONFIGS } from "@/modules/business/config/categoryFilters";
import "./EditarEmpresaPage.css";
import {
  evaluateBusinessSlugSafety,
  isBusinessSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/businessSlugSafety";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import { MEDIA_IMAGE_SOURCE_MIME_TYPES, MEDIA_PRESET_CLIENT_CONFIG } from "@/core/media/config/mediaPresets";

function normalizeCategoryValue(rawCategory: unknown): BusinessCategory {
  const value = String(rawCategory ?? "").trim().toLowerCase();
  if ((value as BusinessCategory) in CATEGORY_CONFIGS) {
    return value as BusinessCategory;
  }

  switch (value) {
    case "alimentacao":
    case "alimentação":
      return "restaurante";
    case "beleza":
    case "beleza e estetica":
    case "beleza e estética":
      return "servicos";
    case "construcao":
    case "construção":
      return "servicos";
    case "educacao":
    case "educação":
      return "educacao";
    case "saude":
    case "saúde":
      return "saude";
    case "tecnologia":
      return "servicos";
    case "varejo":
      return "mercado";
    default:
      return "outros";
  }
}

export default function EditarEmpresaPage() {
  const navigate = useNavigate();
  const { businessId, business } = useActiveBusinessDashboardContext();
  const { user } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");

  // Refs para upload de imagens
  const logoRef = useRef<HTMLInputElement>(null);
  const capaRef = useRef<HTMLInputElement>(null);
  const logoUploadSequenceRef = useRef(0);
  const capaUploadSequenceRef = useRef(0);
  const pendingMediaUploadsRef = useRef(0);
  const [pendingMediaUploads, setPendingMediaUploads] = useState(0);

  // Late responses for another Business must never update this form.
  useEffect(() => {
    ++logoUploadSequenceRef.current;
    ++capaUploadSequenceRef.current;
  }, [businessId]);

  // Estados para preview de imagens
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [capaPreview, setCapaPreview] = useState<string>("");

  const { updateBusiness, isLoading: saving } = useBusinessEdit({
    onSuccess: () => {
      if (businessId) {
        navigate(businessManagementRoutes.dados(businessId));
      }
    },
  });

  const { mutateAsync: uploadImage, isPending: uploading } = useBusinessEditImageUpload(businessId);
  const uploadBusinessImage = (file: File, folder: "logos" | "banners") =>
    uploadImage({ file, folder });

  const { logAttempt, logSuccess, logError } = useIdentitySaveLogger({
    entityType: 'business',
    entityId: businessId!,
    userId: user?.id ?? "unknown-user",
    page: 'EditarEmpresaPage',
  });

  const form = useForm<UpdateBusinessInput>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "outros",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      website: "",
      instagram: "",
      facebook: "",
      formas_pagamento: [],
      especialidades: [],
      facilidades: [],
      modos_atendimento: ["presencial"],
    },
  });

  useEffect(() => {
    if (business) {
      form.reset({
        name: business.name,
        description: business.description,
        category: normalizeCategoryValue(business.category),
        phone: business.phone || "",
        whatsapp: business.whatsapp || "",
        email: business.email || "",
        address:
          business.business_address ||
          [business.address?.street, business.address?.number, business.address?.complement]
            .filter(Boolean)
            .join(", "),
        website: business.website || "",
        instagram: business.instagram || "",
        facebook: business.facebook || "",
        formas_pagamento: business.formas_pagamento || [],
        especialidades: business.especialidades || [],
        facilidades: business.facilidades || [],
        modos_atendimento: business.modos_atendimento || ["presencial"],
        latitude: business.address?.latitude,
        longitude: business.address?.longitude,
      });

      // Inicializar previews de imagens
      setLogoPreview(business.logo_url || "");
      setCapaPreview(business.banner_url || "");

      // Reset both fields for every business identity, including empty slugs.
      const businessSlug = business.slug ?? "";
      setSlug(businessSlug);
      setOriginalSlug(businessSlug);
    }
  }, [business, form]);

  const handleNextStep1 = () => {
    form.trigger(["name", "description", "category"]).then((isValid) => {
      if (isValid) setCurrentStep(2);
    });
  };

  const handleNextStep2 = () => {
    form.trigger(["phone", "whatsapp", "email", "address"]).then((isValid) => {
      if (isValid) setCurrentStep(3);
    });
  };

  // Handlers de upload de imagens
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (5MB)
    if (file.size > MEDIA_PRESET_CLIENT_CONFIG.business_logo.maxSourceBytes) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    // Validar tipo
    if (!MEDIA_IMAGE_SOURCE_MIME_TYPES.some((type) => type === file.type)) {
      toast.error("Use uma imagem JPEG, PNG, WebP ou GIF");
      return;
    }

    const uploadId = ++logoUploadSequenceRef.current;
    ++pendingMediaUploadsRef.current;
    setPendingMediaUploads(pendingMediaUploadsRef.current);
    try {
      const url = await uploadBusinessImage(file, "logos");
      if (uploadId !== logoUploadSequenceRef.current) return;
      form.setValue("logo_url", url, { shouldDirty: true, shouldValidate: true });
      setLogoPreview(url);
      toast.success("Logo enviado. Salve as alterações para publicá-lo.");
    } catch {
      // The canonical upload hook displays the failure; retain the prior image.
    } finally {
      --pendingMediaUploadsRef.current;
      setPendingMediaUploads(pendingMediaUploadsRef.current);
    }
  };

  const handleCapaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (5MB)
    if (file.size > MEDIA_PRESET_CLIENT_CONFIG.business_banner.maxSourceBytes) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    // Validar tipo
    if (!MEDIA_IMAGE_SOURCE_MIME_TYPES.some((type) => type === file.type)) {
      toast.error("Use uma imagem JPEG, PNG, WebP ou GIF");
      return;
    }

    const uploadId = ++capaUploadSequenceRef.current;
    ++pendingMediaUploadsRef.current;
    setPendingMediaUploads(pendingMediaUploadsRef.current);
    try {
      const url = await uploadBusinessImage(file, "banners");
      if (uploadId !== capaUploadSequenceRef.current) return;
      form.setValue("banner_url", url, { shouldDirty: true, shouldValidate: true });
      setCapaPreview(url);
      toast.success("Capa enviada. Salve as alterações para publicá-la.");
    } catch {
      // The canonical upload hook displays the failure; retain the prior image.
    } finally {
      --pendingMediaUploadsRef.current;
      setPendingMediaUploads(pendingMediaUploadsRef.current);
    }
  };

  const doSave = form.handleSubmit(async (data) => {
    if (!businessId) return;
    if (pendingMediaUploadsRef.current > 0) {
      toast.error("Aguarde o envio das imagens antes de salvar a empresa.");
      return;
    }

    const isVerifiedOfficial = Boolean(business?.is_verified);
    if (
      slug &&
      !isBusinessSlugSafetyBypassAllowed({ isVerifiedOfficial })
    ) {
      const slugSafety = evaluateBusinessSlugSafety({
        businessName: data.name ?? business?.name ?? "",
        slug,
      });
      if (slugSafety.status === "review") {
        toast.error(
          "O link público está muito diferente do nome do negócio. Ajuste para manter autenticidade.",
        );
        return;
      }
    }

    const hasSlugChange = slug !== originalSlug && originalSlug;
    if (hasSlugChange) {
      logAttempt(originalSlug, slug);
    }

    try {
      await updateBusiness({ id: businessId, data: { ...data, slug } });
      if (hasSlugChange) {
        logSuccess(originalSlug, slug);
      }
    } catch (error) {
      if (hasSlugChange) {
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
        logError(originalSlug, slug, (error as Error).message || "Erro ao salvar", errorCode);
      }
      throw error;
    }
  });

  const { triggerSave: handleSave, confirmProps: slugConfirmProps } = useBusinessSlugSaveGuard({
    slug,
    originalSlug,
    onSave: () => doSave(),
  });

  // Helper to extract error messages
  const getErrors = (): Record<string, string> => {
    const formErrors = form.formState.errors;

    return Object.fromEntries(
      Object.entries(formErrors).flatMap(([key, error]) =>
        error?.message ? [[key, error.message as string]] : [],
      ),
    );
  };

  return (
    <div className="business-edit-page space-y-4">
      <h1 className="business-management-title">Editar empresa</h1>

      <div className="business-edit-content space-y-4">
        <StepProgress currentStep={currentStep} totalSteps={3} />

        {/* Autoria explícita */}
        {effectiveProfile && (
          <ActiveProfileBadge profile={effectiveProfile} action="editando como" />
        )}

        <div className="business-edit-layout">
          <form onSubmit={handleSave}>
            {currentStep === 1 && (
            <>
              <BasicInfoStep
                name={form.watch("name") || ""}
                onNameChange={(value) => form.setValue("name", value)}
                description={form.watch("description") || ""}
                onDescriptionChange={(value) =>
                  form.setValue("description", value)
                }
                category={form.watch("category") || "outros"}
                onCategoryChange={(value) =>
                  form.setValue("category", value as BusinessCategory)
                }
                logoPreview={logoPreview}
                logoRef={logoRef}
                onLogoChange={handleLogoChange}
                uploading={uploading || pendingMediaUploads > 0}
                errors={getErrors()}
                onCancel={() => navigate(businessManagementRoutes.overview(businessId))}
                onNext={handleNextStep1}
              />
              <BusinessSlugSection
                slug={slug}
                onSlugChange={setSlug}
                businessId={businessId}
                originalSlug={originalSlug}
                businessName={form.watch("name") || business?.name || ""}
                isVerifiedOfficial={Boolean(business?.is_verified)}
              />
              <IdentityChangeConfirmDialog {...slugConfirmProps} />
            </>
            )}

            {currentStep === 2 && (
            <ContactStep
              phone={form.watch("phone") || ""}
              onPhoneChange={(value) => form.setValue("phone", value)}
              whatsapp={form.watch("whatsapp") || ""}
              onWhatsappChange={(value) => form.setValue("whatsapp", value)}
              email={form.watch("email") || ""}
              onEmailChange={(value) => form.setValue("email", value)}
              address={form.watch("address") || ""}
              onAddressChange={(value) => form.setValue("address", value)}
              latitude={form.watch("latitude")}
              onLatitudeChange={(value) => form.setValue("latitude", value)}
              longitude={form.watch("longitude")}
              onLongitudeChange={(value) => form.setValue("longitude", value)}
              selectedModos={form.watch("modos_atendimento") || []}
              onModosChange={(value) =>
                form.setValue("modos_atendimento", value)
              }
              errors={getErrors()}
              onBack={() => setCurrentStep(1)}
              onNext={handleNextStep2}
            />
            )}

            {currentStep === 3 && (
            <>
              <ExtrasStep
                category={form.watch("category")}
                capaPreview={capaPreview}
                capaRef={capaRef}
                onCapaChange={handleCapaChange}
                uploading={uploading}
                website={form.watch("website") || ""}
                onWebsiteChange={(value) => form.setValue("website", value)}
                instagram={form.watch("instagram") || ""}
                onInstagramChange={(value) => form.setValue("instagram", value)}
                facebook={form.watch("facebook") || ""}
                onFacebookChange={(value) => form.setValue("facebook", value)}
                selectedPagamentos={form.watch("formas_pagamento") || []}
                onPagamentosChange={(value) =>
                  form.setValue("formas_pagamento", value)
                }
                especialidades={(form.watch("especialidades") || []).join(", ")}
                onEspecialidadesChange={(value) =>
                  form.setValue(
                    "especialidades",
                    value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                facilidades={(form.watch("facilidades") || []).join(", ")}
                onFacilidadesChange={(value) =>
                  form.setValue(
                    "facilidades",
                    value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                saving={saving || pendingMediaUploads > 0}
                onBack={() => setCurrentStep(2)}
                onSave={handleSave}
              />

              {/* Area de cobertura */}
              <div className="mt-6">
                {business.business_data_id ? (
                  <BusinessCoverageSettings
                    businessDataId={business.business_data_id}
                    locationId={business.location_id}
                  />
                ) : (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    A cobertura não pode ser alterada porque os dados canônicos da empresa não foram carregados.
                  </div>
                )}
              </div>
            </>
            )}
          </form>

          <aside className="business-edit-preview" aria-label="Pré-visualização da empresa">
            <div className="business-edit-preview__title">
              <Eye className="h-4 w-4" aria-hidden="true" />
              <div>
                <h2>Pré-visualização</h2>
                <p>Como as informações principais aparecem para o público.</p>
              </div>
            </div>
            <div className="business-edit-preview__card">
              <div className="business-edit-preview__cover">
                {capaPreview ? <img src={capaPreview} alt="" /> : null}
              </div>
              <div className="business-edit-preview__body">
                <span className="business-edit-preview__avatar">
                  {logoPreview ? <img src={logoPreview} alt="" /> : <Building2 aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <p className="business-edit-preview__category">
                    {getBusinessCategoryLabel(form.watch("category") || business.category)}
                  </p>
                  <h3>{form.watch("name") || business.name}</h3>
                </div>
                <p className="business-edit-preview__description">
                  {form.watch("description") || "Adicione uma descrição para apresentar a empresa."}
                </p>
                <div className="business-edit-preview__location">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>{form.watch("address") || business.business_address || "Endereço não informado"}</span>
                </div>
              </div>
            </div>
            <p className="business-edit-preview__note">
              A página pública é atualizada somente depois de salvar as alterações.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
