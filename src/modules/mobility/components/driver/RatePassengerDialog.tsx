import { useState } from "react";
import {
  Clock,
  DollarSign,
  Loader2,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
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

function StarRating({ value, onChange, label, icon: Icon }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Label className="text-sm">{label}</Label>
      </div>
      <div className="flex gap-1" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = star <= value;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="rounded-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"} em ${label}`}
              aria-pressed={star === value}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  selected
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/35",
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
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

  const resetForm = () => {
    setRating(5);
    setBehaviorRating(5);
    setPunctualityRating(5);
    setPaymentRating(5);
    setComment("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        rating,
        behavior_rating: behaviorRating,
        punctuality_rating: punctualityRating,
        payment_rating: paymentRating,
        comment: comment.trim(),
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar passageiro</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com {passengerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <StarRating
            value={rating}
            onChange={setRating}
            label="Avaliação geral"
            icon={Star}
          />
          <StarRating
            value={behaviorRating}
            onChange={setBehaviorRating}
            label="Comportamento"
            icon={User}
          />
          <StarRating
            value={punctualityRating}
            onChange={setPunctualityRating}
            label="Pontualidade"
            icon={Clock}
          />
          <StarRating
            value={paymentRating}
            onChange={setPaymentRating}
            label="Pagamento"
            icon={DollarSign}
          />

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte como foi a experiência..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
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
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Enviar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
