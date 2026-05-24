/**
 * ClassifiedsHeroSection - Hero da página de classificados
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import heroImg from "@/assets/servicos-hero.jpg";
import type { ClassifiedsHeroSectionProps } from "./types";

export function ClassifiedsHeroSection({
  territoryName,
  activeCount,
  onNewClassificado,
}: ClassifiedsHeroSectionProps) {
  return (
    <section className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          {/* Territory Badge */}
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Classificados
            </span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-sm text-primary">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">{territoryName}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Compre e Venda{" "}
            <span className="text-primary">em {territoryName}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground mb-6">
            {activeCount > 0
              ? `${activeCount} anúncios disponíveis em ${territoryName}`
              : `Móveis, eletrônicos, veículos e muito mais. Anúncios gratuitos de pessoas da sua comunidade.`}
          </p>

          {/* CTA */}
          <Button onClick={onNewClassificado} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Anunciar Grátis
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
