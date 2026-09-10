import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mediaService } from "@/core/media/services/MediaService";
import { useIdentitySaveLogger } from "@/core/public-identity/hooks/useIdentitySaveLogger";
import {
  evaluateProfessionalSlugSafety,
  isProfessionalSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/professionalSlugSafety";
import { PublicIdentityService } from "@/core/public-identity";
import { useSessionContext } from "@/core/session";
import { useToast } from "@/shared/hooks/use-toast";
import { useProfessionalSlugSaveGuard } from "@/modules/professionals/services/components/identity/useProfessionalSlugSaveGuard";
import { useProfessionalById } from "@/modules/professionals/services/hooks/useProfessionalById";
import { useProfessionalEdit } from "@/modules/professionals/services/hooks/useProfessionalEdit";
import { useServiceUrls } from "@/modules/professionals/services/hooks/useServiceUrls";
import { useServiceAreaOptions } from "@/modules/professionals/services/hooks/useServiceAreaOptions";
import { serviceAreasService, useServiceAreas } from "@/core/service-areas";
import {
  buildProfessionalUpdateInput,
  createInitialProfessionalEditForm,
  mapProfessionalToEditForm,
  toggleServiceAreaSelection,
  type ProfessionalEditForm,
  type ProfessionalEditTab,
} from "./EditarServicoPage.model";
import { PROFESSIONAL_EDIT_LIMITS } from "@/modules/professionals/services/constants/professionalEditLimits";
import {
  EditarServicoAvailabilityTab,
  EditarServicoContactTab,
  EditarServicoDetailsTab,
  EditarServicoErrorState,
  EditarServicoHeader,
  EditarServicoInfoTab,
  EditarServicoLoadingState,
  EditarServicoPortfolioTab,
  EditarServicoSaveBar,
  EditarServicoTabNavigation,
} from "./EditarServicoPageSections";

function getErrorDetails(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; code?: unknown };
    return {
      message:
        typeof candidate.message === "string"
          ? candidate.message
          : "Erro ao salvar",
      code: typeof candidate.code === "string" ? candidate.code : undefined,
    };
  }

  return { message: "Erro ao salvar" };
}

