/**
 * ClassifiedsFooterSection - Footer com banners e CTA
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ClassifiedsFooterSectionProps } from "./types";

export function ClassifiedsFooterSection({
  navigate,
  onNewClassificado,
}: ClassifiedsFooterSectionProps) {
  return (
    <>
      {/* Mini Banner Patrocínio */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate("/empresas/cadastrar")}
        className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-primary/10 via-card to-primary/10 border border-primary/15 p-3 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
        aria-label="Anunciar marca cadastrando uma empresa"
      >
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Megaphone className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-foreground">
            Anuncie sua marca aqui
          </p>
          <p className="text-[9px] text-muted-foreground">
            Alcance milhares de pessoas na região
          </p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
      </motion.button>

      {/* CTA Banner Final */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-4 mb-6 mt-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border border-primary/20 p-5 text-center"
      >
        <h3 className="text-sm font-bold font-display text-foreground mb-1">
          Tem algo pra vender? 🚀
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Anuncie grátis e alcance milhares de pessoas na sua região
        </p>
        <Button
          size="sm"
          className="rounded-full shadow-md shadow-primary/20"
          onClick={onNewClassificado}
        >
          Criar anúncio grátis
        </Button>
      </motion.div>
    </>
  );
}
