/**
 * EmpresaFotosSection
 * 
 * Seção de galeria de fotos em grid responsivo.
 * Hover effects e contador de fotos.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import type { EmpresaFotosSectionProps } from './types';

export function EmpresaFotosSection({
  fotos,
  businessName,
}: EmpresaFotosSectionProps) {
  if (!fotos || fotos.length === 0) return null;

  return (
    <section className="mx-auto mt-6 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Fotos</h2>
          <span className="text-xs text-muted-foreground">({fotos.length})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
            >
              <img
                src={url}
                alt={`${businessName} - Foto ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
