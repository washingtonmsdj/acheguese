/**
 * ðŸ† EDITAR EMPRESA PAGE - SSOT Completo
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { useBusinessById } from "@/core/business/hooks/useBusinessById";
import { useBusinessEdit, useBusinessImageUpload } from "@/modules/business/hooks/useBusinessEdit";
import { updateBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import type {
  UpdateBusinessInput,
  BusinessCategory,
  Business,
} from "@/modules/business/types";
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
import { CoverageSettingsForm } from "@/core/geospatial/components/CoverageSettingsForm";

export default function EditarEmpresaPage() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useSessionContext();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  
  // Refs para upload de imagens
  const logoRef = useRef<HTMLInputElement>(null);
  const capaRef = useRef<HTMLInputElement>(null);
  
  // Estados para preview de imagens
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [capaPreview, setCapaPreview] = useState<string>("");

  useEffect(() => {
    setModuleContext('business');
    return () => setModuleContext(null);
  }, [setModuleContext]);

  const {
    business,
    isLoading: loadingBusiness,
    isError,
  } = useBusinessById(profileId);

  const { updateBusiness, isLoading: saving } = useBusinessEdit({
    onSuccess: () => {
      navigate("/conta");
    },
  });
  
  const { mutateAsync: uploadImage, isPending: uploading } = useBusinessImageUpload();
  const uploadBusinessImage = (file: File, folder: "logos" | "banners") =>
    uploadImage({ file, folder });

  const { logAttempt, logSuccess, logError } = useIdentitySaveLogger({
    entityType: 'business',
    entityId: profileId!,
    userId: user!.id,
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
        category: business.category,
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
      
      // Inicializar slug com valor existente ou derivado do nome
      const businessSlug = (business as Business & { slug?: string }).slug;
      if (businessSlug) {
        setSlug(businessSlug);
        setOriginalSlug(businessSlug);
      }
    }
  }, [business, form]);

  useEffect(() => {
    if (!user || !profileId) {
      navigate("/login");
      return;
    }
  }, [user, profileId, navigate]);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. MÃ¡ximo 5MB");
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }
    
    try {
      const url = await uploadBusinessImage(file, "logos");
      form.setValue("logo_url", url);
      setLogoPreview(url);
      toast.success("Logo atualizado!");
    } catch (error) {
      toast.error("Erro ao fazer upload do logo");
      console.error(error);
    }
  };
  
  const handleCapaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. MÃ¡ximo 5MB");
      return;
    }
    
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }
    
    try {
      const url = await uploadBusinessImage(file, "banners");
      form.setValue("banner_url", url);
      setCapaPreview(url);
      toast.success("Capa atualizada!");
    } catch (error) {
      toast.error("Erro ao fazer upload da capa");
      console.error(error);
    }
  };

  const doSave = form.handleSubmit(async (data) => {
    if (!profileId) return;
    
    const hasSlugChange = slug !== originalSlug && originalSlug;
    if (hasSlugChange) {
      logAttempt(originalSlug, slug);
    }
    
    try {
      await updateBusiness({ id: profileId, data: { ...data, slug } });
      if (hasSlugChange) {
        logSuccess(originalSlug, slug);
      }
    } catch (error) {
      if (hasSlugChange) {
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
        logError(originalSlug, slug, (error as Error).message || 'Erro ao salvar', errorCode);
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
    const errors: Record<string, string> = {};
    const formErrors = form.formState.errors;
    for (const key of Object.keys(formErrors)) {
      const err = formErrors[key as keyof typeof formErrors];
      if (err?.message) errors[key] = err.message;
    }
    return errors;
  };

  if (loadingBusiness) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Empresa nÃ£o encontrada</h2>
          <button
            onClick={() => navigate("/conta")}
            className="text-primary hover:underline"
          >
            Voltar ao perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold font-display">Editar Empresa</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <StepProgress currentStep={currentStep} totalSteps={3} />

        {/* Autoria explÃ­cita */}
        {effectiveProfile && (
          <ActiveProfileBadge profile={effectiveProfile} action="editando como" />
        )}

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
                uploading={uploading}
                errors={getErrors()}
                onNext={handleNextStep1}
              />
              <BusinessSlugSection
                slug={slug}
                onSlugChange={setSlug}
                businessId={profileId}
                originalSlug={originalSlug}
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
              schedules={""}
              onSchedulesChange={() => {}}
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
                saving={saving}
                onBack={() => setCurrentStep(2)}
                onSave={handleSave}
              />
              
              {/* Ãrea de Cobertura */}
              <div className="mt-6">
                <CoverageSettingsForm
                  entityType="business"
                  entityId={profileId!}
                  entityLocation={
                    typeof business.address === 'object' && business.address?.latitude && business.address?.longitude
                      ? {
                          latitude: business.address.latitude,
                          longitude: business.address.longitude,
                        }
                      : undefined
                  }
                />
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

