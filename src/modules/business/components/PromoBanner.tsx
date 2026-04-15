import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Sparkles, Tag, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
interface PromoBannerProps {
  title: string;
  description: string;
  discount?: string;
  validUntil?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  variant?: "default" | "gradient" | "minimal";
}

export default function PromoBanner({
  title,
  description,
  discount,
  validUntil,
  ctaText = "Ver Promoção",
  onCtaClick,
  variant = "gradient",
}: PromoBannerProps) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    gradient:
      "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white",
    minimal: "bg-secondary border-2 border-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className={`p-6 mb-6 overflow-hidden relative ${variants[variant]}`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                <Tag className="h-3 w-3 mr-1" />
                Promoção Especial
              </Badge>
            </div>

            <h3 className="text-2xl font-bold font-display mb-2 flex items-center gap-2">
              {title}
              {discount && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-lg">
                  {discount}
                </span>
              )}
            </h3>

            <p className="text-sm opacity-90 mb-3">{description}</p>

            {validUntil && (
              <div className="flex items-center gap-2 text-xs opacity-80">
                <Clock className="h-4 w-4" />
                <span>Válido até {validUntil}</span>
              </div>
            )}
          </div>

          {onCtaClick && (
            <Button
              onClick={onCtaClick}
              size="lg"
              variant={variant === "minimal" ? "default" : "secondary"}
              className="gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
