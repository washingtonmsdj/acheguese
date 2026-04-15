/**
 * ✏️ NOVO CLASSIFICADO PAGE — Criação Completa Multi-Step
 *
 * ✅ 8 seções: Info, Preço, Localização, Fotos, Detalhes, Contato, Visibilidade, Preview
 * ✅ SSOT — categorias, tipos de preço, campos dinâmicos de constants/
 * ✅ Service layer — zero lógica de negócio no componente
 * ✅ Responsivo mobile-first + desktop
 * ✅ Design system tokens
 */

import React, { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  X,
  MapPin,
  Tag,
  FileText,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Sparkles,
  Settings2,
  Phone,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { createClassified } from "@/modules/classifieds/services";
import { useClassifiedsLocation } from "@/modules/classifieds/hooks/useClassifiedsLocation";
import { useClassifiedImageUpload } from "@/modules/classifieds/hooks/useClassifiedImageUpload";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { CLASSIFIED_FORM_CATEGORIES } from "@/modules/classifieds/constants/categories";
import { getSubcategories, hasSubcategories } from "@/modules/classifieds/constants/subcategories";
import { PriceStep } from "@/modules/classifieds/components/create/PriceStep";
import { CategoryFieldsStep } from "@/modules/classifieds/components/create/CategoryFieldsStep";
import { ContactStep } from "@/modules/classifieds/components/create/ContactStep";
import { PreviewStep } from "@/modules/classifieds/components/create/PreviewStep";

// ─── Constants ────────────────────────────────────────────────

const CONDITIONS = [
  { id: "novo", label: "Novo", emoji: "✨", description: "Embalagem original" },
  { id: "seminovo", label: "Seminovo", emoji: "👍", description: "Pouco uso" },
  { id: "usado", label: "Usado", emoji: "📦", description: "Bom estado" },
] as const;

const STEPS = [
  { id: "info", label: "Informações", icon: FileText, number: 1 },
  { id: "price", label: "Preço", icon: Tag, number: 2 },
  { id: "location", label: "Localização", icon: MapPin, number: 3 },
  { id: "photos", label: "Fotos", icon: Camera, number: 4 },
  { id: "details", label: "Detalhes", icon: Settings2, number: 5 },
  { id: "contact", label: "Contato", icon: Phone, number: 6 },
  { id: "visibility", label: "Visibilidade", icon: Shield, number: 7 },
  { id: "preview", label: "Revisão", icon: Eye, number: 8 },
] as const;

type StepId = typeof STEPS[number]["id"];

const MAX_PHOTOS = 10;
const MAX_TITLE = 100;
const MAX_DESCRIPTION = 2000;

// ─── Page ─────────────────────────────────────────────────────

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
      const fileArray = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
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
    if (nextIdx < STEPS.length) {
      setCurrentStep(STEPS[nextIdx].id);
    }
  }, [currentStep, currentStepIndex, validateStep]);

  const goPrev = useCallback(() => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(STEPS[prevIdx].id);
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

  // Subcategorias disponíveis
  const availableSubcategories = useMemo(() => {
    return category ? getSubcategories(category) : [];
  }, [category]);

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
      console.error("Erro ao publicar:", error);
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
      {/* ─── Header ────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {STEPS[currentStepIndex].label}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Passo {currentStepIndex + 1} de {STEPS.length} · {completeness}% preenchido
            </p>
          </div>
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${completeness}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 px-4 pb-2 max-w-3xl mx-auto overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToStep(s.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
                i === currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : i < currentStepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.number}</span>
            </button>
          ))}
        </div>
      </header>

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
            <div className="space-y-5">
              {effectiveProfile && (
                <ActiveProfileBadge profile={effectiveProfile} action="anunciando como" />
              )}

              {/* Título */}
              <FormField label="Título do Anúncio" error={errors.titulo} counter={`${titulo.length}/${MAX_TITLE}`} required>
                <Input
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={MAX_TITLE}
                  className={cn("h-12 text-sm rounded-xl", errors.titulo && "border-destructive")}
                />
              </FormField>

              {/* Descrição */}
              <FormField label="Descrição" error={errors.description} counter={`${description.length}/${MAX_DESCRIPTION}`} required>
                <Textarea
                  placeholder="Descreva o item: estado, motivo da venda, detalhes relevantes..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESCRIPTION}
                  className={cn("text-sm rounded-xl resize-none", errors.description && "border-destructive")}
                />
              </FormField>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Categoria <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CLASSIFIED_FORM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setSubcategory("");
                        setDetails({});
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all",
                        category === cat.id
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-card border-border text-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Subcategoria (dinâmica) */}
              {category && hasSubcategories(category) && availableSubcategories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Subcategoria
                    <span className="text-muted-foreground font-normal text-xs ml-1">(opcional)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSubcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSubcategory(sub.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
                          subcategory === sub.id
                            ? "bg-primary/10 border-primary text-primary shadow-sm"
                            : "bg-card border-border text-foreground hover:border-primary/30"
                        )}
                      >
                        {sub.emoji && <span className="text-base">{sub.emoji}</span>}
                        <span className="text-[11px] font-semibold leading-tight flex-1">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                  {subcategory && (
                    <button
                      onClick={() => setSubcategory("")}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Limpar subcategoria
                    </button>
                  )}
                </div>
              )}

              {/* Condição */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Estado</label>
                <div className="flex gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCondition(c.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-0.5 p-3 rounded-xl border text-center transition-all",
                        condition === c.id
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card border-border text-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="text-sm">{c.emoji}</span>
                      <span className="text-xs font-semibold">{c.label}</span>
                      <span className="text-[9px] text-muted-foreground">{c.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preço */}
          {currentStep === "price" && (
            <PriceStep
              priceType={priceType}
              onPriceTypeChange={setPriceType}
              price={price}
              onPriceChange={setPrice}
              error={errors.price}
            />
          )}

          {/* STEP 3: Localização */}
          {currentStep === "location" && (
            <div className="space-y-4">
              {/* Location status */}
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border",
                  hasActiveLocation
                    ? "bg-primary/5 border-primary/20"
                    : "bg-destructive/5 border-destructive/20"
                )}
              >
                <MapPin
                  className={cn(
                    "h-5 w-5 shrink-0",
                    hasActiveLocation ? "text-primary" : "text-destructive"
                  )}
                />
                <div className="flex-1">
                  {hasActiveLocation ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        📍 {activeLocationName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Localização ativa — seu anúncio aparecerá nesta região
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-destructive">
                        Nenhuma localização ativa
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Selecione uma comunidade/cidade para publicar seu anúncio
                      </p>
                    </>
                  )}
                </div>
                {hasActiveLocation && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>

              {errors.location && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{errors.location}</p>
                </div>
              )}

              {/* Bairro complementar */}
              <FormField label="Bairro" optional>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: Rio Vermelho"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="pl-9 h-12 text-sm rounded-xl"
                    maxLength={100}
                  />
                </div>
              </FormField>
            </div>
          )}

          {/* STEP 4: Fotos */}
          {currentStep === "photos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-primary" />
                  Fotos do Anúncio
                  <span className="text-muted-foreground font-normal text-xs">
                    ({photos.length}/{MAX_PHOTOS})
                  </span>
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                A primeira foto será a capa. Arraste para reordenar.
                {uploadingImages && " Enviando fotos..."}
              </p>

              {/* Progress indicators */}
              {uploadingImages && Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground truncate flex-1">{fileName}</span>
                        <span className="text-primary font-medium ml-2">{progress.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photoPreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                  >
                    <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      {i > 0 && (
                        <button
                          onClick={() => movePhoto(i, i - 1)}
                          className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center text-foreground"
                          aria-label="Mover para esquerda"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {i < photoPreviews.length - 1 && (
                        <button
                          onClick={() => movePhoto(i, i + 1)}
                          className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center text-foreground"
                          aria-label="Mover para direita"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                      aria-label={`Remover foto ${i + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Capa
                      </span>
                    )}
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && !uploadingImages && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:border-primary hover:text-primary"
                    aria-label="Adicionar foto"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Adicionar</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) handleAddPhotos(e.target.files);
                }}
                className="hidden"
                disabled={uploadingImages}
              />
            </div>
          )}

          {/* STEP 5: Detalhes Dinâmicos */}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">Anúncio Ativo</p>
                  <p className="text-[10px] text-muted-foreground">
                    Desative para salvar como rascunho
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="p-4 rounded-xl bg-accent/30 border border-accent/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Destaque Premium</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Destaque seu anúncio no topo dos resultados para mais visibilidade.
                </p>
                <Button variant="outline" size="sm" className="rounded-xl text-xs" disabled>
                  Em breve
                </Button>
              </div>
            </div>
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

      {/* ─── Fixed Bottom Actions ──────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-20">
        <div className="max-w-3xl mx-auto">
          {currentStep === "preview" ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setCurrentStep("info")}
              >
                Editar
              </Button>
              <Button
                className="flex-1 h-12 text-base font-semibold rounded-xl shadow-lg"
                onClick={handlePublish}
                disabled={publishing || uploadingImages}
              >
                {publishing || uploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingImages ? "Enviando fotos..." : "Publicando..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Publicar Anúncio
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  className="h-12 rounded-xl px-5"
                  onClick={goPrev}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
              <Button
                className="flex-1 h-12 text-base font-semibold rounded-xl"
                onClick={goNext}
              >
                {currentStepIndex === STEPS.length - 2 ? "Revisar" : "Próximo"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable Form Field ──────────────────────────────────────

function FormField({
  label,
  error,
  counter,
  optional,
  required,
  children,
}: {
  label: string;
  error?: string;
  counter?: string;
  optional?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
          {optional && (
            <span className="text-muted-foreground font-normal text-xs ml-1">(opcional)</span>
          )}
        </label>
        {counter && (
          <span className="text-[10px] text-muted-foreground">{counter}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
