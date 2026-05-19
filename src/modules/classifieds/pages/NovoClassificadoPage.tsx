/**
 * ✏️ NOVO CLASSIFICADO PAGE — Criação Completa Multi-Step
 *
 * ✅ 8 seções: Info, Preço, Localização, Fotos, Detalhes, Contato, Visibilidade, Preview
 * ✅ SSOT — categorias, tipos de preço, campos dinâmicos de constants/
 * ✅ Service layer — zero lógica de negócio no componente
 * ✅ Responsivo mobile-first + desktop
 * ✅ Design system tokens
 */
import { logger } from '@/shared/utils/logger';
import React, { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { createClassified } from "@/modules/classifieds/services";
import { useClassifiedsLocation } from "@/modules/classifieds/hooks/useClassifiedsLocation";
import { useClassifiedImageUpload } from "@/modules/classifieds/hooks/useClassifiedImageUpload";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { CLASSIFIED_FORM_LIMITS } from "@/modules/classifieds/constants/form-limits";
import { PriceStep } from "@/modules/classifieds/components/create/PriceStep";
import { CategoryFieldsStep } from "@/modules/classifieds/components/create/CategoryFieldsStep";
import { ContactStep } from "@/modules/classifieds/components/create/ContactStep";
import { PreviewStep } from "@/modules/classifieds/components/create/PreviewStep";
import {
  CreateBottomActions,
  CreateHeader,
  InfoStep,
  LocationStep,
  PhotosStep,
  VisibilityStep,
} from "./NovoClassificadoPageSections";
import { getStepAt, STEPS, type StepId } from "./NovoClassificadoSteps";
// ??? Page ?????????????????????????????????????????????????????

export default function NovoClassificadoPage() {
  const { activeProfile } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const {
    hasActiveLocation,
    activeLocationId,
    activeLocationName,
    validateLocationId,
  } = useClassifiedsLocation();

  const {
    uploadMultipleImages,
    uploading: uploadingImages,
    progress: uploadProgress,
  } = useClassifiedImageUpload();

  // Form state
  const [titulo, setTitulo] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("fixo");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [condition, setCondition] = useState("usado");
  const [neighborhood, setNeighborhood] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [currentStep, setCurrentStep] = useState<StepId>("info");
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // ─── Photo handlers ─────────────────────────────

  const handleAddPhotos = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, CLASSIFIED_FORM_LIMITS.MAX_PHOTOS - photos.length);
      if (fileArray.length === 0) return;

      // Adicionar previews locais imediatamente
      setPhotos((prev) => [...prev, ...fileArray]);
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          setPhotoPreviews((prev) => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
      });
    },
    [photos.length]
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const movePhoto = useCallback((from: number, to: number) => {
    setPhotos((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setPhotoPreviews((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  // ─── Detail change ──────────────────────────────

  const handleDetailChange = useCallback((key: string, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Step validation ────────────────────────────

  const validateStep = useCallback(
    (step: StepId): boolean => {
      const newErrors: Record<string, string> = {};

      switch (step) {
        case "info":
          if (!titulo.trim()) newErrors.titulo = "Título obrigatório";
          else if (titulo.trim().length < 5) newErrors.titulo = "Mínimo 5 caracteres";
          if (!description.trim()) newErrors.description = "Descrição obrigatória";
          else if (description.trim().length < 10) newErrors.description = "Mínimo 10 caracteres";
          if (!category) newErrors.category = "Selecione uma categoria";
          break;
        case "price":
          if (priceType === "fixo" || priceType === "negociavel") {
            if (!price) newErrors.price = "Informe o valor";
            else if (parseFloat(price) <= 0) newErrors.price = "Valor deve ser maior que 0";
          }
          break;
        case "location":
          if (!hasActiveLocation) {
            newErrors.location = "Selecione uma localização ativa no sistema";
          }
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [titulo, description, category, price, priceType, hasActiveLocation]
  );

  // ─── Navigation ─────────────────────────────────

  const goNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    const nextIdx = currentStepIndex + 1;
    const nextStep = getStepAt(nextIdx);
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  }, [currentStep, currentStepIndex, validateStep]);

  const goPrev = useCallback(() => {
    const prevIdx = currentStepIndex - 1;
    const prevStep = getStepAt(prevIdx);
    if (prevStep) {
      setCurrentStep(prevStep.id);
    } else {
      navigate(-1);
    }
  }, [currentStepIndex, navigate]);

  const goToStep = useCallback(
    (step: StepId) => {
      const targetIdx = STEPS.findIndex((s) => s.id === step);
      // Allow going back freely, forward only if current validates
      if (targetIdx < currentStepIndex) {
        setCurrentStep(step);
      } else if (validateStep(currentStep)) {
        setCurrentStep(step);
      }
    },
    [currentStepIndex, currentStep, validateStep]
  );

  // ─── Completeness ───────────────────────────────

  const completeness = useMemo(() => {
    let filled = 0;
    const total = 7;
    if (titulo.trim()) filled++;
    if (description.trim()) filled++;
    if (category) filled++;
    if (price || priceType === "gratis" || priceType === "sob_consulta") filled++;
    if (hasActiveLocation) filled++;
    if (photos.length > 0) filled++;
    if (contactWhatsapp || contactPhone) filled++;
    return Math.round((filled / total) * 100);
  }, [titulo, description, category, price, priceType, hasActiveLocation, photos, contactWhatsapp, contactPhone]);


  // ─── Submit ─────────────────────────────────────

  const handlePublish = useCallback(async () => {
    // Final validation
    if (!titulo.trim() || !description.trim() || !category) {
      toast.error("Preencha todos os campos obrigatórios");
      setCurrentStep("info");
      return;
    }

    if (activeLocationId) {
      const valid = await validateLocationId(activeLocationId);
      if (!valid) {
        toast.error("Localização inválida");
        setCurrentStep("location");
        return;
      }
    }

    setPublishing(true);
    try {
      // 1. Upload das fotos (se houver)
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        toast.info("Enviando fotos...");
        const uploadedImages = await uploadMultipleImages(photos);
        photoUrls = uploadedImages.map((img) => img.url);
      }

      // 2. Criar anúncio
      const finalPrice =
        priceType === "gratis" ? 0 : priceType === "sob_consulta" ? 0 : parseFloat(price);

      await createClassified(activeProfile.id, {
        title: titulo.trim(),
        description: description.trim(),
        price: finalPrice,
        category,
        condition,
        photos: photoUrls,
        neighborhood: neighborhood.trim(),
        location_id: activeLocationId ?? undefined,
      });

      toast.success("Anúncio publicado com sucesso! 🎉");
      navigate(appUrls.classifieds.list);
    } catch (error) {
      logger.error("Erro ao publicar:", error);
      toast.error("Erro ao publicar anúncio. Tente novamente.");
    } finally {
      setPublishing(false);
    }
  }, [
    titulo,
    description,
    price,
    priceType,
    category,
    condition,
    neighborhood,
    photos,
    activeProfile,
    activeLocationId,
    validateLocationId,
    uploadMultipleImages,
    navigate,
    appUrls,
  ]);

  // Redirect if no profile
  React.useEffect(() => {
    if (!activeProfile) {
      navigate(appUrls.auth.login);
    }
  }, [activeProfile, navigate, appUrls]);

  if (!activeProfile) {
    return null;
  }

  // ─── Render ─────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full bg-background">
      <CreateHeader
        currentStepIndex={currentStepIndex}
        completeness={completeness}
        onBack={goPrev}
        onStepClick={goToStep}
      />

      {/* ─── Step Content ──────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 py-5 pb-28 max-w-3xl mx-auto w-full"
        >
          {/* STEP 1: Info */}
          {currentStep === "info" && (
            <InfoStep
              effectiveProfile={effectiveProfile}
              titulo={titulo}
              description={description}
              category={category}
              subcategory={subcategory}
              condition={condition}
              errors={errors}
              onTituloChange={setTitulo}
              onDescriptionChange={setDescription}
              onCategoryChange={(nextCategory) => {
                setCategory(nextCategory);
                setSubcategory("");
                setDetails({});
              }}
              onSubcategoryChange={setSubcategory}
              onConditionChange={setCondition}
            />
          )}

          {/* STEP 2: Pre?o */}
          {currentStep === "price" && (
            <PriceStep
              priceType={priceType}
              onPriceTypeChange={setPriceType}
              price={price}
              onPriceChange={setPrice}
              error={errors.price}
            />
          )}

          {/* STEP 3: Localiza??o */}
          {currentStep === "location" && (
            <LocationStep
              hasActiveLocation={hasActiveLocation}
              activeLocationName={activeLocationName}
              neighborhood={neighborhood}
              error={errors.location}
              onNeighborhoodChange={setNeighborhood}
            />
          )}

          {/* STEP 4: Fotos */}
          {currentStep === "photos" && (
            <PhotosStep
              photos={photos}
              photoPreviews={photoPreviews}
              fileInputRef={fileInputRef}
              uploadingImages={uploadingImages}
              uploadProgress={uploadProgress}
              onAddPhotos={handleAddPhotos}
              onMovePhoto={movePhoto}
              onRemovePhoto={removePhoto}
            />
          )}

          {/* STEP 5: Detalhes Din?micos */}
          {currentStep === "details" && (
            <CategoryFieldsStep
              category={category}
              details={details}
              onChange={handleDetailChange}
            />
          )}

          {/* STEP 6: Contato */}
          {currentStep === "contact" && (
            <ContactStep
              phone={contactPhone}
              onPhoneChange={setContactPhone}
              whatsapp={contactWhatsapp}
              onWhatsappChange={setContactWhatsapp}
              showPhone={showPhone}
              onShowPhoneChange={setShowPhone}
            />
          )}

          {/* STEP 7: Visibilidade */}
          {currentStep === "visibility" && (
            <VisibilityStep isActive={isActive} onActiveChange={setIsActive} />
          )}

          {/* STEP 8: Preview */}
          {currentStep === "preview" && (
            <PreviewStep
              titulo={titulo}
              description={description}
              price={price}
              priceType={priceType}
              category={category}
              subcategory={subcategory}
              condition={condition}
              locationName={activeLocationName || ""}
              neighborhood={neighborhood}
              photoPreviews={photoPreviews}
              details={details}
              phone={contactPhone}
              whatsapp={contactWhatsapp}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <CreateBottomActions
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        publishing={publishing}
        uploadingImages={uploadingImages}
        onEdit={() => setCurrentStep("info")}
        onPublish={handlePublish}
        onPrevious={goPrev}
        onNext={goNext}
      />
    </div>
  );
}
