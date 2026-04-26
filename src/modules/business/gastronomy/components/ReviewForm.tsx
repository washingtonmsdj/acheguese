/**
 * ReviewForm — Formulário para criar/editar avaliação
 *
 * Upload de fotos via MediaService (Supabase Storage) — SSOT de mídia.
 */

import { useRef, useState } from 'react';
import { Loader2, Star, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { mediaService } from '@/core/media/services/MediaService';
import { useSessionContext } from '@/core/session';
import { REVIEW_MAX_PHOTOS } from '../constants/ui-limits';

const RATING_LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'] as const;

interface ReviewFormProps {
  initialRating?: number;
  initialComment?: string;
  initialPhotos?: string[];
  onSubmit: (data: {
    rating: number;
    comment: string;
    photos: string[];
  }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function ReviewForm({
  initialRating = 0,
  initialComment = '',
  initialPhotos = [],
  onSubmit,
  onCancel,
  submitLabel = 'Publicar avaliação',
  isSubmitting = false,
}: ReviewFormProps) {
  const { user } = useSessionContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Selecione uma avaliação de 1 a 5 estrelas');
      return;
    }

    if (!comment.trim()) {
      toast.error('Escreva um comentário sobre sua experiência');
      return;
    }

    await onSubmit({ rating, comment: comment.trim(), photos });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    if (photos.length + files.length > REVIEW_MAX_PHOTOS) {
      toast.error(`Você pode adicionar no máximo ${REVIEW_MAX_PHOTOS} fotos`);
      return;
    }

    if (!user?.id) {
      toast.error('Faça login para adicionar fotos');
      return;
    }

    setIsUploadingPhotos(true);

    try {
      const uploadResults = await Promise.all(
        files.map((file) => mediaService.uploadPostImage(user.id, file)),
      );

      const urls = uploadResults.map((r) => r.url);
      setPhotos((prev) => [...prev, ...urls]);
    } catch (error) {
      toast.error('Erro ao enviar fotos. Tente novamente.');
    } finally {
      setIsUploadingPhotos(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const activeRating = hoveredRating || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div className="space-y-2">
        <Label>Sua avaliação *</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              const isActive = starValue <= activeRating;

              return (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${starValue} estrelas`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      isActive ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {activeRating > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {RATING_LABELS[activeRating]}
            </span>
          )}
        </div>
      </div>

      {/* Comentário */}
      <div className="space-y-2">
        <Label htmlFor="review-comment">Conte sobre sua experiência *</Label>
        <Textarea
          id="review-comment"
          placeholder="O que você achou da comida, atendimento e entrega?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">{comment.length}/1000 caracteres</p>
      </div>

      {/* Fotos */}
      <div className="space-y-2">
        <Label>Adicionar fotos (opcional)</Label>
        <p className="text-xs text-muted-foreground">
          Compartilhe fotos do seu pedido (máximo {REVIEW_MAX_PHOTOS})
        </p>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <div key={photo} className="group relative">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remover foto ${index + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < REVIEW_MAX_PHOTOS && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              aria-label="Selecionar fotos"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingPhotos}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingPhotos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Adicionar fotos
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || isUploadingPhotos || rating === 0 || !comment.trim()}
        >
          {isSubmitting ? 'Publicando...' : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isUploadingPhotos}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
