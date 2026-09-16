import { useEffect, useState } from "react";
import { Car, Loader2, Star } from "lucide-react";

import type { RideRequest } from "@/core/mobility/types";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";

type RateRide = RideRequest & {
  driver?: {
    name?: string | null;
    vehicle_model?: string | null;
    vehicle_plate?: string | null;
  } | null;
};

type RateResult = { success: boolean } | void;

interface RateDriverModalProps {
  ride: RateRide | null;
  onClose: () => void;
  onRate: (
    rideId: string,
    rating: number,
    comment: string,
  ) => RateResult | Promise<RateResult>;
}

export function RateDriverModal({
  ride,
  onClose,
  onRate,
}: RateDriverModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(5);
    setHoveredRating(0);
    setComment("");
    setSubmitting(false);
  }, [ride?.id]);

  const handleSubmit = async () => {
    if (!ride || submitting) return;

    setSubmitting(true);
    try {
      const result = await onRate(ride.id, rating, comment.trim());
      if (!result || result.success !== true) return;
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const driverName = ride?.driver?.name?.trim() || "Motorista";
  const vehicleDetails = [
    ride?.driver?.vehicle_model,
    ride?.driver?.vehicle_plate,
  ].filter(Boolean);

  return (
    <Dialog
      open={Boolean(ride)}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Star className="h-5 w-5 text-warning" aria-hidden="true" />
            Avaliar motorista
          </DialogTitle>
          <DialogDescription>
            Avalie sua experiência com o motorista desta corrida.
          </DialogDescription>
        </DialogHeader>

        {ride?.driver ? (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-category-mobility/15 font-bold text-category-mobility">
              {driverName.charAt(0).toUpperCase() || <Car className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {driverName}
              </p>
              {vehicleDetails.length > 0 ? (
                <p className="truncate text-xs text-muted-foreground">
                  {vehicleDetails.join(" • ")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="py-4 text-center">
          <p className="mb-3 text-sm text-muted-foreground">Como foi sua viagem?</p>
          <div
            className="flex items-center justify-center gap-2"
            role="radiogroup"
            aria-label="Nota da corrida"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                disabled={submitting}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Avaliar com ${value} estrela${value > 1 ? "s" : ""}`}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    value <= (hoveredRating || rating)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/40",
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {rating === 1 && "Péssimo"}
            {rating === 2 && "Ruim"}
            {rating === 3 && "Regular"}
            {rating === 4 && "Bom"}
            {rating === 5 && "Excelente"}
          </p>
        </div>

        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Deixe um comentário (opcional)..."
          className="h-20 resize-none border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
          maxLength={200}
          disabled={submitting}
          aria-label="Comentário da avaliação"
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={submitting}
            className="rounded-xl"
          >
            Pular
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            aria-busy={submitting}
            className="rounded-xl bg-warning font-semibold text-warning-foreground hover:bg-warning/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Enviando...
              </>
            ) : (
              "Enviar avaliação"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
