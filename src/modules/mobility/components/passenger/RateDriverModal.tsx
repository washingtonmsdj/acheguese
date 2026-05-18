import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Star, Car } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/modules/mobility/types";

type RateRide = RideRequest & {
  driver?: {
    name?: string | null;
    vehicle_model?: string | null;
    vehicle_plate?: string | null;
  } | null;
};

interface RateDriverModalProps {
  ride: RateRide | null;
  onClose: () => void;
  onRate: (rideId: string, rating: number, comment: string) => void;
}

export function RateDriverModal({
  ride,
  onClose,
  onRate,
}: RateDriverModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!ride) return;
    onRate(ride.id, rating, comment);
    setRating(5);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={!!ride} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Avaliar Motorista
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Avalie sua experiência com o motorista
        </DialogDescription>

        {ride?.driver && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
              {ride.driver.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {ride.driver.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {ride.driver.vehicle_model} • {ride.driver.vehicle_plate}
              </p>
            </div>
          </div>
        )}

        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">Como foi sua viagem?</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-125"
                aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    value <= (hoveredRating || rating)
                      ? "text-warning fill-warning"
                      : "text-muted",
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {rating === 1 && "Péssimo"}
            {rating === 2 && "Ruim"}
            {rating === 3 && "Regular"}
            {rating === 4 && "Bom"}
            {rating === 5 && "Excelente"}
          </p>
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Deixe um comentário (opcional)..."
          className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground resize-none h-20"
          maxLength={200}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl"
          >
            Pular
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-warning/20"
          >
            Enviar Avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
