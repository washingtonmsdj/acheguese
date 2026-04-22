/**
 * EmpresaProximasSection
 * 
 * Seção de empresas próximas com cards clicáveis.
 * Link para ver todas as empresas.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import { Navigation, ChevronRight } from 'lucide-react';
import { NearbyBusinessCard } from '../components/cards';
import type { EmpresaProximasSectionProps } from './types';

export function EmpresaProximasSection({
  nearbyBusinesses,
  currentBusinessId,
  navigate,
}: EmpresaProximasSectionProps) {
  const filteredBusinesses = nearbyBusinesses
    .filter((b) => b.id !== currentBusinessId)
    .slice(0, 4);

  if (filteredBusinesses.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Empresas próximas
            </h2>
          </div>
          <button
            onClick={() => navigate?.('/empresas-landing')}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredBusinesses.map((biz) => (
            <NearbyBusinessCard
              key={biz.id}
              business={biz}
              onClick={() => navigate?.(`/empresa/${biz.id}`)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
