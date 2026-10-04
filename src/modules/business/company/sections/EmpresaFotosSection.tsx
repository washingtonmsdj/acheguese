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
import { SafeImage } from '@/shared/components/security';
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
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-territory-action-on-image" />
          <h2 className="text-lg font-bold text-territory-on-image">Fotos</h2>
          <span className="text-xs text-territory-on-image/48">({fotos.length})</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl"
            >
              <SafeImage
                src={url}
                alt={`${businessName} - Foto ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-territory-image-overlay/0 transition-colors group-hover:bg-territory-image-overlay/20" />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
