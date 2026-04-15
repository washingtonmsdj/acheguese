import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import type { ProfessionalReview } from "@/modules/services/hooks/useProfessionalReviews";

interface ProfessionalReviewFormProps {
  userReview: ProfessionalReview | null;
  onSubmit: (rating: number, comment: string) => Promise<boolean>;
  onCancel: () => void;
}

export function ProfessionalReviewForm({
  userReview,
  onSubmit,
  onCancel,
}: ProfessionalReviewFormProps) {
  const [rating, setRating] = useState(userReview?.rating || 5);
  const [comment, setComment] = useState(userReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await onSubmit(rating, comment);
    if (success) {
      onCancel(); // Close form on success
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold">
        {userReview ? "Editar avaliação" : "Avaliar profissional"}
      </h3>

      {/* Star Rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <Star
              className={`h-6 w-6 ${
                n <= rating
                  ? "text-warning fill-warning"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Deixe um comentário (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          Enviar
        </Button>
      </div>
    </div>
  );
}
