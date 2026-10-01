import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { businessGalleryService } from "@/core/business/services/BusinessGalleryService";

const key = (businessDataId?: string) => ["business-gallery-management", businessDataId] as const;

export function useBusinessGallery(businessDataId?: string, ownerProfileId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: key(businessDataId),
    queryFn: () => businessGalleryService.list(businessDataId!),
    enabled: Boolean(businessDataId),
    staleTime: 30_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key(businessDataId) });

  const upload = useMutation({
    mutationFn: (files: File[]) => businessGalleryService.upload(
      ownerProfileId!, businessDataId!, files, query.data?.length ?? 0,
    ),
    onSuccess: () => {
      toast.success("Fotos adicionadas à galeria.");
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível adicionar as fotos."),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (photoId: string) => businessGalleryService.remove(businessDataId!, photoId),
    onSuccess: () => {
      toast.success("Foto removida.");
    },
    onError: () => toast.error("Não foi possível remover a foto."),
    onSettled: refresh,
  });
  const feature = useMutation({
    mutationFn: (photoId: string) => businessGalleryService.setFeatured(businessDataId!, photoId),
    onSuccess: () => {
      toast.success("Foto de capa atualizada.");
    },
    onError: () => toast.error("Não foi possível definir a foto de capa."),
    onSettled: refresh,
  });
  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => businessGalleryService.reorder(businessDataId!, orderedIds),
    onError: () => toast.error("Não foi possível reordenar as fotos."),
    onSettled: refresh,
  });

  return { query, upload, remove, feature, reorder, maxPhotos: businessGalleryService.maxPhotos };
}
