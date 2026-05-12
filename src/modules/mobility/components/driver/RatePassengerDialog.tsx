import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Star, User, Clock, DollarSign, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface RatePassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: {
    rating: number;
    behavior_rating: number;
    punctuality_rating: number;
    payment_rating: number;
    comment: string;
  }) => Promise<void>;
  passengerName: string;
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: LucideIcon;
}

export function RatePassengerDialog({
  open,
  onOpenChange,
  onSubmit,
  passengerName,
}: RatePassengerDialogProps) {
  const [rating, setRating] = useState(5);
  const [behaviorRating, setBehaviorRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [paymentRating, setPaymentRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        rating,
        behavior_rating: behaviorRating,
        punctuality_rating: punctualityRating,
        payment_rating: paymentRating,
        comment,
      });
      onOpenChange(false);
      // Reset
      setRating(5);
      setBehaviorRating(5);
      setPunctualityRating(5);
      setPaymentRating(5);
      setComment("");
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label, icon: Icon }: StarRatingProps) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm">{label}</Label>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Passageiro</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com {passengerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avaliação Geral */}
          <StarRating
            value={rating}
            onChange={setRating}
            label="Avaliação Geral"
            icon={Star}
          />

          {/* Comportamento */}
          <StarRating
            value={behaviorRating}
            onChange={setBehaviorRating}
            label="Comportamento"
            icon={User}
          />

          {/* Pontualidade */}
          <StarRating
            value={punctualityRating}
            onChange={setPunctualityRating}
            label="Pontualidade"
            icon={Clock}
          />

          {/* Pagamento */}
          <StarRating
            value={paymentRating}
            onChange={setPaymentRating}
            label="Pagamento"
            icon={DollarSign}
          />

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte como foi a experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
