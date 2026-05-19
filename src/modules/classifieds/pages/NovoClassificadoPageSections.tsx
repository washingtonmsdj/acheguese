import type { ReactNode, RefObject } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Loader2,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import type { Profile } from "@/core/profiles/services/multi-profile/types";
import { CLASSIFIED_FORM_CATEGORIES } from "@/modules/classifieds/constants/categories";
import { CLASSIFIED_FORM_LIMITS } from "@/modules/classifieds/constants/form-limits";
import { getSubcategories, hasSubcategories } from "@/modules/classifieds/constants/subcategories";
import { cn } from "@/shared/utils/cn";
import { getStepAt, STEPS, type StepId } from "./NovoClassificadoSteps";

const CONDITIONS = [
  { id: "novo", label: "Novo", emoji: "✨", description: "Embalagem original" },
  { id: "seminovo", label: "Seminovo", emoji: "👍", description: "Pouco uso" },
  { id: "usado", label: "Usado", emoji: "📦", description: "Bom estado" },
] as const;

export function CreateHeader({
  currentStepIndex,
  completeness,
  onBack,
  onStepClick,
}: {
  currentStepIndex: number;
  completeness: number;
  onBack: () => void;
  onStepClick: (step: StepId) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">
            {getStepAt(currentStepIndex)?.label ?? "Novo anúncio"}
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

      <div className="flex gap-1 px-4 pb-2 max-w-3xl mx-auto overflow-x-auto scrollbar-hide">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
              index === currentStepIndex
                ? "bg-primary text-primary-foreground"
                : index < currentStepIndex
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <step.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{step.number}</span>
          </button>
        ))}
      </div>
    </header>
  );
}

