/**
 * VagasStates — Loading, Empty, Error states para vagas
 */

import { motion } from "framer-motion";
import { Briefcase, SearchX, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function VagasLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-5 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function VagasEmpty({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <SearchX className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 font-heading">
        {hasFilters ? "Nenhuma vaga encontrada" : "Sem vagas disponíveis"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        {hasFilters
          ? "Tente ajustar os filtros ou buscar por outro termo para encontrar vagas."
          : "No momento não há vagas publicadas nesta região. Volte em breve!"}
      </p>
      {hasFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
        >
          Limpar filtros
        </Button>
      )}
    </motion.div>
  );
}

export function VagasError({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive/60" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Erro ao carregar vagas</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        Não foi possível carregar as vagas. Verifique sua conexão e tente novamente.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </motion.div>
  );
}
