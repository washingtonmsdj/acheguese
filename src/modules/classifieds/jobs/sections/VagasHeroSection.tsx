/**
 * VagasHeroSection - Hero e banner promocional
 * 
 * SSOT: Section modular
 * Sem gambiarras: Props tipadas
 */

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Briefcase } from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import type { VagasHeroSectionProps } from "./types";
import heroImg from "@/assets/empresas-hero.jpg";

export function VagasHeroSection({
  cityName,
  total,
  user,
  permission,
  isLoadingPermission,
  onOpenPublish,
}: VagasHeroSectionProps) {
  return (
    <>
      {/* Promo Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              Contrate talentos locais!
            </span>{" "}
            Publique vagas gratuitamente com perfil empresa ativo.
          </span>
          <button
            onClick={onOpenPublish}
            className="text-primary font-semibold hover:underline ml-1 flex items-center gap-0.5"
          >
            Publicar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {user && !isLoadingPermission && !permission.canPublish && (
          <p className="text-center text-xs text-warning pb-2 px-4">
            {permission.message}
          </p>
        )}
      </motion.div>

      {/* Hero */}
      <CanonicalHero
        moduleName="Vagas"
        moduleIcon={Briefcase}
        territoryName={cityName}
        territoryFallback="Sua Região"
        title="Vagas de Emprego"
        titleHighlight={`em ${cityName}`}
        subtitle={`${total} oportunidades disponíveis. Encontre o emprego ideal na sua região.`}
        backgroundImage={heroImg}
      />
    </>
  );
}
