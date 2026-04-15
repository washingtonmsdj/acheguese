/**
 * 🏆 EMPTY STATE - Estado vazio da lista de vagas
 */

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

interface EmptyStateProps {
  onClearFilters: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <motion.div {...fadeUp} className="text-center py-16">
      <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-foreground mb-2">
        Nenhuma vaga encontrada
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Tente ajustar os filtros ou buscar por outro termo
      </p>
      <Button variant="outline" onClick={onClearFilters} className="rounded-xl">
        Limpar filtros
      </Button>
    </motion.div>
  );
}
