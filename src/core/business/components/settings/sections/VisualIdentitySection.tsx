/**
 * VisualIdentitySection
 * 
 * Seção de identidade visual da empresa.
 * Inclui: logo, banner, galeria de fotos.
 */

import { ImageIcon } from "lucide-react";
import { BusinessImageUploader } from "../BusinessImageUploader";

interface VisualIdentity {
  logo_url?: string | null;
  banner_url?: string | null;
  fotos?: string[];
}

interface VisualIdentitySectionProps {
  data: VisualIdentity;
  onChange: (data: VisualIdentity) => void;
  onUpload: (file: File, type: "logo" | "banner" | "gallery") => Promise<string>;
  className?: string;
}

export function VisualIdentitySection({
  data,
  onChange,
  onUpload,
  className,
}: VisualIdentitySectionProps) {
  const handleLogoUpload = async (file: File) => {
    const url = await onUpload(file, "logo");
    onChange({ ...data, logo_url: url });
    return url;
  };

  const handleBannerUpload = async (file: File) => {
    const url = await onUpload(file, "banner");
    onChange({ ...data, banner_url: url });
    return url;
  };

  const handleGalleryUpload = async (file: File) => {
    const url = await onUpload(file, "gallery");
    const newFotos = [...(data.fotos || []), url];
    onChange({ ...data, fotos: newFotos });
    return url;
  };

  const handleRemovePhoto = (index: number) => {
    const newFotos = data.fotos?.filter((_, i) => i !== index) || [];
    onChange({ ...data, fotos: newFotos });
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Identidade Visual
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Logo, banner e fotos da sua empresa
        </p>
      </div>

      <div className="space-y-8">
        {/* Logo */}
        <BusinessImageUploader
          type="logo"
          currentImage={data.logo_url}
          onUpload={handleLogoUpload}
        />

        {/* Banner */}
        <BusinessImageUploader
          type="banner"
          currentImage={data.banner_url}
          onUpload={handleBannerUpload}
        />

        {/* Galeria de Fotos */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Galeria de Fotos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione fotos do ambiente, produtos ou serviços
            </p>
          </div>

          {/* Fotos existentes */}
          {data.fotos && data.fotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.fotos.map((foto, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar nova foto */}
          {(!data.fotos || data.fotos.length < 10) && (
            <BusinessImageUploader
              type="gallery"
              currentImage={null}
              onUpload={handleGalleryUpload}
            />
          )}

          {data.fotos && data.fotos.length >= 10 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600">
              <p className="font-medium">Limite de 10 fotos atingido</p>
              <p className="mt-1 text-amber-600/80">
                Remova uma foto para adicionar outra
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
