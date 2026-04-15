import React from "react";
import { MapPin, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";

interface SellerCardProps {
  name: string;
  avatar?: string;
  neighborhood?: string;
  rating?: number;
  reviewsCount?: number;
  sellerId?: string;
  onNavigate?: () => void;
}

export function SellerCard({
  name,
  avatar,
  neighborhood,
  rating,
  reviewsCount,
  sellerId,
  onNavigate,
}: SellerCardProps) {
  const hasRating = (reviewsCount ?? 0) > 0;
  const isClickable = !!sellerId && !!onNavigate;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      onClick={isClickable ? onNavigate : undefined}
      className={cn(
        "mt-4 bg-card rounded-2xl border p-4",
        isClickable &&
          "cursor-pointer hover:border-primary/30 transition-colors",
      )}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
        Vendedor
      </p>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/10">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-primary">{name[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{name}</p>
          <div className="flex items-center gap-2">
            {neighborhood && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {neighborhood}
              </p>
            )}
            {hasRating && (
              <span className="flex items-center gap-0.5 text-xs text-warning font-medium">
                <Star className="h-3 w-3 fill-current" />
                {rating}{" "}
                <span className="text-muted-foreground font-normal">
                  ({reviewsCount})
                </span>
              </span>
            )}
          </div>
        </div>
        {isClickable && (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
    </motion.div>
  );
}
