/**
 * SellersGrid - Grid de vendedores
 * 
 * SSOT: Componente reutilizável de grid de vendedores
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { VendedorCard } from "@/modules/classifieds/components/VendedorCard";
import { useClassifiedUrls } from "@/modules/classifieds/hooks/useClassifiedUrls";
import type { Vendedor } from "../../sections/types";

// ============================================
// Props
// ============================================

export interface SellersGridProps {
  readonly vendedores: readonly Vendedor[];
  readonly isLoading: boolean;
}

// ============================================
// Component
// ============================================

export function SellersGrid({ vendedores, isLoading }: SellersGridProps) {
  const navigate = useNavigate();
  const classifiedUrls = useClassifiedUrls();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (vendedores.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-16 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Nenhum vendedor encontrado
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Nenhum vendedor ativo nesta região
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {vendedores.map((v, i) => (
        <VendedorCard
          key={v.id}
          vendedor={v}
          index={i}
          onClick={() => navigate(classifiedUrls.seller(v.id))}
        />
      ))}
    </div>
  );
}
