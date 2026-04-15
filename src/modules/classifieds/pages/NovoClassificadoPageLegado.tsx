import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useNovoClassificado } from "@/modules/classifieds/hooks/useNovoClassificado";
import { ClassificadoHeader } from "@/modules/classifieds/components/ClassificadoHeader";
import { PhotoUploader } from "@/modules/classifieds/components/PhotoUploader";
import { ClassificadoForm } from "@/modules/classifieds/components/ClassificadoForm";
import { CategorySelector } from "@/modules/classifieds/components/CategorySelector";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";

export default function NovoClassificadoPage() {
  const hookResult = useNovoClassificado();
  const { effectiveProfile } = useMultiProfileContext();

  // Handle authentication redirect
  if (!hookResult) return null;

  const {
    // Form data
    titulo,
    setTitulo,
    description,
    setDescricao,
    price,
    setPreco,
    category,
    setCategoria,
    neighborhood,
    setBairro,

    // Photos
    photos,
    photoPreviews,
    fileInputRef,
    handleAddPhotos,
    removePhoto,

    // State
    publishing,
    errors,

    // Actions
    handlePublish,
  } = hookResult;

  return (
    <div className="flex flex-col">
      <ClassificadoHeader />

      <div className="px-4 py-4 space-y-5 pb-8">
        {/* Autoria explícita */}
        {effectiveProfile && (
          <ActiveProfileBadge profile={effectiveProfile} action="anunciando como" />
        )}
        <PhotoUploader
          photos={photos}
          photoPreviews={photoPreviews}
          fileInputRef={fileInputRef}
          onAddPhotos={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) handleAddPhotos(e.target.files);
          }}
          onRemovePhoto={removePhoto}
          error={errors.photos}
        />

        <ClassificadoForm
          titulo={titulo}
          onTituloChange={setTitulo}
          description={description}
          onDescriptionChange={setDescricao}
          price={price}
          onPriceChange={setPreco}
          neighborhood={neighborhood}
          onNeighborhoodChange={setBairro}
          errors={errors}
        />

        <CategorySelector
          category={category}
          onCategoryChange={setCategoria}
          error={errors.category}
        />

        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
          onClick={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar Anúncio"
          )}
        </Button>
      </div>
    </div>
  );
}