export default function EditarServicoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceUrls = useServiceUrls();
  const { toast } = useToast();
  const { user } = useSessionContext();
  const [activeTab, setActiveTab] = useState<ProfessionalEditTab>("info");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [form, setForm] = useState<ProfessionalEditForm>(() =>
    createInitialProfessionalEditForm(),
  );
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");

  const {
    professional,
    loading: loadingProfessional,
    error: loadError,
  } = useProfessionalById({
    id: id || "",
    enabled: !!id,
  });
  const {
    options: serviceAreaOptions,
    isLoading: loadingServiceAreaOptions,
  } = useServiceAreaOptions(professional?.location_id ?? null);

  const canonicalCoverageQuery = useServiceAreas(professional?.profile_id ?? "");
  const canonicalServiceAreas = useMemo(
    () => canonicalCoverageQuery.data ?? [],
    [canonicalCoverageQuery.data],
  );
  const coverageInitializedProfileRef = React.useRef<string | null>(null);

  const { updateProfessional } = useProfessionalEdit();

  const identityEntityId = professional?.professional_data_id ?? "";
  const { logAttempt, logSuccess, logError } = useIdentitySaveLogger({
    entityType: "professional",
    entityId: identityEntityId,
    userId: user?.id ?? "",
    page: "EditarServicoPage",
  });

  useEffect(() => {
    if (!professional || !canonicalCoverageQuery.isFetched) return;
    if (coverageInitializedProfileRef.current === professional.profile_id) return;

    setForm(
      mapProfessionalToEditForm(
        professional,
        canonicalServiceAreas.map((area) => area.location_id),
      ),
    );
    setPhotoPreview(professional.logo_url || null);
    setPortfolioPreviews(professional.portfolio_images || []);

    const savedSlug = professional.slug || "";
    setSlug(savedSlug);
    setOriginalSlug(savedSlug);
    setHasChanges(false);
    coverageInitializedProfileRef.current = professional.profile_id;
  }, [canonicalCoverageQuery.isFetched, canonicalServiceAreas, professional]);

  const updateField = (
    key: keyof ProfessionalEditForm,
    value: string | string[] | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleBairro = (locationId: string) => {
    setForm((prev) => ({
      ...prev,
      serviceAreaLocationIds: toggleServiceAreaSelection(
        prev.serviceAreaLocationIds,
        locationId,
      ),
    }));
    setHasChanges(true);
  };

  const handleSlugChange = (value: string) => {
    setSlug(PublicIdentityService.normalize(value, "professional"));
    setHasChanges(true);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > PROFESSIONAL_EDIT_LIMITS.maxImageBytes) {
      toast({
        title: "Imagem muito grande",
        description: "Máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    setHasChanges(true);

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePortfolioAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentCount = portfolioPreviews.length + portfolioFiles.length;
    const allowedFiles = files.slice(
      0,
      PROFESSIONAL_EDIT_LIMITS.maxPortfolioImages - currentCount,
    );

    if (allowedFiles.length < files.length) {
      toast({
        title: `Máximo ${PROFESSIONAL_EDIT_LIMITS.maxPortfolioImages} imagens no portfólio`,
        variant: "destructive",
      });
    }

    const validFiles = allowedFiles.filter((file) => {
      if (file.size <= PROFESSIONAL_EDIT_LIMITS.maxImageBytes) return true;

      toast({
        title: `${file.name} é muito grande (máx. 5MB)`,
        variant: "destructive",
      });
      return false;
    });

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPortfolioFiles((prev) => [...prev, ...validFiles]);
    setHasChanges(true);
  };

  const removePortfolioImage = (index: number) => {
    const existingCount = (professional?.portfolio_images || []).length;

    if (index >= existingCount) {
      const fileIndex = index - existingCount;
      setPortfolioFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }

    setPortfolioPreviews((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const doSave = async () => {
    if (!user || !id || !professional) return;

    if (!form.name.trim()) {
      toast({ title: "Informe seu nome completo", variant: "destructive" });
      setActiveTab("info");
      return;
    }

    if (!form.category) {
      toast({ title: "Selecione uma categoria", variant: "destructive" });
      setActiveTab("info");
      return;
    }

    if (
      slug &&
      !isProfessionalSlugSafetyBypassAllowed({
        isVerifiedProfessional: Boolean(professional.is_verified),
      })
    ) {
      const slugSafety = evaluateProfessionalSlugSafety({
        professionalName: form.name.trim(),
        slug,
      });
      if (slugSafety.status === "review") {
        toast({
          title:
            "O link público está muito diferente do nome do profissional. Ajuste para manter autenticidade.",
          variant: "destructive",
        });
        setActiveTab("info");
        return;
      }
    }

    const hasSlugChange = !!originalSlug && slug !== originalSlug;
    if (hasSlugChange) {
      logAttempt(originalSlug, slug);
    }

    let professionalUpdated = false;
    setSaving(true);
    try {
      let logoUrl: string | undefined;

      if (photoFile) {
        const result = await mediaService.uploadMediaAsset(
          professional.profile_id,
          photoFile,
          "professional_logo",
        );
        logoUrl = result.reference;
      }

      const newPortfolioUrls: string[] = [];
      for (const file of portfolioFiles) {
        const result = await mediaService.uploadMediaAsset(
          professional.profile_id,
          file,
          "professional_portfolio",
        );
        newPortfolioUrls.push(result.reference);
      }

      const updateData = buildProfessionalUpdateInput({
        form,
        portfolioImages: [
          ...portfolioPreviews.filter((preview) => !preview.startsWith("data:")),
          ...newPortfolioUrls,
        ],
        logoUrl,
        slug,
        shouldUpdateSlug: hasSlugChange,
      });

      await updateProfessional(id, updateData);
      professionalUpdated = true;

      if (hasSlugChange) {
        logSuccess(originalSlug, slug);
        setOriginalSlug(slug);
      }

      setPhotoFile(null);
      setPortfolioFiles([]);

      await serviceAreasService.replaceServiceAreas(
        professional.profile_id,
        form.serviceAreaLocationIds,
      );

      await canonicalCoverageQuery.refetch();
      setHasChanges(false);
      toast({ title: "Perfil profissional atualizado com sucesso!" });
    } catch (err: unknown) {
      const details = getErrorDetails(err);

      if (!professionalUpdated && hasSlugChange) {
        logError(originalSlug, slug, details.message, details.code);
      }

      if (professionalUpdated) {
        toast({
          title: "Dados salvos; cobertura pendente",
          description:
            "Os dados do perfil foram atualizados, mas os bairros não foram salvos. Tente salvar novamente para concluir a cobertura.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: details.message,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const { triggerSave: handleSave, confirmProps: slugConfirmProps } =
    useProfessionalSlugSaveGuard({
      slug,
      originalSlug,
      onSave: doSave,
    });

  if (
    loadingProfessional ||
    (professional && !canonicalCoverageQuery.isFetched)
  ) {
    return <EditarServicoLoadingState />;
  }

  if (loadError || !professional) {
    return (
      <EditarServicoErrorState
        message={loadError?.message || "Profissional não encontrado"}
        onBackToServices={() => navigate(serviceUrls.list)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <EditarServicoHeader hasChanges={hasChanges} onBack={() => navigate(-1)} />
      <EditarServicoTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        {activeTab === "info" && (
          <EditarServicoInfoTab
            form={form}
            originalSlug={originalSlug}
            photoPreview={photoPreview}
            professionalId={professional.professional_data_id}
            isVerifiedProfessional={Boolean(professional.is_verified)}
            slug={slug}
            slugConfirmProps={slugConfirmProps}
            onFieldChange={updateField}
            onPhotoChange={handlePhotoChange}
            onSlugChange={handleSlugChange}
          />
        )}

        {activeTab === "details" && (
          <EditarServicoDetailsTab
            form={form}
            serviceAreaOptions={serviceAreaOptions}
            canonicalServiceAreas={canonicalServiceAreas}
            loadingServiceAreaOptions={
              loadingServiceAreaOptions || canonicalCoverageQuery.isFetching
            }
            onFieldChange={updateField}
            onToggleServiceArea={toggleBairro}
          />
        )}

        {activeTab === "contact" && (
          <EditarServicoContactTab form={form} onFieldChange={updateField} />
        )}

        {activeTab === "portfolio" && (
          <EditarServicoPortfolioTab
            portfolioPreviews={portfolioPreviews}
            onPortfolioAdd={handlePortfolioAdd}
            onRemovePortfolioImage={removePortfolioImage}
          />
        )}

        {activeTab === "availability" && (
          <EditarServicoAvailabilityTab
            form={form}
            onDeactivateProfile={() => {
              updateField("isAcceptingClients", false);
              toast({
                title: "Perfil marcado como inativo. Salve para confirmar.",
              });
            }}
            onFieldChange={updateField}
          />
        )}
      </div>

      <EditarServicoSaveBar
        saving={saving}
        hasChanges={hasChanges}
        onCancel={() => navigate(-1)}
        onSave={handleSave}
      />
    </div>
  );
}
