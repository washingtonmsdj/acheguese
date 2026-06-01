import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { useToast } from "@/shared/hooks/use-toast";
import { mediaService } from "@/core/media/services/MediaService";
import { useSessionContext } from "@/core/session";
import { servicesLocationService } from "@/modules/professionals/services/services/ServicesLocationService";
import { useProfessionalProfileCreate } from "@/modules/professionals/services/hooks/useProfessionalProfileCreate";
import { PublicIdentityService } from "@/core/public-identity";
import { evaluateProfessionalSlugSafety } from "@/core/public-identity/domain/professionalSlugSafety";
import { logger } from "@/shared/utils/logger";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import {
  CadastrarServicoHeader,
  CadastrarServicoNavigation,
  CadastrarServicoStepIndicator,
} from "./CadastrarServicoChrome";
import { CadastrarServicoReview } from "./CadastrarServicoReview";
import {
  CadastrarServicoContactStep,
  CadastrarServicoDetailsStep,
  CadastrarServicoInfoStep,
} from "./CadastrarServicoSteps";
import {
  INITIAL_SERVICE_FORM,
  STEP_ORDER,
  parseCertifications,
  type ProfessionalServiceFormState,
  type Step,
} from "./CadastrarServicoPage.model";
import { useServiceAreaOptions } from "@/modules/professionals/services/hooks/useServiceAreaOptions";
import type { ProfessionalCategory } from "@/core/professional/types";