export function InfoStep({
  effectiveProfile,
  titulo,
  description,
  category,
  subcategory,
  condition,
  errors,
  onTituloChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onConditionChange,
}: {
  effectiveProfile: Profile | null | undefined;
  titulo: string;
  description: string;
  category: string;
  subcategory: string;
  condition: string;
  errors: Record<string, string>;
  onTituloChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onConditionChange: (value: string) => void;
}) {
  const availableSubcategories = category ? getSubcategories(category) : [];

  return (
    <div className="space-y-5">
      {effectiveProfile && (
        <ActiveProfileBadge profile={effectiveProfile} action="anunciando como" />
      )}

      <FormField label="Título do Anúncio" error={errors.titulo} counter={`${titulo.length}/${CLASSIFIED_FORM_LIMITS.MAX_TITLE}`} required>
        <Input
          placeholder="Ex: iPhone 15 Pro Max 256GB"
          value={titulo}
          onChange={(event) => onTituloChange(event.target.value)}
          maxLength={CLASSIFIED_FORM_LIMITS.MAX_TITLE}
          className={cn("h-12 text-sm rounded-xl", errors.titulo && "border-destructive")}
        />
      </FormField>

      <FormField label="Descrição" error={errors.description} counter={`${description.length}/${CLASSIFIED_FORM_LIMITS.MAX_DESCRIPTION}`} required>
        <Textarea
          placeholder="Descreva o item: estado, motivo da venda, detalhes relevantes..."
          rows={4}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          maxLength={CLASSIFIED_FORM_LIMITS.MAX_DESCRIPTION}
          className={cn("text-sm rounded-xl resize-none", errors.description && "border-destructive")}
        />
      </FormField>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Categoria <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {CLASSIFIED_FORM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
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
        {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
      </div>

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
                onClick={() => onSubcategoryChange(sub.id)}
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
              onClick={() => onSubcategoryChange("")}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpar subcategoria
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Estado</label>
        <div className="flex gap-2">
          {CONDITIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => onConditionChange(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 p-3 rounded-xl border text-center transition-all",
                condition === item.id
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-foreground hover:border-primary/30"
              )}
            >
              <span className="text-sm">{item.emoji}</span>
              <span className="text-xs font-semibold">{item.label}</span>
              <span className="text-[9px] text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LocationStep({
  hasActiveLocation,
  activeLocationName,
  neighborhood,
  error,
  onNeighborhoodChange,
}: {
  hasActiveLocation: boolean;
  activeLocationName?: string | null;
  neighborhood: string;
  error?: string;
  onNeighborhoodChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
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
              <p className="text-sm font-semibold text-foreground">📍 {activeLocationName}</p>
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
        {hasActiveLocation && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <FormField label="Bairro" optional>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ex: Rio Vermelho"
            value={neighborhood}
            onChange={(event) => onNeighborhoodChange(event.target.value)}
            className="pl-9 h-12 text-sm rounded-xl"
            maxLength={100}
          />
        </div>
      </FormField>
    </div>
  );
}

export function PhotosStep({
  photos,
  photoPreviews,
  fileInputRef,
  uploadingImages,
  uploadProgress,
  onAddPhotos,
  onMovePhoto,
  onRemovePhoto,
}: {
  photos: File[];
  photoPreviews: string[];
  fileInputRef: RefObject<HTMLInputElement>;
  uploadingImages: boolean;
  uploadProgress: Record<string, { progress: number }>;
  onAddPhotos: (files: FileList | File[]) => void;
  onMovePhoto: (from: number, to: number) => void;
  onRemovePhoto: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-primary" />
          Fotos do Anúncio
          <span className="text-muted-foreground font-normal text-xs">
            ({photos.length}/{CLASSIFIED_FORM_LIMITS.MAX_PHOTOS})
          </span>
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        A primeira foto será a capa. Arraste para reordenar.
        {uploadingImages && " Enviando fotos..."}
      </p>

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
        {photoPreviews.map((src, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border border-border group"
          >
            <img src={src} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              {index > 0 && (
                <button
                  onClick={() => onMovePhoto(index, index - 1)}
                  className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center text-foreground"
                  aria-label="Mover para esquerda"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              )}
              {index < photoPreviews.length - 1 && (
                <button
                  onClick={() => onMovePhoto(index, index + 1)}
                  className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center text-foreground"
                  aria-label="Mover para direita"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => onRemovePhoto(index)}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
              aria-label={`Remover foto ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Capa
              </span>
            )}
          </div>
        ))}

        {photos.length < CLASSIFIED_FORM_LIMITS.MAX_PHOTOS && !uploadingImages && (
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
        onChange={(event) => {
          if (event.target.files) onAddPhotos(event.target.files);
        }}
        className="hidden"
        disabled={uploadingImages}
      />
    </div>
  );
}

export function VisibilityStep({
  isActive,
  onActiveChange,
}: {
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
        <div>
          <p className="text-sm font-semibold text-foreground">Anúncio Ativo</p>
          <p className="text-[10px] text-muted-foreground">
            Desative para salvar como rascunho
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={onActiveChange} />
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
  );
}

export function CreateBottomActions({
  currentStep,
  currentStepIndex,
  publishing,
  uploadingImages,
  onEdit,
  onPublish,
  onPrevious,
  onNext,
}: {
  currentStep: StepId;
  currentStepIndex: number;
  publishing: boolean;
  uploadingImages: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-20">
      <div className="max-w-3xl mx-auto">
        {currentStep === "preview" ? (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onEdit}>
              Editar
            </Button>
            <Button
              className="flex-1 h-12 text-base font-semibold rounded-xl shadow-lg"
              onClick={onPublish}
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
              <Button variant="outline" className="h-12 rounded-xl px-5" onClick={onPrevious}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
            <Button className="flex-1 h-12 text-base font-semibold rounded-xl" onClick={onNext}>
              {currentStepIndex === STEPS.length - 2 ? "Revisar" : "Próximo"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  children: ReactNode;
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
        {counter && <span className="text-[10px] text-muted-foreground">{counter}</span>}
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
