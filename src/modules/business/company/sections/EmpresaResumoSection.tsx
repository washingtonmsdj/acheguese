/**
 * EmpresaResumoSection
 * 
 * Seção de resumo com descrição, quick facts e especialidades.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import { Info, Calendar, Star, ThumbsUp, BadgeCheck } from 'lucide-react';
import type { EmpresaResumoSectionProps } from './types';

export function EmpresaResumoSection({
  business,
  yearsActive,
}: EmpresaResumoSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Sobre a empresa
          </h2>
        </div>

        {business.description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            {business.description}
          </p>
        )}

        {/* Quick facts */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
          {yearsActive && (
            <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Há {yearsActive}{" "}
              no bairro
            </span>
          )}
          {business.total_reviews > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg">
              <Star className="h-3.5 w-3.5 text-primary" />{" "}
              {business.total_reviews} avaliações
            </span>
          )}
          {(business.recommendations_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />{" "}
              {business.recommendations_count} recomendações
            </span>
          )}
          {business.is_verified && (
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/20">
              <BadgeCheck className="h-3.5 w-3.5" /> Empresa verificada
            </span>
          )}
        </div>

        {/* Specialties */}
        {business.especialidades && business.especialidades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Especialidades
            </p>
            <div className="flex flex-wrap gap-2">
              {business.especialidades.map((esp, idx) => (
                <span
                  key={idx}
                  className="bg-primary/5 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/10"
                >
                  {esp}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