export default function CadastrarServicoPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const { toast } = useToast();
  const { user } = useSessionContext();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const {
    options: serviceAreaOptions,
    city: serviceAreaCity,
    isLoading: loadingServiceAreaOptions,
    isUnavailable: serviceAreaOptionsUnavailable,
  } = useServiceAreaOptions();
  const [step, setStep] = useState<Step>("info");

  // Definir contexto professional ao montar, limpar ao desmontar
  useEffect(() => {
    setModuleContext('professional');
    return () => setModuleContext(null);
  }, [setModuleContext]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { createProfessional, isLoading: loading } = useProfessionalProfileCreate({
    onSuccess: (result) => {
      // ✅ Professional não usa /u/:username
      // Redirecionar para página de sucesso ou listagem de serviços
      toast({
        title: "Serviço cadastrado com sucesso!",
        description: "Seu perfil profissional está ativo.",
      });
      navigate('/servicos');
    },
  });

  const [form, setForm] =
    useState<ProfessionalServiceFormState>(INITIAL_SERVICE_FORM);

  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const updateField = (
    key: keyof ProfessionalServiceFormState,
    value: string | string[],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Auto-sugerir slug a partir do nome
    if (key === 'name' && !slugManuallyEdited) {
      setSlug(PublicIdentityService.normalize(value as string, 'professional'));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(PublicIdentityService.normalize(value, "professional"));
    setSlugManuallyEdited(true);
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Imagem muito grande",
          description: "Máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleBairro = (bairro: string) => {
    setForm((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(bairro)
        ? prev.serviceAreas.filter((b) => b !== bairro)
        : [...prev.serviceAreas, bairro],
    }));
  };

  const validateStep = (s: Step): string | null => {
    switch (s) {
      case "info":
        if (!form.name.trim()) return "Informe seu nome completo";
        if (form.name.trim().length < 2)
          return "Nome deve ter pelo menos 2 caracteres";
        if (!form.category) return "Selecione uma categoria";
        if (!form.subcategory.trim()) return "Informe o título do serviço";
        if (slug.trim()) {
          const slugSafety = evaluateProfessionalSlugSafety({
            professionalName: form.name.trim(),
            slug: slug.trim(),
          });
          if (slugSafety.status === "review") {
            return "O link público está muito diferente do nome. Ajuste o link para manter autenticidade.";
          }
        }
        return null;
      case "details":
        if (serviceAreaOptions.length === 0)
          return "Defina uma cidade ou bairro com áreas cadastradas antes de avançar";
        if (form.serviceAreas.length === 0)
          return "Selecione pelo menos um bairro";
        return null;
      case "contact":
        if (!form.phone.trim() && !form.whatsapp.trim())
          return "Informe pelo menos um telefone ou WhatsApp";
        return null;
      default:
        return null;
    }
  };

  const goToStep = (target: Step) => {
    const currentIdx = STEP_ORDER.indexOf(step);
    const targetIdx = STEP_ORDER.indexOf(target);

    // Allow going back freely
    if (targetIdx < currentIdx) {
      setStep(target);
      return;
    }

    // Validate current step before advancing
    for (let i = currentIdx; i < targetIdx; i++) {
      const currentStep = STEP_ORDER.at(i);
      if (!currentStep) {
        continue;
      }
      const err = validateStep(currentStep);
      if (err) {
        toast({ title: err, variant: "destructive" });
        setStep(currentStep);
        return;
      }
    }
    setStep(target);
  };

  const handleNext = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[idx + 1]);
    }
  };

  const handleBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
    else navigate(-1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Faça login para cadastrar", variant: "destructive" });
      navigate(appUrls.auth.login); // ✅ SSOT
      return;
    }

    // Final validation
    for (const s of ["info", "details", "contact"] as Step[]) {
      const err = validateStep(s);
      if (err) {
        toast({ title: err, variant: "destructive" });
        setStep(s);
        return;
      }
    }

    try {
      let logoUrl: string | undefined;

      // Upload logo usando MediaService
      if (photoFile) {
        const result = await mediaService.uploadProfessionalImage(
          user.id,
          photoFile,
          "logo",
        );
        logoUrl = result.url;
      }

      const certsArray = parseCertifications(form.certifications);

      // Criar perfil professional via MultiProfileService
      createProfessional({
        name: form.name.trim(),
        slug: slug.trim() || undefined,
        category: form.category as ProfessionalCategory,
        subcategory: form.subcategory.trim(),
        description: form.description.trim(),
        phone: form.phone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        service_areas: form.serviceAreas,
        available_hours: form.availableHours
          ? { schedule: form.availableHours }
          : undefined,
        price_range: form.priceRange.trim() || undefined,
        experience_years: form.experienceYears
          ? parseInt(form.experienceYears)
          : undefined,
        education: form.education.trim() || undefined,
        certifications: certsArray.length > 0 ? certsArray : undefined,
        instagram: form.instagram.trim() || undefined,
        website: form.website.trim() || undefined,
        logo_url: logoUrl,
        location_id: servicesLocationService.getActiveLocationId() ?? undefined,
        city: servicesLocationService.getActiveLocationName() ?? "",
        neighborhood: form.serviceAreas[0] || "",
      });
    } catch (err: any) {
      logger.error("Error creating professional:", err);
      toast({
        title: "Erro ao cadastrar",
        description: err.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col pb-24">
      <CadastrarServicoHeader step={step} onBack={handleBack} />
      <CadastrarServicoStepIndicator
        step={step}
        effectiveProfile={effectiveProfile}
        onStepChange={goToStep}
      />

      <div className="px-4 py-4 space-y-4">
        {step === "info" && (
          <CadastrarServicoInfoStep
            form={form}
            photoPreview={photoPreview}
            slug={slug}
            onPhotoChange={handlePhotoChange}
            onSlugChange={handleSlugChange}
            onUpdateField={updateField}
          />
        )}

        {step === "details" && (
          <CadastrarServicoDetailsStep
            form={form}
            serviceAreaOptions={serviceAreaOptions}
            serviceAreaCityName={serviceAreaCity?.name ?? null}
            isLoadingServiceAreaOptions={loadingServiceAreaOptions}
            serviceAreaOptionsUnavailable={serviceAreaOptionsUnavailable}
            onToggleArea={toggleBairro}
            onUpdateField={updateField}
          />
        )}

        {step === "contact" && (
          <CadastrarServicoContactStep form={form} onUpdateField={updateField} />
        )}

        {step === "review" && (
          <CadastrarServicoReview form={form} photoPreview={photoPreview} />
        )}

        <CadastrarServicoNavigation
          step={step}
          loading={loading}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
