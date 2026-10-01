import { Loader2 } from "lucide-react";

interface BusinessPhotoMutationStatusProps {
  uploading: boolean;
}

export function BusinessPhotoMutationStatus({
  uploading,
}: BusinessPhotoMutationStatusProps) {
  return (
    <p className="business-photo-status" role="status">
      <Loader2 className="animate-spin" aria-hidden="true" />
      {uploading ? "Enviando fotos…" : "Salvando alterações…"}
    </p>
  );
}
