import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { motion } from "framer-motion";

interface ClassificadosHeaderProps {
  activeCount: number;
  onNewClassificado: () => void;
}

export function ClassificadosHeader({
  activeCount,
  onNewClassificado,
}: ClassificadosHeaderProps) {
  return (
    <div className="relative px-4 pt-5 pb-4 bg-gradient-to-br from-primary/8 via-background to-accent/5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Classificados
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount > 0
              ? `${activeCount} anúncios disponíveis`
              : "Compre e venda no seu bairro"}
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            className="rounded-full gap-1.5 shadow-md"
            onClick={onNewClassificado}
            aria-label="Criar novo anúncio"
          >
            <Plus className="h-4 w-4" />
            Anunciar
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
